/**
 * Live-Dekodierung von Tastendrücken.
 *
 * Die Klasse ist rein (keine Timer, keine Plattform-APIs): Zeitstempel werden
 * von außen übergeben. Die UI ruft `press`, `release` und regelmäßig `tick` auf
 * und reagiert auf die zurückgegebenen Ereignisse.
 *
 * Punkt/Strich-Trennung: Es werden getrennte Mittelwerte für Punkt- und
 * Strichlängen geführt; die Schwelle liegt in der Mitte. So passt sich der
 * Decoder an Tempo *und* persönliches Punkt/Strich-Verhältnis an.
 * Enthalten die letzten Drücke zwei klar getrennte Längen, werden die Mittelwerte
 * per 2-Means-Clustering direkt daraus bestimmt – so rastet der Decoder auch bei
 * einem stark abweichenden Starttempo nach wenigen Zeichen ein.
 *
 * Pausen: Ab `letterGapUnits` Einheiten Stille ist ein Buchstabe fertig,
 * ab `wordGapUnits` Einheiten ein Wort (Standard 3 bzw. 7 Einheiten, die
 * Schwellen liegen dazwischen, damit auch sauber gegebene Pausen erkannt werden).
 */

import { decodeChar, MorseSymbol } from './morse';

export type DecoderEvent =
  | { type: 'symbol'; symbol: MorseSymbol; duration: number; code: string }
  | { type: 'letter'; code: string; char: string | undefined }
  | { type: 'word' };

export interface DecoderOptions {
  /** Start-Einheit in ms (aus dem eingestellten Tempo). */
  initialUnit: number;
  /** Tempo aus den Tastendrücken lernen. */
  adaptive: boolean;
  /** Buchstabenpause in Einheiten (Standard 2,5 – zwischen 1 und 3). */
  letterGapUnits: number;
  /** Wortpause in Einheiten (Standard 5 – zwischen 3 und 7). */
  wordGapUnits: number;
  /** Gewicht neuer Messungen für die gleitenden Mittelwerte (0..1). */
  smoothing: number;
}

export const DEFAULT_DECODER_OPTIONS: DecoderOptions = {
  initialUnit: 100,
  adaptive: true,
  letterGapUnits: 2.5,
  wordGapUnits: 5,
  smoothing: 0.25,
};

const MIN_UNIT = 25;
/** Anzahl der letzten Druckdauern, die für das Clustering betrachtet werden. */
const HISTORY = 16;
/** Ab diesem Verhältnis der Cluster-Mitten gelten die Drücke als Punkte *und* Striche. */
const BIMODAL_RATIO = 2;
/** Längere Drücke fließen nur bis zu diesem Vielfachen der bisherigen Strichlänge ins Lernen ein. */
const OUTLIER_FACTOR = 2;
const MAX_UNIT = 800;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export class MorseDecoder {
  private opts: DecoderOptions;
  private dotAvg: number;
  private dashAvg: number;
  private pressedAt: number | null = null;
  private lastReleaseAt: number | null = null;
  private wordClosed = true;
  private history: number[] = [];

  /** Punkte/Striche des Buchstabens, der gerade entsteht. */
  code = '';
  /** Bisher dekodierter Text. */
  text = '';

  constructor(options: Partial<DecoderOptions> = {}) {
    this.opts = { ...DEFAULT_DECODER_OPTIONS, ...options };
    this.dotAvg = this.opts.initialUnit;
    this.dashAvg = 3 * this.opts.initialUnit;
  }

  /** Aktualisiert Optionen. Eine neue `initialUnit` setzt das gelernte Tempo zurück. */
  configure(options: Partial<DecoderOptions>): void {
    const resetTempo =
      options.initialUnit !== undefined && options.initialUnit !== this.opts.initialUnit;
    this.opts = { ...this.opts, ...options };
    if (resetTempo) this.resetTempo();
  }

  resetTempo(): void {
    this.history = [];
    this.dotAvg = this.opts.initialUnit;
    this.dashAvg = 3 * this.opts.initialUnit;
  }

  /** Geschätzte Länge einer Einheit in ms. */
  get unit(): number {
    return (this.dotAvg + this.dashAvg / 3) / 2;
  }

  /** Grenze zwischen Punkt und Strich in ms. */
  get threshold(): number {
    return (this.dotAvg + this.dashAvg) / 2;
  }

  get letterGap(): number {
    return this.opts.letterGapUnits * this.unit;
  }

  get wordGap(): number {
    return this.opts.wordGapUnits * this.unit;
  }

  /** Nichts mehr zu tun: nicht gedrückt, kein offener Buchstabe, Wort abgeschlossen. */
  get idle(): boolean {
    return this.pressedAt === null && !this.code && this.wordClosed;
  }

  get isPressed(): boolean {
    return this.pressedAt !== null;
  }

  press(t: number): DecoderEvent[] {
    if (this.pressedAt !== null) return [];
    const events = this.tick(t);
    this.pressedAt = t;
    return events;
  }

  release(t: number): DecoderEvent[] {
    if (this.pressedAt === null) return [];
    const duration = Math.max(0, t - this.pressedAt);
    this.pressedAt = null;
    this.lastReleaseAt = t;
    this.wordClosed = false;

    const symbol: MorseSymbol = this.opts.adaptive
      ? this.learn(duration)
      : duration < this.threshold
        ? '.'
        : '-';
    this.code += symbol;
    return [{ type: 'symbol', symbol, duration, code: this.code }];
  }

  /** Prüft, ob durch Stille ein Buchstabe oder Wort abgeschlossen wurde. */
  tick(t: number): DecoderEvent[] {
    if (this.pressedAt !== null || this.lastReleaseAt === null) return [];
    const gap = t - this.lastReleaseAt;
    const events: DecoderEvent[] = [];
    if (this.code && gap >= this.letterGap) {
      events.push(this.commitLetter());
    }
    if (!this.wordClosed && !this.code && gap >= this.wordGap) {
      this.wordClosed = true;
      if (this.text && !this.text.endsWith(' ')) this.text += ' ';
      events.push({ type: 'word' });
    }
    return events;
  }

  /** Beendet den aktuellen Buchstaben sofort (z. B. per Button). */
  flush(): DecoderEvent[] {
    return this.code ? [this.commitLetter()] : [];
  }

  /** Anteil der Buchstabenpause, der seit dem letzten Loslassen vergangen ist (0..1). */
  gapProgress(t: number): number {
    if (this.pressedAt !== null || this.lastReleaseAt === null || !this.code) return 0;
    return clamp((t - this.lastReleaseAt) / this.letterGap, 0, 1);
  }

  /** Aktuelle Druckdauer in ms (0, wenn nicht gedrückt). */
  heldFor(t: number): number {
    return this.pressedAt === null ? 0 : t - this.pressedAt;
  }

  backspace(): void {
    if (this.code) {
      this.code = '';
    } else {
      this.text = this.text.trimEnd().slice(0, -1);
    }
  }

  clear(): void {
    this.code = '';
    this.text = '';
    this.lastReleaseAt = null;
    this.wordClosed = true;
  }

  private commitLetter(): DecoderEvent {
    const code = this.code;
    const char = decodeChar(code);
    this.code = '';
    this.text += char ?? '*';
    return { type: 'letter', code, char };
  }

  /** Lernt aus einer Druckdauer und klassifiziert sie. */
  private learn(duration: number): MorseSymbol {
    // Ein einzelner sehr langer Druck (Festhalten, Ruckler) darf das Clustering
    // nicht kippen – sonst gälte er als "Strich" und echte Striche als Punkte.
    // Echte Tempowechsel setzen sich trotzdem durch, weil die Grenze mitwächst.
    const sample = Math.min(duration, OUTLIER_FACTOR * this.dashAvg);
    this.history = [...this.history, sample].slice(-HISTORY);
    const clusters = twoMeans(this.history);
    if (clusters && clusters[1] / clusters[0] >= BIMODAL_RATIO) {
      this.dotAvg = clamp(clusters[0], MIN_UNIT, MAX_UNIT);
      this.dashAvg = clamp(clusters[1], 2 * MIN_UNIT, 3 * MAX_UNIT);
      return duration < this.threshold ? '.' : '-';
    }

    // Nur eine Sorte Drücke in letzter Zeit: gegen die bisherige Schwelle einordnen.
    const symbol: MorseSymbol = duration < this.threshold ? '.' : '-';
    // Die ersten Drücke zählen stärker (laufender Mittelwert), danach gleitend.
    const a = Math.max(this.opts.smoothing, 1 / this.history.length);
    // Jede Messung verschiebt beide Mittelwerte (Punkt : Strich = 1 : 3), damit
    // sich das Tempo auch anpasst, wenn gerade nur eine Sorte getastet wird.
    const dot = symbol === '.' ? sample : sample / 3;
    this.dotAvg = clamp(this.dotAvg + a * (dot - this.dotAvg), MIN_UNIT, MAX_UNIT);
    this.dashAvg = clamp(this.dashAvg + a * (3 * dot - this.dashAvg), 2 * MIN_UNIT, 3 * MAX_UNIT);
    // Punkt und Strich müssen unterscheidbar bleiben (mindestens Faktor 1,8).
    if (this.dashAvg < 1.8 * this.dotAvg) {
      const mid = (this.dotAvg + this.dashAvg) / 2;
      this.dotAvg = mid / 1.4;
      this.dashAvg = mid * 1.4;
    }
    return symbol;
  }
}

/** 1D-2-Means: liefert [kurze Mitte, lange Mitte] oder `undefined` bei zu wenig Daten. */
export function twoMeans(values: number[]): [number, number] | undefined {
  if (values.length < 2) return undefined;
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (lo === hi) return undefined;
  for (let iter = 0; iter < 10; iter++) {
    const split = (lo + hi) / 2;
    const short = values.filter((v) => v < split);
    const long = values.filter((v) => v >= split);
    const nlo = short.reduce((a, b) => a + b, 0) / short.length;
    const nhi = long.reduce((a, b) => a + b, 0) / long.length;
    if (nlo === lo && nhi === hi) break;
    lo = nlo;
    hi = nhi;
  }
  return [lo, hi];
}
