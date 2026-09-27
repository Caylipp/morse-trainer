/** Dunkles Farbschema mit Bernstein-Akzent, angelehnt an Funkgeräte-Anzeigen. */
export const colors = {
  bg: '#0D1015',
  surface: '#161A21',
  surfaceHigh: '#1E232C',
  border: '#2A303B',
  text: '#ECEEF1',
  muted: '#8B93A1',
  faint: '#4A5260',
  accent: '#FFB224',
  accentDim: 'rgba(255, 178, 36, 0.18)',
  good: '#3DD68C',
  goodDim: 'rgba(61, 214, 140, 0.16)',
  bad: '#FF6369',
  badDim: 'rgba(255, 99, 105, 0.16)',
} as const;

export const radius = { sm: 8, md: 14, lg: 22 } as const;
