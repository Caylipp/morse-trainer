/**
 * Spielt Text als Morse ab – Ton, Vibration und ein Signal-Callback für die
 * Anzeige (z. B. Bildschirm-Blitz) laufen synchron.
 */

import { buildSegments, Spacing } from '../lib/timing';
import { buzz, stopVibration, vibrateSegments } from './haptics';
import { LEAD_IN_MS, playSegments, stopSegments } from './tone';

export interface PlaybackOptions {
  spacing: Spacing;
  frequency: number;
  volume: number;
  sound: boolean;
  vibrate: boolean;
  /** Wird bei jedem Wechsel Ton an/aus aufgerufen. */
  onSignal?: (on: boolean, charIndex: number | undefined) => void;
  onDone?: () => void;
}

export interface Playback {
  stop: () => void;
  chars: string[];
  totalMs: number;
}

let current: Playback | null = null;

export function stopPlayback(): void {
  current?.stop();
  current = null;
}

export function playText(text: string, opts: PlaybackOptions): Playback {
  stopPlayback();
  const { segments, chars, totalMs } = buildSegments(text, opts.spacing);
  const timers: ReturnType<typeof setTimeout>[] = [];
  let stopped = false;

  if (opts.sound) playSegments(segments, opts.frequency, opts.volume).catch(() => {});
  if (opts.vibrate) vibrateSegments(segments, LEAD_IN_MS);

  let t = LEAD_IN_MS;
  for (const seg of segments) {
    const at = t;
    timers.push(
      setTimeout(() => {
        if (opts.vibrate) buzz(seg.on);
        opts.onSignal?.(seg.on, seg.charIndex);
      }, at),
    );
    t += seg.duration;
  }
  timers.push(
    setTimeout(() => {
      if (opts.vibrate) buzz(false);
      opts.onSignal?.(false, undefined);
      if (!stopped) {
        stopped = true;
        if (current === playback) current = null;
        opts.onDone?.();
      }
    }, t),
  );

  const playback: Playback = {
    chars,
    totalMs,
    stop: () => {
      if (stopped) return;
      stopped = true;
      timers.forEach(clearTimeout);
      stopSegments();
      stopVibration();
      opts.onSignal?.(false, undefined);
      opts.onDone?.();
    },
  };
  current = playback;
  return playback;
}
