/**
 * Tonerzeugung im Browser über die Web-Audio-API (latenzarm, ohne Dateien).
 * Gleiche Schnittstelle wie `tone.ts`.
 */

import type { Segment } from '../lib/timing';

export const LEAD_IN_MS = 50;
const RAMP_S = 0.005;

let ctx: AudioContext | null = null;
let sideOsc: OscillatorNode | null = null;
let sideGain: GainNode | null = null;
let sideVolume = 0.8;
let pendingFrequency = 650;
let seqOsc: OscillatorNode | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export async function prepareSidetone(frequency: number, volume: number): Promise<void> {
  sideVolume = volume;
  // Der AudioContext darf erst nach einer Nutzeraktion starten; siehe sidetoneOn.
  if (sideOsc && ctx) sideOsc.frequency.setValueAtTime(frequency, ctx.currentTime);
  pendingFrequency = frequency;
}

export function sidetoneOn(): void {
  const c = context();
  if (!c) return;
  if (!sideOsc || !sideGain) {
    sideOsc = c.createOscillator();
    sideGain = c.createGain();
    sideGain.gain.value = 0;
    sideOsc.frequency.value = pendingFrequency;
    sideOsc.connect(sideGain).connect(c.destination);
    sideOsc.start();
  }
  const t = c.currentTime;
  sideGain.gain.cancelScheduledValues(t);
  sideGain.gain.setValueAtTime(sideGain.gain.value, t);
  sideGain.gain.linearRampToValueAtTime(sideVolume * 0.5, t + RAMP_S);
}

export function sidetoneOff(): void {
  if (!ctx || !sideGain) return;
  const t = ctx.currentTime;
  sideGain.gain.cancelScheduledValues(t);
  sideGain.gain.setValueAtTime(sideGain.gain.value, t);
  sideGain.gain.linearRampToValueAtTime(0, t + RAMP_S);
}

export async function playSegments(segments: Segment[], frequency: number, volume: number): Promise<void> {
  const c = context();
  if (!c) return;
  stopSegments();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.frequency.value = frequency;
  gain.gain.value = 0;
  osc.connect(gain).connect(c.destination);

  const start = c.currentTime + LEAD_IN_MS / 1000;
  let t = start;
  for (const seg of segments) {
    const d = seg.duration / 1000;
    if (seg.on) {
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume * 0.5, t + RAMP_S);
      gain.gain.setValueAtTime(volume * 0.5, t + d - RAMP_S);
      gain.gain.linearRampToValueAtTime(0, t + d);
    }
    t += d;
  }
  osc.start(start);
  osc.stop(t + 0.05);
  seqOsc = osc;
}

export function stopSegments(): void {
  if (seqOsc) {
    try {
      seqOsc.stop();
    } catch {
      // bereits gestoppt
    }
    seqOsc.disconnect();
    seqOsc = null;
  }
}
