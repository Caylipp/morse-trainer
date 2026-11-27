import { ABBREVIATIONS, ABBREV_IDS, buildChoices } from '../abbrev';
import { tokenizeText } from '../morse';

describe('abbrev', () => {
  it('has unique codes, all playable as Morse, with every translation', () => {
    expect(new Set(ABBREV_IDS).size).toBe(ABBREV_IDS.length);
    for (const x of ABBREVIATIONS) {
      expect(tokenizeText(x.code).flat().join('')).toBe(x.code);
      expect(x.de && x.en && x.vi).toBeTruthy();
    }
  });

  it('builds distinct choices containing the answer, preferring the same kind', () => {
    const choices = buildChoices('QRM', 4, () => 0.3);
    expect(choices).toHaveLength(4);
    expect(new Set(choices).size).toBe(4);
    expect(choices).toContain('QRM');
    expect(choices.every((c) => c.startsWith('Q'))).toBe(true);
  });

  it('falls back to other kinds when a kind is too small', () => {
    const choices = buildChoices('73', 4, () => 0.5);
    expect(choices).toHaveLength(4);
  });
});
