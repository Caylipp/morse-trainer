/**
 * Tonerzeugung für iOS/Android über expo-audio.
 *
 * Es gibt keine Echtzeit-Synthese, deshalb werden Sinustöne als WAV in den
 * Cache geschrieben: ein schleifbarer Mithörton für die Taste und je eine
 * Datei pro abgespielter Zeichenfolge.
 */

import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { File, Paths } from 'expo-file-system';

import type { Segment } from '../lib/timing';
import { renderLoop, renderSegments } from '../lib/wav';

/** Stille vor der ersten Note in erzeugten Dateien (ms). */
export const LEAD_IN_MS = 50;

let modeSet = false;
let sidetone: AudioPlayer | null = null;
let sidetoneKey = '';
let sequence: AudioPlayer | null = null;
let sequenceCounter = 0;

async function ensureAudioMode(): Promise<void> {
  if (modeSet) return;
  modeSet = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
  } catch (e) {
    console.warn('Audio-Modus konnte nicht gesetzt werden', e);
  }
}

function writeCacheFile(name: string, bytes: Uint8Array): string {
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(bytes);
  return file.uri;
}

export async function prepareSidetone(frequency: number, volume: number): Promise<void> {
  await ensureAudioMode();
  const key = `${Math.round(frequency)}-${Math.round(volume * 100)}`;
  if (sidetone && key === sidetoneKey) return;
  const uri = writeCacheFile(`sidetone-${key}.wav`, renderLoop(frequency, volume));
  sidetone?.remove();
  sidetone = createAudioPlayer({ uri });
  sidetone.loop = true;
  sidetoneKey = key;
}

export function sidetoneOn(): void {
  // Kein seekTo: Die Schleife ist nahtlos, und ein Sprung würde den Start verzögern.
  sidetone?.play();
}

export function sidetoneOff(): void {
  sidetone?.pause();
}

/** Spielt eine Ton/Pause-Folge ab. Die Folge beginnt nach `LEAD_IN_MS`. */
export async function playSegments(segments: Segment[], frequency: number, volume: number): Promise<void> {
  await ensureAudioMode();
  stopSegments();
  // Wechselnde Dateinamen, damit kein Player eine veraltete Datei aus dem Cache liest.
  const name = `sequence-${sequenceCounter++ % 4}.wav`;
  const uri = writeCacheFile(name, renderSegments(segments, frequency, volume, undefined, LEAD_IN_MS));
  sequence = createAudioPlayer({ uri });
  sequence.play();
}

export function stopSegments(): void {
  if (sequence) {
    sequence.pause();
    sequence.remove();
    sequence = null;
  }
}
