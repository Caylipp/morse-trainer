import { BOX_MINUTES, dueCount, MASTERED_BOX, masteredCount, MAX_LEARNING, pickNext, review, SrsState } from '../srs';

const MIN = 60_000;
const IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

describe('srs', () => {
  it('moves up on correct and schedules the next review', () => {
    const s = review({}, 'A', true, 0);
    expect(s.A.box).toBe(1);
    expect(s.A.due).toBe(BOX_MINUTES[1] * MIN);
    expect(s.A.seen).toBe(1);
  });

  it('is forgiving: a mistake only drops one box, never below 0', () => {
    let s: SrsState = {};
    for (let i = 0; i < 4; i++) s = review(s, 'A', true, 0);
    expect(s.A.box).toBe(4);
    s = review(s, 'A', false, 0);
    expect(s.A.box).toBe(3);
    s = review(review(review(review(s, 'A', false, 0), 'A', false, 0), 'A', false, 0), 'A', false, 0);
    expect(s.A.box).toBe(0);
    expect(s.A.correct).toBe(4);
  });

  it('introduces new cards in order when nothing is due', () => {
    expect(pickNext({}, IDS, 0)).toBe('A');
    expect(pickNext({}, IDS, 0, 'A')).toBe('B');
  });

  it('prefers due cards, lowest box first', () => {
    let s: SrsState = {};
    s = review(s, 'A', true, 0); // box 1, due in 10 min
    s = review(s, 'B', true, 0);
    s = review(s, 'B', true, 0); // box 2, due in 1 day
    expect(pickNext(s, IDS, 11 * MIN)).toBe('A');
    expect(pickNext(s, IDS, 2 * 24 * 60 * MIN, 'A')).toBe('B');
  });

  it('stops adding new cards while too many are still shaky', () => {
    let s: SrsState = {};
    for (const id of IDS.slice(0, MAX_LEARNING)) s = review(s, id, true, 0); // alle Kasten 1, noch nicht fällig
    const next = pickNext(s, IDS, 1 * MIN);
    expect(IDS.slice(0, MAX_LEARNING)).toContain(next);
  });

  it('adds new cards again once the others are learned', () => {
    let s: SrsState = {};
    for (const id of IDS.slice(0, MAX_LEARNING)) for (let i = 0; i < 3; i++) s = review(s, id, true, 0);
    expect(pickNext(s, IDS, 1 * MIN)).toBe('E');
  });

  it('counts due and mastered cards', () => {
    let s: SrsState = {};
    for (let i = 0; i < MASTERED_BOX; i++) s = review(s, 'A', true, 0);
    s = review(s, 'B', true, 0);
    expect(masteredCount(s, IDS)).toBe(1);
    expect(dueCount(s, IDS, 11 * MIN)).toBe(1);
  });

  it('handles empty and single lists', () => {
    expect(pickNext({}, [], 0)).toBeUndefined();
    expect(pickNext({}, ['A'], 0, 'A')).toBe('A');
  });
});
