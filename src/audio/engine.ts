/**
 * Echtzeit-Tonerzeugung über eine Web-Audio-API (Browser oder react-native-audio-api).
 *
 * Latenz beim Tasten: Der Mithörton-Oszillator läuft dauerhaft mit Lautstärke 0,
 * die Taste blendet nur die Lautstärke auf. Es wird nichts gestartet oder geladen,
 * deshalb hört man den Ton praktisch ohne Verzögerung – auch beim schnellen Tippen.
 */

import type { Segment } from '../lib/timing';

/** Stille vor der ersten Note einer abgespielten Folge (ms). */
export const LEAD_IN_MS = 50;
/** Ein- und Ausblendzeit gegen Knackser (s). */
const RAMP_S = 0.004;
/** Pegel-Faktor gegenüber der Lautstärke-Einstellung (Sinus klingt sonst zu laut). */
const LEVEL = 0.5;

export interface ToneEngine {
  prepareSidetone(frequency: number, volume: number): Promise<void>;
  sidetoneOn(): void;
  sidetoneOff(): void;
  playSegments(segments: Segment[], frequency: number, volume: number): Promise<void>;
  stopSegments(): void;
}

export function createToneEngine(makeContext: () => AudioContext | null): ToneEngine {
  let ctx: AudioContext | null = null;
  let osc: OscillatorNode | null = null;
  let gain: GainNode | null = null;
  let level = 0.8 * LEVEL;
  let frequency = 650;
  let seqOsc: OscillatorNode | null = null;

  function context(): AudioContext | null {
    if (!ctx) ctx = makeContext();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  /** Legt Oszillator und Regler einmalig an; sie laufen danach dauerhaft weiter. */
  function ensureSidetone(): boolean {
    const c = context();
    if (!c) return false;
    if (!osc || !gain) {
      gain = c.createGain();
      gain.gain.value = 0;
      osc = c.createOscillator();
      osc.frequency.value = frequency;
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
    }
    return true;
  }

  function setGain(target: number): void {
    if (!ctx || !gain) return;
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(target, t + RAMP_S);
  }

  function stopSegments(): void {
    if (!seqOsc) return;
    try {
      seqOsc.stop();
    } catch {
      // bereits gestoppt
    }
    seqOsc.disconnect();
    seqOsc = null;
  }

  return {
    async prepareSidetone(freq, volume) {
      frequency = freq;
      level = volume * LEVEL;
      // Schon beim Öffnen anlegen, nicht erst beim ersten Druck.
      if (ensureSidetone() && osc && ctx) osc.frequency.setValueAtTime(freq, ctx.currentTime);
    },

    sidetoneOn() {
      if (ensureSidetone()) setGain(level);
    },

    sidetoneOff() {
      setGain(0);
    },

    async playSegments(segments, freq, volume) {
      const c = context();
      if (!c) return;
      stopSegments();
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.value = freq;
      g.gain.value = 0;
      o.connect(g);
      g.connect(c.destination);

      const peak = volume * LEVEL;
      const start = c.currentTime + LEAD_IN_MS / 1000;
      let t = start;
      for (const seg of segments) {
        const d = seg.duration / 1000;
        if (seg.on) {
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(peak, t + RAMP_S);
          g.gain.setValueAtTime(peak, t + d - RAMP_S);
          g.gain.linearRampToValueAtTime(0, t + d);
        }
        t += d;
      }
      o.start(start);
      o.stop(t + 0.05);
      seqOsc = o;
    },

    stopSegments,
  };
}
