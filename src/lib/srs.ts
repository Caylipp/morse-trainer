/**
 * Spaced Repetition (Leitner-Kästen) für Abkürzungen und Q-Codes.
 *
 * Bewusst nachsichtig: Eine falsche Antwort wirft nur einen Kasten zurück (nicht auf 0),
 * neue Karten kommen erst, wenn wenige Karten "wackeln", und es gibt nie Zeitdruck.
 */

/** Wartezeit je Kasten in Minuten: sofort, 10 min, 1 Tag, 3, 7, 21 Tage. */
export const BOX_MINUTES: readonly number[] = [0, 10, 24 * 60, 3 * 24 * 60, 7 * 24 * 60, 21 * 24 * 60];
export const MAX_BOX = BOX_MINUTES.length - 1;
/** Ab diesem Kasten gilt eine Karte als sicher gelernt. */
export const MASTERED_BOX = 3;
/** So viele wackelige Karten (Kasten 0–1) sind erlaubt, bevor keine neuen mehr dazukommen. */
export const MAX_LEARNING = 4;

export interface Card {
  box: number;
  /** Zeitpunkt (ms), ab dem die Karte wieder fällig ist. */
  due: number;
  seen: number;
  correct: number;
}

export type SrsState = Record<string, Card>;

export function review(state: SrsState, id: string, correct: boolean, now: number): SrsState {
  const prev = state[id];
  const box = correct ? Math.min(MAX_BOX, (prev?.box ?? 0) + 1) : Math.max(0, (prev?.box ?? 0) - 1);
  return {
    ...state,
    [id]: {
      box,
      due: now + BOX_MINUTES[box] * 60_000,
      seen: (prev?.seen ?? 0) + 1,
      correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
    },
  };
}

export function isDue(card: Card, now: number): boolean {
  return card.due <= now;
}

export function dueCount(state: SrsState, ids: readonly string[], now: number): number {
  return ids.filter((id) => state[id] && isDue(state[id], now)).length;
}

export function masteredCount(state: SrsState, ids: readonly string[]): number {
  return ids.filter((id) => (state[id]?.box ?? 0) >= MASTERED_BOX).length;
}

/**
 * Wählt die nächste Karte: erst fällige (niedrigster Kasten, dann am längsten fällig),
 * sonst eine neue (in Reihenfolge von `ids`), sonst die als Nächstes fällige.
 * `previous` wird möglichst nicht direkt wiederholt.
 */
export function pickNext(
  state: SrsState,
  ids: readonly string[],
  now: number,
  previous?: string,
): string | undefined {
  if (ids.length === 0) return undefined;
  const pool = ids.length > 1 ? ids.filter((id) => id !== previous) : [...ids];
  const seen = pool.filter((id) => state[id]);
  const learning = ids.filter((id) => state[id] && state[id].box <= 1).length;

  const due = seen.filter((id) => isDue(state[id], now));
  if (due.length > 0) {
    return due.sort((a, b) => state[a].box - state[b].box || state[a].due - state[b].due)[0];
  }
  if (learning < MAX_LEARNING) {
    const fresh = pool.find((id) => !state[id]);
    if (fresh) return fresh;
  }
  if (seen.length > 0) return seen.sort((a, b) => state[a].due - state[b].due)[0];
  return pool[0];
}
