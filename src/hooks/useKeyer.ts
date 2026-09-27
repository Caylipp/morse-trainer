/**
 * Verbindet den MorseDecoder mit Taste, Ton, Haptik und Anzeige.
 *
 * Solange etwas passiert (Taste gedrückt, Buchstabe offen), läuft eine
 * requestAnimationFrame-Schleife, die Pausen auswertet und die Anzeige
 * (Haltebalken, Pausenbalken) aktualisiert.
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { hapticKeyDown, hapticKeyUp } from '../audio/haptics';
import { prepareSidetone, sidetoneOff, sidetoneOn } from '../audio/tone';
import { DecoderEvent, MorseDecoder } from '../lib/decoder';
import { MorseSymbol } from '../lib/morse';
import { unitMs } from '../lib/timing';
import { useSettings } from '../state/store';

export interface KeyerSnapshot {
  code: string;
  text: string;
  pressed: boolean;
  /** Druckdauer im Verhältnis zur Punkt/Strich-Grenze (>= 1 bedeutet Strich). */
  heldRatio: number;
  /** Fortschritt der Buchstabenpause (1 = Buchstabe wird abgeschlossen). */
  gapProgress: number;
  unit: number;
  /** Zuletzt erkannte Elemente mit Dauer, für den Signalstreifen. */
  recent: { symbol: MorseSymbol; duration: number; id: number }[];
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export interface KeyerApi {
  /** Verwirft Text, offenen Buchstaben und Signalstreifen. */
  clear: () => void;
}

export function useKeyer(onEvents?: (events: DecoderEvent[], api: KeyerApi) => void) {
  const { settings } = useSettings();
  const [d] = useState(() => new MorseDecoder({ initialUnit: unitMs(settings.sendWpm) }));

  // Aktuelle Werte für Event-Handler und die Animationsschleife.
  const onEventsRef = useRef(onEvents);
  const settingsRef = useRef(settings);
  useLayoutEffect(() => {
    onEventsRef.current = onEvents;
    settingsRef.current = settings;
  });

  const recentRef = useRef<KeyerSnapshot['recent']>([]);
  const idCounter = useRef(0);
  const frame = useRef<number | null>(null);

  const snap = useCallback(
    (t: number): KeyerSnapshot => ({
      code: d.code,
      text: d.text,
      pressed: d.isPressed,
      heldRatio: d.isPressed ? d.heldFor(t) / d.threshold : 0,
      gapProgress: d.gapProgress(t),
      unit: d.unit,
      recent: recentRef.current,
    }),
    [d],
  );
  const [snapshot, setSnapshot] = useState<KeyerSnapshot>(() => ({
    code: '',
    text: '',
    pressed: false,
    heldRatio: 0,
    gapProgress: 0,
    unit: d.unit,
    recent: [],
  }));

  useEffect(() => {
    d.configure({
      initialUnit: unitMs(settings.sendWpm),
      adaptive: settings.adaptive,
      letterGapUnits: 2.5 * settings.gapTolerance,
      wordGapUnits: 5 * settings.gapTolerance,
    });
  }, [d, settings.sendWpm, settings.adaptive, settings.gapTolerance]);

  useEffect(() => {
    prepareSidetone(settings.frequency, settings.volume).catch((e) =>
      console.warn('Mithörton nicht verfügbar', e),
    );
  }, [settings.frequency, settings.volume]);

  const clear = useCallback(() => {
    d.clear();
    recentRef.current = [];
    setSnapshot(snap(now()));
  }, [d, snap]);

  const handle = useCallback((events: DecoderEvent[]) => {
    if (events.length === 0) return;
    for (const e of events) {
      if (e.type === 'symbol') {
        recentRef.current = [
          ...recentRef.current,
          { symbol: e.symbol, duration: e.duration, id: idCounter.current++ },
        ].slice(-14);
      }
    }
    onEventsRef.current?.(events, { clear });
  }, [clear]);

  const loop = useCallback(
    function step() {
      const t = now();
      handle(d.tick(t));
      setSnapshot(snap(t));
      frame.current = d.idle ? null : requestAnimationFrame(step);
    },
    [d, handle, snap],
  );

  const ensureLoop = useCallback(() => {
    if (frame.current === null) frame.current = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      sidetoneOff();
      hapticKeyUp();
    },
    [],
  );

  const down = useCallback(() => {
    if (d.isPressed) return;
    const t = now();
    const s = settingsRef.current;
    if (s.sound) sidetoneOn();
    if (s.haptics) hapticKeyDown();
    handle(d.press(t));
    setSnapshot(snap(t));
    ensureLoop();
  }, [d, handle, snap, ensureLoop]);

  const up = useCallback(() => {
    if (!d.isPressed) return;
    const t = now();
    sidetoneOff();
    hapticKeyUp();
    handle(d.release(t));
    setSnapshot(snap(t));
    ensureLoop();
  }, [d, handle, snap, ensureLoop]);

  const refresh = useCallback(() => setSnapshot(snap(now())), [snap]);

  const actions = {
    down,
    up,
    clear,
    backspace: useCallback(() => {
      d.backspace();
      refresh();
    }, [d, refresh]),
    flush: useCallback(() => {
      handle(d.flush());
      refresh();
    }, [d, handle, refresh]),
    resetTempo: useCallback(() => {
      d.resetTempo();
      refresh();
    }, [d, refresh]),
  };

  useWebSpaceKey(down, up);

  return { snapshot, ...actions };
}

/** Im Browser: Leertaste als Morsetaste, solange der Bildschirm im Fokus ist. */
function useWebSpaceKey(down: () => void, up: () => void) {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'web' || typeof window === 'undefined') return;
      const isTyping = () => {
        const el = document.activeElement;
        return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      };
      const onDown = (e: KeyboardEvent) => {
        if (e.code !== 'Space' || isTyping()) return;
        e.preventDefault();
        if (!e.repeat) down();
      };
      const onUp = (e: KeyboardEvent) => {
        if (e.code !== 'Space' || isTyping()) return;
        e.preventDefault();
        up();
      };
      window.addEventListener('keydown', onDown);
      window.addEventListener('keyup', onUp);
      return () => {
        window.removeEventListener('keydown', onDown);
        window.removeEventListener('keyup', onUp);
        up();
      };
    }, [down, up]),
  );
}
