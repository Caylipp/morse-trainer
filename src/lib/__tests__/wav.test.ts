import { renderLoop, renderSegments, SAMPLE_RATE } from '../wav';

const str = (b: Uint8Array, from: number, len: number) =>
  String.fromCharCode(...Array.from(b.slice(from, from + len)));

describe('wav', () => {
  it('writes a valid PCM header', () => {
    const wav = renderSegments([{ on: true, duration: 100 }], 600, 0.5, SAMPLE_RATE, 0);
    const view = new DataView(wav.buffer);
    expect(str(wav, 0, 4)).toBe('RIFF');
    expect(str(wav, 8, 4)).toBe('WAVE');
    expect(view.getUint32(24, true)).toBe(SAMPLE_RATE);
    expect(view.getUint32(40, true)).toBe(wav.length - 44);
  });

  it('is silent during pauses and starts/ends with a ramp', () => {
    const wav = renderSegments(
      [{ on: false, duration: 100 }, { on: true, duration: 100 }],
      600, 1, SAMPLE_RATE, 0,
    );
    const view = new DataView(wav.buffer);
    const sample = (i: number) => view.getInt16(44 + i * 2, true);
    expect(sample(100)).toBe(0);
    const toneStart = Math.round(0.1 * SAMPLE_RATE);
    expect(Math.abs(sample(toneStart))).toBeLessThan(200);
    let peak = 0;
    for (let i = toneStart; i < toneStart + 2000; i++) peak = Math.max(peak, Math.abs(sample(i)));
    expect(peak).toBeGreaterThan(30000);
  });

  it('renders a loop that starts and ends near zero', () => {
    const wav = renderLoop(650);
    const view = new DataView(wav.buffer);
    const n = (wav.length - 44) / 2;
    expect(Math.abs(view.getInt16(44, true))).toBe(0);
    // Letztes Sample liegt knapp vor dem Nulldurchgang der nächsten Periode.
    expect(Math.abs(view.getInt16(44 + (n - 1) * 2, true))).toBeLessThan(5000);
  });
});
