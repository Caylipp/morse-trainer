import {
  initialProgress,
  KOCH_ORDER,
  pickNextChar,
  recordAttempt,
  setLevel,
  unlockedChars,
  UNLOCK_WINDOW,
  windowAccuracy,
} from '../koch';

describe('koch', () => {
  it('starts with K and M', () => {
    expect(unlockedChars(initialProgress())).toEqual(['K', 'M']);
  });

  it('unlocks the next character after enough correct answers', () => {
    let p = initialProgress();
    let unlocked: string | undefined;
    for (let i = 0; i < UNLOCK_WINDOW; i++) {
      const r = recordAttempt(p, i % 2 ? 'K' : 'M', i !== 3); // 1 Fehler = 95 %
      p = r.progress;
      unlocked = r.unlocked ?? unlocked;
    }
    expect(unlocked).toBe('U');
    expect(p.level).toBe(3);
    expect(p.window).toEqual([]);
  });

  it('does not unlock below 90 %', () => {
    let p = initialProgress();
    for (let i = 0; i < UNLOCK_WINDOW; i++) {
      p = recordAttempt(p, 'K', i % 5 !== 0).progress; // 80 %
    }
    expect(p.level).toBe(2);
    expect(windowAccuracy(p)).toBeCloseTo(0.8);
  });

  it('tracks per-character stats', () => {
    let p = initialProgress();
    p = recordAttempt(p, 'K', true).progress;
    p = recordAttempt(p, 'K', false).progress;
    expect(p.stats.K).toEqual({ attempts: 2, correct: 1, recent: [true, false] });
  });

  it('clamps manual levels', () => {
    expect(setLevel(initialProgress(), 0).level).toBe(2);
    expect(setLevel(initialProgress(), 999).level).toBe(KOCH_ORDER.length);
  });

  it('picks only unlocked characters and prefers weak ones', () => {
    let p = initialProgress();
    for (let i = 0; i < 10; i++) p = recordAttempt(p, 'K', false).progress;
    for (const c of ['M', 'U', 'R']) for (let i = 0; i < 10; i++) p = recordAttempt(p, c, true).progress;
    p = setLevel(p, 4);
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 2000; i++) {
      const c = pickNextChar(p, undefined, rnd);
      counts[c] = (counts[c] ?? 0) + 1;
    }
    expect(Object.keys(counts).sort()).toEqual(['K', 'M', 'R', 'U']);
    expect(counts.K).toBeGreaterThan(counts.M);
  });
});
