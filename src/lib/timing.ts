/**
 * Timing nach dem PARIS-Standard inklusive Farnsworth-Abständen.
 *
 * - 1 Einheit (ms) = 1200 / WPM
 * - Punkt = 1, Strich = 3, Pause im Zeichen = 1,
 *   Pause zwischen Zeichen = 3, Pause zwischen Wörtern = 7 Einheiten.
 * - Farnsworth: Zeichen werden mit `charWpm` gegeben, die Pausen zwischen
 *   Zeichen und Wörtern werden so gestreckt, dass sich `effectiveWpm` ergibt
 *   (Formel nach ARRL, Jon Bloom).
 */

import { tokenizeText, MORSE_TABLE } from './morse';

export function unitMs(wpm: number): number {
  return 1200 / wpm;
}

export function wpmFromUnit(unit: number): number {
  return 1200 / unit;
}

export interface Spacing {
  /** Länge einer Einheit innerhalb der Zeichen (ms) */
  unit: number;
  /** Pause zwischen Zeichen (ms) */
  charGap: number;
  /** Pause zwischen Wörtern (ms) */
  wordGap: number;
}

export function farnsworthSpacing(charWpm: number, effectiveWpm: number): Spacing {
  const unit = unitMs(charWpm);
  if (effectiveWpm >= charWpm) {
    return { unit, charGap: 3 * unit, wordGap: 7 * unit };
  }
  // Gesamtverzögerung pro Wort in Sekunden, verteilt auf 19 Pausen-Einheiten.
  const ta = (60 * charWpm - 37.2 * effectiveWpm) / (charWpm * effectiveWpm);
  return {
    unit,
    charGap: ((3 * ta) / 19) * 1000,
    wordGap: ((7 * ta) / 19) * 1000,
  };
}

/** Ein Abschnitt einer Wiedergabe: Ton an (`on: true`) oder Stille. */
export interface Segment {
  on: boolean;
  duration: number;
  /** Index des Zeichens im flachen Zeichen-Array (nur für Töne). */
  charIndex?: number;
}

/**
 * Baut die Ton/Pause-Folge für einen Text.
 * Liefert zusätzlich die Liste der gespielten Zeichen (für Hervorhebungen).
 */
export function buildSegments(
  text: string,
  spacing: Spacing,
): { segments: Segment[]; chars: string[]; totalMs: number } {
  const words = tokenizeText(text);
  const segments: Segment[] = [];
  const chars: string[] = [];
  words.forEach((word, wi) => {
    if (wi > 0) segments.push({ on: false, duration: spacing.wordGap });
    word.forEach((char, ci) => {
      if (ci > 0) segments.push({ on: false, duration: spacing.charGap });
      const charIndex = chars.length;
      chars.push(char);
      const code = MORSE_TABLE[char];
      [...code].forEach((sym, si) => {
        if (si > 0) segments.push({ on: false, duration: spacing.unit });
        segments.push({ on: true, duration: sym === '.' ? spacing.unit : 3 * spacing.unit, charIndex });
      });
    });
  });
  const totalMs = segments.reduce((sum, s) => sum + s.duration, 0);
  return { segments, chars, totalMs };
}
