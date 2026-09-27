/**
 * Haptisches Feedback beim Tasten und Vibrationsausgabe für Morsefolgen.
 *
 * Android kann beliebig lange vibrieren; iOS kennt nur kurze Impulse, daher
 * wird dort ein gehaltener Ton durch schnell aufeinanderfolgende Impulse angenähert.
 */

import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

import type { Segment } from '../lib/timing';

let iosBuzz: ReturnType<typeof setInterval> | null = null;

export function hapticKeyDown(): void {
  if (Platform.OS === 'android') {
    Vibration.vibrate(10_000);
  } else if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }
}

export function hapticKeyUp(): void {
  if (Platform.OS === 'android') Vibration.cancel();
}

export function hapticResult(correct: boolean): void {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(
    correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
  ).catch(() => {});
}

/** Startet die Vibration einer ganzen Folge (nur Android nutzt das Muster direkt). */
export function vibrateSegments(segments: Segment[], leadInMs: number): void {
  if (Platform.OS === 'ios') return; // iOS: siehe buzz()
  const pattern: number[] = [leadInMs];
  for (const seg of segments) {
    const expectOn = pattern.length % 2 === 1;
    if (seg.on === expectOn) pattern.push(Math.round(seg.duration));
    else pattern[pattern.length - 1] += Math.round(seg.duration);
  }
  Vibration.vibrate(pattern);
}

/** iOS: Impulsfolge an/aus, synchron zur visuellen Wiedergabe aufgerufen. */
export function buzz(on: boolean): void {
  if (Platform.OS !== 'ios') return;
  if (iosBuzz) {
    clearInterval(iosBuzz);
    iosBuzz = null;
  }
  if (on) {
    const hit = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    hit();
    iosBuzz = setInterval(hit, 45);
  }
}

export function stopVibration(): void {
  Vibration.cancel();
  buzz(false);
}
