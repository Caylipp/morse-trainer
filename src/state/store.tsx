/**
 * App-weiter Zustand: Einstellungen und Koch-Fortschritt (Senden und Hören),
 * dauerhaft gespeichert in AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { initialProgress, KochProgress } from '../lib/koch';
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
