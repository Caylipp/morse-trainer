/**
 * Erzeugt WAV-Dateien (16 Bit PCM, mono) für Sinustöne.
 * Wird auf iOS/Android genutzt, wo es keine Web-Audio-API gibt.
 */

import type { Segment } from './timing';

export const SAMPLE_RATE = 22050;
/** Ein- und Ausblendzeit gegen Knackser (ms). */
const RAMP_MS = 5;

function writeHeader(view: DataView, dataBytes: number, sampleRate: number): void {
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // Größe des fmt-Blocks
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte-Rate
  view.setUint16(32, 2, true); // Block-Align
  view.setUint16(34, 16, true); // Bits pro Sample
  writeStr(36, 'data');
  view.setUint32(40, dataBytes, true);
}

function encode(samples: Float32Array, sampleRate: number): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  writeHeader(view, samples.length * 2, sampleRate);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, Math.round(s * 32767), true);
  }
  return new Uint8Array(buffer);
}

/** Rendert eine Ton/Pause-Folge als WAV mit weichen Flanken. */
export function renderSegments(
  segments: Segment[],
  frequency: number,
  volume = 0.8,
  sampleRate = SAMPLE_RATE,
  leadInMs = 50,
): Uint8Array {
  const totalMs = leadInMs + segments.reduce((s, seg) => s + seg.duration, 0) + 50;
  const samples = new Float32Array(Math.ceil((totalMs / 1000) * sampleRate));
  const ramp = Math.max(1, Math.round((RAMP_MS / 1000) * sampleRate));
  const w = (2 * Math.PI * frequency) / sampleRate;

  let cursor = Math.round((leadInMs / 1000) * sampleRate);
  for (const seg of segments) {
    const len = Math.round((seg.duration / 1000) * sampleRate);
    if (seg.on) {
      const r = Math.min(ramp, Math.floor(len / 2));
      for (let i = 0; i < len && cursor + i < samples.length; i++) {
        let env = 1;
        if (i < r) env = 0.5 - 0.5 * Math.cos((Math.PI * i) / r);
        else if (i >= len - r) env = 0.5 - 0.5 * Math.cos((Math.PI * (len - i)) / r);
        samples[cursor + i] = volume * env * Math.sin(w * (cursor + i));
      }
    }
    cursor += len;
  }
  return encode(samples, sampleRate);
}

/**
 * Ein nahtlos schleifbarer Sinuston (ganzzahlige Anzahl Perioden) für den
 * Mithörton beim Tasten.
 */
export function renderLoop(frequency: number, volume = 0.8, sampleRate = SAMPLE_RATE): Uint8Array {
  const periods = Math.max(1, Math.round(frequency * 0.5)); // ca. 0,5 s
  const exactLen = (periods * sampleRate) / frequency;
  const len = Math.round(exactLen);
  // Frequenz minimal anpassen, damit die Schleife exakt aufgeht.
  const f = (periods * sampleRate) / len;
  const samples = new Float32Array(len);
  for (let i = 0; i < len; i++) samples[i] = volume * Math.sin((2 * Math.PI * f * i) / sampleRate);
  return encode(samples, sampleRate);
}
