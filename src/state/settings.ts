/** Einstellungen, Standardwerte und Migration gespeicherter Stände (reine Logik). */

export type Language = 'system' | 'de' | 'en' | 'vi';
export type ThemeMode = 'system' | 'light' | 'dark';
export type Accent = 'amber' | 'teal' | 'blue' | 'violet' | 'rose';

export interface Settings {
  /** Starttempo der Taste in WPM (der Decoder passt sich danach an). */
  sendWpm: number;
  /** Tempo aus den Tastendrücken lernen. */
  adaptive: boolean;
  /** Faktor für die Pausenschwellen (1 = Standard, größer = mehr Zeit zwischen Zeichen). */
  gapTolerance: number;
  /** Zeichentempo bei der Wiedergabe (WPM). */
  charWpm: number;
  /** Effektives Tempo bei der Wiedergabe (Farnsworth, WPM). */
  effectiveWpm: number;
  frequency: number;
  volume: number;
  sound: boolean;
  haptics: boolean;
  /** Im Lernmodus den Code des Zielzeichens anzeigen. */
  showHints: boolean;
  language: Language;
  themeMode: ThemeMode;
  accent: Accent;
}

/**
 * 20 WPM = 60 ms pro Einheit: Ab 120 ms Halten gilt ein Druck als Strich.
 * Die Pausenschwellen wachsen mit dem gelernten Tempo mit; Toleranz 1× hält
 * die Buchstabengrenze unter dem Standardabstand von 3 Einheiten.
 */
export const DEFAULT_SETTINGS: Settings = {
  sendWpm: 20,
  adaptive: true,
  gapTolerance: 1,
  charWpm: 20,
  effectiveWpm: 10,
  frequency: 650,
  volume: 0.8,
  sound: true,
  haptics: true,
  showHints: true,
  language: 'system',
  themeMode: 'system',
  accent: 'amber',
};

export const SETTINGS_VERSION = 3;

/** Übernimmt gespeicherte Einstellungen und hebt alte Standardwerte auf neue an. */
export function migrateSettings(stored: Partial<Settings> & { version?: number }): Settings {
  const { version = 1, ...rest } = stored;
  const settings = { ...DEFAULT_SETTINGS, ...rest };
  // v1 → v2: Haltedauer halbiert. Nur unveränderte alte Standardwerte ersetzen.
  if (version < 2 && settings.sendWpm === 10 && settings.gapTolerance === 1) {
    settings.sendWpm = DEFAULT_SETTINGS.sendWpm;
  }
  // v2 → v3: Toleranz 2× trennte bei normalem Tempo keine Buchstaben mehr.
  if (version === 2 && settings.gapTolerance === 2) {
    settings.gapTolerance = DEFAULT_SETTINGS.gapTolerance;
  }
  return settings;
}
