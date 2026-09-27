import {
  buildTree,
  candidatesForPrefix,
  decodeChar,
  decodeText,
  encodeChar,
  encodeText,
  MORSE_TABLE,
  prettyCode,
} from '../morse';

describe('morse table', () => {
  it('has unique codes', () => {
    const codes = Object.values(MORSE_TABLE);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('encodes and decodes single characters', () => {
    expect(encodeChar('s')).toBe('...');
    expect(encodeChar('O')).toBe('---');
    expect(decodeChar('.-')).toBe('A');
    expect(decodeChar('......')).toBeUndefined();
  });

  it('round-trips text including CH and umlauts', () => {
    const morse = encodeText('SOS Ächz 73');
    expect(morse).toBe('... --- ... / .-.- ---- --.. / --... ...--');
    expect(decodeText(morse)).toBe('SOS ÄCHZ 73');
  });

  it('skips unknown characters', () => {
    expect(encodeText('a#b')).toBe('.- -...');
  });

  it('lists candidates for a prefix, shortest first', () => {
    expect(candidatesForPrefix('--').slice(0, 3)).toEqual(['M', 'G', 'O']);
    expect(candidatesForPrefix('')).toHaveLength(Object.keys(MORSE_TABLE).length);
  });

  it('prettifies codes', () => {
    expect(prettyCode('.-')).toBe('·−');
  });
});

describe('buildTree', () => {
  it('creates 2^1..2^n nodes with dot left and dash right', () => {
    const nodes = buildTree(4);
    expect(nodes).toHaveLength(2 + 4 + 8 + 16);
    const e = nodes.find((n) => n.code === '.')!;
    const t = nodes.find((n) => n.code === '-')!;
    expect(e.char).toBe('E');
    expect(t.char).toBe('T');
    expect(e.x).toBeLessThan(t.x);
    expect(nodes.find((n) => n.code === '...-')!.char).toBe('V');
  });
});
