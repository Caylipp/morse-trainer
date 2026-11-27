/**
 * App-weiter Zustand: Einstellungen und Koch-Fortschritt (Senden und Hören),
 * dauerhaft gespeichert in AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { initialProgress, KochProgress } from '../lib/koch';
import type { SrsState } from '../lib/srs';
import { DEFAULT_SETTINGS, migrateSettings, Settings, SETTINGS_VERSION } from './settings';

export { DEFAULT_SETTINGS, type Settings };

export type ProgressKind = 'send' | 'listen';

interface Store {
  loaded: boolean;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  progress: Record<ProgressKind, KochProgress>;
  setProgress: (kind: ProgressKind, progress: KochProgress) => void;
  resetProgress: (kind: ProgressKind) => void;
  /** Lernstand der Abkürzungen (Spaced Repetition). */
  srs: SrsState;
  setSrs: (state: SrsState) => void;
}

const SETTINGS_KEY = 'morse.settings.v1';
const PROGRESS_KEY = 'morse.progress.v1';
const SRS_KEY = 'morse.srs.v1';

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [progress, setAllProgress] = useState<Record<ProgressKind, KochProgress>>({
    send: initialProgress(),
    listen: initialProgress(),
  });

  const [srs, setSrs] = useState<SrsState>({});

  useEffect(() => {
    (async () => {
      try {
        const [s, p, r] = await Promise.all([
          AsyncStorage.getItem(SETTINGS_KEY),
          AsyncStorage.getItem(PROGRESS_KEY),
          AsyncStorage.getItem(SRS_KEY),
        ]);
        if (r) setSrs(JSON.parse(r));
        if (s) setSettings(migrateSettings(JSON.parse(s)));
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
    if (loaded) AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, version: SETTINGS_VERSION })).catch(() => {});
  }, [loaded, settings]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)).catch(() => {});
  }, [loaded, progress]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(SRS_KEY, JSON.stringify(srs)).catch(() => {});
  }, [loaded, srs]);

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
    () => ({ loaded, settings, updateSettings, progress, setProgress, resetProgress, srs, setSrs }),
    [loaded, settings, updateSettings, progress, setProgress, resetProgress, srs],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore muss innerhalb von StoreProvider verwendet werden');
  return store;
}

const noop = () => {};

/**
 * Einstellungen lesen. Funktioniert auch außerhalb von StoreProvider (z. B. in der
 * Fehlerseite) und liefert dann die Standardwerte.
 */
export function useSettings() {
  const store = useContext(StoreContext);
  return {
    settings: store?.settings ?? DEFAULT_SETTINGS,
    updateSettings: store?.updateSettings ?? noop,
  };
}
