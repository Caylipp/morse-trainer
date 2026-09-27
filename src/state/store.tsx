/**
 * App-weiter Zustand: Einstellungen und Koch-Fortschritt (Senden und Hören),
 * dauerhaft gespeichert in AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { initialProgress, KochProgress } from '../lib/koch';

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
}

export const DEFAULT_SETTINGS: Settings = {
  sendWpm: 10,
  adaptive: true,
  gapTolerance: 1,
  charWpm: 20,
  effectiveWpm: 10,
  frequency: 650,
  volume: 0.8,
  sound: true,
  haptics: true,
  showHints: true,
};

export type ProgressKind = 'send' | 'listen';

interface Store {
  loaded: boolean;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  progress: Record<ProgressKind, KochProgress>;
  setProgress: (kind: ProgressKind, progress: KochProgress) => void;
  resetProgress: (kind: ProgressKind) => void;
}

const SETTINGS_KEY = 'morse.settings.v1';
const PROGRESS_KEY = 'morse.progress.v1';

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [progress, setAllProgress] = useState<Record<ProgressKind, KochProgress>>({
    send: initialProgress(),
    listen: initialProgress(),
  });

  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([
          AsyncStorage.getItem(SETTINGS_KEY),
          AsyncStorage.getItem(PROGRESS_KEY),
        ]);
        if (s) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(s) });
        if (p) {
          const parsed = JSON.parse(p);
          setAllProgress({
            send: { ...initialProgress(), ...parsed.send },
            listen: { ...initialProgress(), ...parsed.listen },
          });
        }
      } catch (e) {
        console.warn('Gespeicherter Zustand konnte nicht geladen werden', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => {});
  }, [loaded, settings]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)).catch(() => {});
  }, [loaded, progress]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const setProgress = useCallback((kind: ProgressKind, p: KochProgress) => {
    setAllProgress((prev) => ({ ...prev, [kind]: p }));
  }, []);

  const resetProgress = useCallback((kind: ProgressKind) => {
    setAllProgress((prev) => ({ ...prev, [kind]: initialProgress() }));
  }, []);

  const value = useMemo(
    () => ({ loaded, settings, updateSettings, progress, setProgress, resetProgress }),
    [loaded, settings, updateSettings, progress, setProgress, resetProgress],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore muss innerhalb von StoreProvider verwendet werden');
  return store;
}

export function useSettings() {
  const { settings, updateSettings } = useStore();
  return { settings, updateSettings };
}
