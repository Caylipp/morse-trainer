import { buildSegments, farnsworthSpacing, unitMs, wpmFromUnit } from '../timing';

describe('timing', () => {
  it('uses the PARIS standard', () => {
    expect(unitMs(20)).toBe(60);
    // PARIS + Wortpause = 50 Einheiten
    const { totalMs } = buildSegments('PARIS', farnsworthSpacing(20, 20));
    expect(totalMs).toBeCloseTo(43 * 60); // ohne abschließende Wortpause (7 Einheiten)
  });

  it('stretches gaps with Farnsworth timing', () => {
    const s = farnsworthSpacing(20, 10);
    expect(s.unit).toBe(60);
    expect(s.charGap).toBeGreaterThan(3 * 60);
    expect(s.wordGap / s.charGap).toBeCloseTo(7 / 3);
    // Ein PARIS-Wort inkl. Wortpause dauert bei 10 WPM effektiv 6 s.
    const { totalMs } = buildSegments('PARIS', s);
    expect(totalMs + s.wordGap).toBeCloseTo(6000, -1);
  });

  it('tags tone segments with the character index', () => {
    const { segments, chars } = buildSegments('ET', farnsworthSpacing(20, 20));
    expect(chars).toEqual(['E', 'T']);
    expect(segments).toEqual([
      { on: true, duration: 60, charIndex: 0 },
      { on: false, duration: 180 },
      { on: true, duration: 180, charIndex: 1 },
    ]);
  });

  it('wpmFromUnit is the inverse of unitMs', () => {
    for (const wpm of [5, 12, 20, 35]) {
      expect(wpmFromUnit(unitMs(wpm))).toBeCloseTo(wpm);
    }
    expect(wpmFromUnit(60)).toBe(20);
  });

  it('inserts a 7-unit gap between words', () => {
    const { segments, chars } = buildSegments('E E', farnsworthSpacing(20, 20));
    expect(chars).toEqual(['E', 'E']);
    expect(segments).toEqual([
      { on: true, duration: 60, charIndex: 0 },
      { on: false, duration: 420 },
      { on: true, duration: 60, charIndex: 1 },
    ]);
  });
});
