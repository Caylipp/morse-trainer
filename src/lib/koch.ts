/**
 * Koch-Methode: Man beginnt mit zwei Zeichen und schaltet ein neues frei,
 * sobald die Trefferquote über die letzten Versuche hoch genug ist.
 *
 * Alle Funktionen sind rein und arbeiten auf unveränderlichen Fortschritts-Objekten.
 */

/** Reihenfolge wie bei LCWO.net (Learn CW Online). */
export const KOCH_ORDER: readonly string[] = [
  'K', 'M', 'U', 'R', 'E', 'S', 'N', 'A', 'P', 'T', 'L', 'W', 'I', '.', 'J', 'Z', '=',
  'F', 'O', 'Y', ',', 'V', 'G', '5', '/', 'Q', '9', '2', 'H', '3', '8', 'B', '?', '4',
  '7', 'C', '1', 'D', '6', '0', 'X',
];

export const START_LEVEL = 2;
/** Anzahl der letzten Versuche, über die die Trefferquote berechnet wird. */
export const UNLOCK_WINDOW = 20;
export const UNLOCK_ACCURACY = 0.9;
const RECENT_PER_CHAR = 10;

export interface CharStats {
  attempts: number;
  correct: number;
  /** Letzte Ergebnisse für dieses Zeichen, neuestes zuletzt. */
  recent: boolean[];
}

export interface KochProgress {
  /** Anzahl freigeschalteter Zeichen aus KOCH_ORDER. */
  level: number;
  /** Ergebnisse seit dem letzten Freischalten, neuestes zuletzt. */
  window: boolean[];
  stats: Record<string, CharStats>;
}

export function initialProgress(): KochProgress {
  return { level: START_LEVEL, window: [], stats: {} };
}

export function unlockedChars(progress: KochProgress): string[] {
  return KOCH_ORDER.slice(0, progress.level);
}

export function newestChar(progress: KochProgress): string {
  return KOCH_ORDER[progress.level - 1];
}

export function windowAccuracy(progress: KochProgress): number {
  if (progress.window.length === 0) return 0;
  return progress.window.filter(Boolean).length / progress.window.length;
}

export function charAccuracy(stats: CharStats | undefined): number | undefined {
  if (!stats || stats.recent.length === 0) return undefined;
  return stats.recent.filter(Boolean).length / stats.recent.length;
}

export function isComplete(progress: KochProgress): boolean {
  return progress.level >= KOCH_ORDER.length;
}

export interface AttemptResult {
  progress: KochProgress;
  /** Neu freigeschaltetes Zeichen, falls durch diesen Versuch eines dazukam. */
  unlocked?: string;
}

export function recordAttempt(progress: KochProgress, char: string, correct: boolean): AttemptResult {
  const prev = progress.stats[char] ?? { attempts: 0, correct: 0, recent: [] };
  const stats: CharStats = {
    attempts: prev.attempts + 1,
    correct: prev.correct + (correct ? 1 : 0),
    recent: [...prev.recent, correct].slice(-RECENT_PER_CHAR),
  };
  const window = [...progress.window, correct].slice(-UNLOCK_WINDOW);
  let next: KochProgress = { ...progress, window, stats: { ...progress.stats, [char]: stats } };

  const ready =
    window.length >= UNLOCK_WINDOW &&
    windowAccuracy(next) >= UNLOCK_ACCURACY &&
    !isComplete(next);
  if (ready) {
    next = { ...next, level: next.level + 1, window: [] };
    return { progress: next, unlocked: newestChar(next) };
  }
  return { progress: next };
}

/** Setzt die Stufe manuell (z. B. für Fortgeschrittene). */
export function setLevel(progress: KochProgress, level: number): KochProgress {
  const clamped = Math.max(START_LEVEL, Math.min(KOCH_ORDER.length, Math.round(level)));
  return { ...progress, level: clamped, window: [] };
}

/**
 * Wählt das nächste Übungszeichen. Schwache und neue Zeichen kommen häufiger,
 * direkte Wiederholungen seltener.
 */
export function pickNextChar(
  progress: KochProgress,
  previous?: string,
  random: () => number = Math.random,
): string {
  const chars = unlockedChars(progress);
  const newest = newestChar(progress);
  const weights = chars.map((c) => {
    const acc = charAccuracy(progress.stats[c]);
    let w = 1 + (acc === undefined ? 1.5 : (1 - acc) * 4);
    if (c === newest) w += 1.5;
    if (c === previous) w *= 0.25;
    return w;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (let i = 0; i < chars.length; i++) {
    r -= weights[i];
    if (r < 0) return chars[i];
  }
  return chars[chars.length - 1];
}
