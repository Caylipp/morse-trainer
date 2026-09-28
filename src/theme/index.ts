/**
 * Themes: fünf Akzentfarben, jeweils in hellem und dunklem Modus.
 * Komponenten holen Farben und Styles über `useTheme(makeStyles)`.
 */

import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import type { Accent } from '../state/settings';
import { useSettings } from '../state/store';

export type Scheme = 'light' | 'dark';

export interface Palette {
  scheme: Scheme;
  bg: string;
  surface: string;
  surfaceHigh: string;
  border: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  accentDim: string;
  /** Text- und Symbolfarbe auf Akzentflächen. */
  onAccent: string;
  good: string;
  goodDim: string;
  bad: string;
  badDim: string;
}

export const radius = { sm: 8, md: 14, lg: 22 } as const;

export const ACCENTS: Record<Accent, Record<Scheme, string>> = {
  amber: { dark: '#FFB224', light: '#B86E00' },
  teal: { dark: '#2DD4BF', light: '#0F8577' },
  blue: { dark: '#5EA8FF', light: '#1F6FD1' },
  violet: { dark: '#B18CFF', light: '#7048C8' },
  rose: { dark: '#FF7A9A', light: '#C8345C' },
};

const NEUTRALS: Record<Scheme, Omit<Palette, 'accent' | 'accentDim' | 'onAccent' | 'scheme'>> = {
  dark: {
    bg: '#0D1015',
    surface: '#161A21',
    surfaceHigh: '#1E232C',
    border: '#2A303B',
    text: '#ECEEF1',
    muted: '#8B93A1',
    faint: '#4A5260',
    good: '#3DD68C',
    goodDim: 'rgba(61, 214, 140, 0.16)',
    bad: '#FF6369',
    badDim: 'rgba(255, 99, 105, 0.16)',
  },
  light: {
    bg: '#F3F4F6',
    surface: '#FFFFFF',
    surfaceHigh: '#EBEDF1',
    border: '#D6DAE1',
    text: '#14171C',
    muted: '#5B6472',
    faint: '#A3ABB7',
    good: '#16A06A',
    goodDim: 'rgba(22, 160, 106, 0.14)',
    bad: '#D93A40',
    badDim: 'rgba(217, 58, 64, 0.12)',
  },
};

function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function buildPalette(accent: Accent, scheme: Scheme): Palette {
  const a = ACCENTS[accent][scheme];
  return {
    scheme,
    ...NEUTRALS[scheme],
    accent: a,
    accentDim: alpha(a, scheme === 'dark' ? 0.18 : 0.14),
    onAccent: scheme === 'dark' ? '#0D1015' : '#FFFFFF',
  };
}

/** Aktuelles Farbschema aus Einstellung und System. */
export function usePalette(): Palette {
  const { settings } = useSettings();
  const system = useColorScheme();
  const scheme: Scheme =
    settings.themeMode === 'system' ? (system === 'light' ? 'light' : 'dark') : settings.themeMode;
  return useMemo(() => buildPalette(settings.accent, scheme), [settings.accent, scheme]);
}

/** Farben plus die daraus erzeugten Styles einer Komponente. */
export function useTheme<T>(makeStyles: (colors: Palette) => T): { colors: Palette; styles: T } {
  const colors = usePalette();
  const styles = useMemo(() => makeStyles(colors), [makeStyles, colors]);
  return { colors, styles };
}
