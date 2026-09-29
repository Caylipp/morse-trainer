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
 * 5 WPM = 240 ms pro Einheit: Ein Buchstabe endet erst nach 0,6 s Pause, ein Wort
 * nach 1,2 s. Punkt/Strich lernt der Decoder aus den Drücken, die Pausen werden
 * aber nie kürzer als dieses Starttempo – Einsteiger haben so Zeit zum Überlegen.
 * (20 und 10 WPM waren laut Nutzer zu hektisch.)
 * Die Pausenschwellen wachsen mit dem gelernten Tempo mit; Toleranz 1× hält
 * die Buchstabengrenze unter dem Standardabstand von 3 Einheiten.
 */
export const DEFAULT_SETTINGS: Settings = {
  sendWpm: 5,
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

export const SETTINGS_VERSION = 5;

/** Übernimmt gespeicherte Einstellungen und hebt alte Standardwerte auf neue an. */
export function migrateSettings(stored: Partial<Settings> & { version?: number }): Settings {
  const { version = 1, ...rest } = stored;
  const settings = { ...DEFAULT_SETTINGS, ...rest };
  // v1 → v2: Haltedauer halbiert. Nur unveränderte alte Standardwerte ersetzen.
  // Bis v4: frühere Standard-Starttempi (20, 10 WPM) auf den neuen Standard setzen,
  // selbst gewählte Werte bleiben.
  if (
    (version < 2 && settings.sendWpm === 10 && settings.gapTolerance === 1) ||
    (version >= 2 && version < 4 && settings.sendWpm === 20) ||
    (version === 4 && settings.sendWpm === 10)
  ) {
    settings.sendWpm = DEFAULT_SETTINGS.sendWpm;
  }
  // v2 → v3: Toleranz 2× trennte bei normalem Tempo keine Buchstaben mehr.
  if (version === 2 && settings.gapTolerance === 2) {
    settings.gapTolerance = DEFAULT_SETTINGS.gapTolerance;
  }
  return settings;
}
