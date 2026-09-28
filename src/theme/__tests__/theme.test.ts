import { ACCENTS, buildPalette } from '../index';

/** Kontrastverhältnis nach WCAG 2. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, bl] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

describe('themes', () => {
  for (const accent of Object.keys(ACCENTS) as (keyof typeof ACCENTS)[]) {
    for (const scheme of ['light', 'dark'] as const) {
      it(`${accent}/${scheme} is readable`, () => {
        const p = buildPalette(accent, scheme);
        expect(p.scheme).toBe(scheme);
        expect(contrast(p.text, p.bg)).toBeGreaterThan(7);
        // Akzentfarbe als Schrift auf Hintergrund und Text auf Akzentflächen.
        expect(contrast(p.accent, p.bg)).toBeGreaterThanOrEqual(3);
        expect(contrast(p.onAccent, p.accent)).toBeGreaterThanOrEqual(3);
      });
    }
  }
});
