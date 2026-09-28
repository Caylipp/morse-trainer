import { de } from '../de';
import { en } from '../en';
import { resolveLocale, translate } from '../index';
import { vi } from '../vi';

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');

describe('i18n', () => {
  it.each([
    ['en', en],
    ['vi', vi],
  ])('%s has every key with the same placeholders as German', (_name, dict) => {
    for (const key of Object.keys(de) as (keyof typeof de)[]) {
      expect(dict[key]).toBeTruthy();
      expect(placeholders(dict[key])).toBe(placeholders(de[key]));
    }
  });

  it('fills placeholders', () => {
    expect(translate('de', 'koch.level', { n: 3 })).toBe('Stufe 3');
    expect(translate('en', 'key.tempo', { wpm: 12, unit: 100 })).toBe('≈ 12 WPM · unit 100 ms');
    expect(translate('vi', 'listen.answer', { char: 'K' })).toBe('Trả lời K');
  });

  it('keeps an explicit language and resolves the system language to a supported one', () => {
    expect(resolveLocale('vi')).toBe('vi');
    expect(['de', 'en', 'vi']).toContain(resolveLocale('system'));
  });
});
