import { MorseDecoder, DecoderEvent } from '../decoder';
import { encodeChar } from '../morse';

/** Simuliert perfektes Tasten eines Textes mit gegebener Einheit. */
function key(decoder: MorseDecoder, text: string, unit: number, start = 0, jitter = () => 1) {
  let t = start;
  const events: DecoderEvent[] = [];
  const step = (to: number) => {
    for (; t < to; t += 5) events.push(...decoder.tick(t));
    t = to;
  };
  const words = text.split(' ');
  words.forEach((word, wi) => {
    [...word].forEach((ch, ci) => {
      const code = encodeChar(ch)!;
      [...code].forEach((sym, si) => {
        events.push(...decoder.press(t));
        step(t + (sym === '.' ? 1 : 3) * unit * jitter());
        events.push(...decoder.release(t));
        const last = si === code.length - 1;
        const lastChar = ci === word.length - 1;
        const gap = !last ? 1 : !lastChar ? 3 : wi < words.length - 1 ? 7 : 10;
        step(t + gap * unit * jitter());
      });
    });
  });
  return { events, end: t };
}

describe('MorseDecoder', () => {
  it('decodes perfectly timed input', () => {
    const d = new MorseDecoder({ initialUnit: 80 });
    key(d, 'SOS HILFE', 80);
    expect(d.text).toBe('SOS HILFE ');
  });

  it('adapts to a slower sender', () => {
    const d = new MorseDecoder({ initialUnit: 60 });
    // Doppelt so langsam wie erwartet – zuerst ein paar Zeichen zum Einschwingen.
    key(d, 'TEST PARIS MORSE', 150);
    expect(d.text.trim().endsWith('MORSE')).toBe(true);
    expect(d.unit).toBeGreaterThan(120);
  });

  it('adapts to a faster sender', () => {
    const d = new MorseDecoder({ initialUnit: 150 });
    key(d, 'ETET PARIS KOCH', 50);
    expect(d.text.trim().endsWith('KOCH')).toBe(true);
    expect(d.unit).toBeLessThan(70);
  });

  it('tolerates human jitter', () => {
    let seed = 42;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const d = new MorseDecoder({ initialUnit: 100 });
    key(d, 'THE QUICK BROWN FOX', 100, 0, () => 0.8 + rnd() * 0.35);
    expect(d.text).toBe('THE QUICK BROWN FOX ');
  });

  it('separates letters at standard spacing even when slower than the start tempo', () => {
    const d = new MorseDecoder({ initialUnit: 60 });
    key(d, 'MORSE KOCH', 110);
    expect(d.text).toBe('MORSE KOCH ');
  });

  it('tolerates hesitation within letters up to two units', () => {
    const d = new MorseDecoder({ initialUnit: 100 });
    // Innerhalb der Buchstaben 2 Einheiten Pause (statt 1), zwischen Buchstaben 6.
    let t = 0;
    const step = (to: number) => {
      for (; t < to; t += 5) d.tick(t);
      t = to;
    };
    for (const ch of 'PARIS HALLO'.replace(' ', '')) {
      const code = encodeChar(ch)!;
      [...code].forEach((s, i) => {
        d.press(t);
        step(t + (s === '.' ? 100 : 300));
        d.release(t);
        step(t + (i === code.length - 1 ? 600 : 200));
      });
    }
    expect(d.text.replace(/ /g, '')).toBe('PARISHALLO');
  });

  it('is not thrown off by one very long press', () => {
    const d = new MorseDecoder({ initialUnit: 60 });
    d.press(0);
    d.release(900); // Taste festgehalten
    d.tick(5000);
    expect(d.text).toBe('T ');
    key(d, 'MORSE KOCH', 110, 6000);
    expect(d.text).toBe('T MORSE KOCH ');
  });

  it('keeps a fixed tempo when adaptive mode is off', () => {
    const d = new MorseDecoder({ initialUnit: 100, adaptive: false });
    key(d, 'EE', 60);
    expect(d.unit).toBe(100);
  });

  it('emits symbol, letter and word events', () => {
    const d = new MorseDecoder({ initialUnit: 100 });
    const { events } = key(d, 'A', 100);
    expect(events.map((e) => e.type)).toEqual(['symbol', 'symbol', 'letter', 'word']);
    expect(events[2]).toEqual({ type: 'letter', code: '.-', char: 'A' });
  });

  it('marks unknown codes with *', () => {
    const d = new MorseDecoder({ initialUnit: 100, adaptive: false });
    for (let i = 0; i < 8; i++) {
      d.press(i * 200);
      d.release(i * 200 + 100);
    }
    d.tick(10000);
    expect(d.text).toBe('* ');
  });

  it('supports backspace, flush and clear', () => {
    const d = new MorseDecoder({ initialUnit: 100 });
    key(d, 'AB', 100);
    d.press(10000);
    d.release(10100);
    expect(d.code).toBe('.');
    d.backspace();
    expect(d.code).toBe('');
    d.backspace();
    expect(d.text).toBe('A');
    d.press(20000);
    d.release(20300);
    expect(d.flush()).toEqual([{ type: 'letter', code: '-', char: 'T' }]);
    // Lange Pause vor dem T ergibt eine Wortgrenze.
    expect(d.text).toBe('A T');
    d.clear();
    expect(d.text).toBe('');
  });

  it('does not split jittery dots into dots and dashes', () => {
    const d = new MorseDecoder({ initialUnit: 100 });
    const durations = [75, 125, 80, 120, 100, 78, 122]; // ±25 %
    let t = 0;
    for (const dur of durations) {
      d.press(t);
      d.release(t + dur);
      t += dur + 100;
    }
    expect(d.code).toBe('.......');
  });

  it('reports gap progress towards the letter boundary', () => {
    const d = new MorseDecoder({ initialUnit: 100, adaptive: false });
    d.press(0);
    d.release(100);
    expect(d.gapProgress(100)).toBe(0);
    expect(d.gapProgress(225)).toBeCloseTo(0.5);
    expect(d.gapProgress(1000)).toBe(1);
  });
});
