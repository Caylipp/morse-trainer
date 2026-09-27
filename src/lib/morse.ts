/**
 * Morse-Tabelle, Kodierung/Dekodierung und der binäre Morse-Baum.
 *
 * Codes werden als Strings aus '.' und '-' dargestellt.
 */

export type MorseSymbol = '.' | '-';

/** Internationales Morsealphabet (ITU) plus deutsche Umlaute. */
export const MORSE_TABLE: Readonly<Record<string, string>> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  Ä: '.-.-',
  Ö: '---.',
  Ü: '..--',
  CH: '----',
  ß: '...--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  _: '..--.-',
  '"': '.-..-.',
  $: '...-..-',
  '@': '.--.-.',
};

const CODE_TO_CHAR: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(MORSE_TABLE).map(([char, code]) => [code, char]),
);

/** Liefert das Zeichen zu einem Code oder `undefined`, wenn der Code ungültig ist. */
export function decodeChar(code: string): string | undefined {
  return CODE_TO_CHAR[code];
}

/** Liefert den Code zu einem Zeichen (Groß-/Kleinschreibung egal). */
export function encodeChar(char: string): string | undefined {
  return MORSE_TABLE[char.toUpperCase()];
}

/**
 * Wandelt Text in Morse um. Buchstaben werden durch ' ' getrennt, Wörter durch ' / '.
 * Unbekannte Zeichen werden übersprungen. "CH" wird als eigenes Zeichen erkannt.
 */
export function encodeText(text: string): string {
  return tokenizeText(text)
    .map((word) => word.map((c) => MORSE_TABLE[c]).join(' '))
    .filter((w) => w.length > 0)
    .join(' / ');
}

/** Zerlegt Text in Wörter aus kodierbaren Zeichen (Großbuchstaben). */
export function tokenizeText(text: string): string[][] {
  return text
    .toUpperCase()
    .split(/\s+/)
    .map((word) => {
      const chars: string[] = [];
      for (let i = 0; i < word.length; i++) {
        if (word[i] === 'C' && word[i + 1] === 'H') {
          chars.push('CH');
          i++;
        } else if (MORSE_TABLE[word[i]] !== undefined) {
          chars.push(word[i]);
        }
      }
      return chars;
    })
    .filter((w) => w.length > 0);
}

/** Dekodiert einen Morse-String im Format von `encodeText`. Ungültige Codes werden zu '�'. */
export function decodeText(morse: string): string {
  return morse
    .trim()
    .split(/\s*\/\s*/)
    .map((word) =>
      word
        .split(/\s+/)
        .filter(Boolean)
        .map((code) => decodeChar(code) ?? '�')
        .join(''),
    )
    .join(' ');
}

/** Alle Zeichen, deren Code mit `prefix` beginnt (inklusive exaktem Treffer), kürzeste zuerst. */
export function candidatesForPrefix(prefix: string): string[] {
  return Object.entries(MORSE_TABLE)
    .filter(([, code]) => code.startsWith(prefix))
    .sort((a, b) => a[1].length - b[1].length || treeOrder(a[1]) - treeOrder(b[1]))
    .map(([char]) => char);
}

/** Position eines Codes innerhalb seiner Baumebene (Punkt vor Strich). */
function treeOrder(code: string): number {
  return parseInt(code.replace(/\./g, '0').replace(/-/g, '1'), 2);
}

/** Wandelt '.'/'-' in hübsche Anzeigezeichen um. */
export function prettyCode(code: string): string {
  return code.replace(/\./g, '·').replace(/-/g, '−');
}

// ---------------------------------------------------------------------------
// Morse-Baum
// ---------------------------------------------------------------------------

export interface TreeNode {
  /** Pfad vom Wurzelknoten, z. B. ".-" */
  code: string;
  /** Zeichen an diesem Knoten, falls vorhanden. */
  char?: string;
  depth: number;
  /** Horizontale Position im Bereich 0..1 (Punkt links, Strich rechts). */
  x: number;
}

/**
 * Erzeugt alle Knoten des Morse-Baums bis `maxDepth` (Wurzel ausgenommen),
 * in Breitensuche-Reihenfolge. Punkt verzweigt nach links, Strich nach rechts.
 */
export function buildTree(maxDepth: number): TreeNode[] {
  const nodes: TreeNode[] = [];
  for (let depth = 1; depth <= maxDepth; depth++) {
    const count = 2 ** depth;
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let bit = depth - 1; bit >= 0; bit--) {
        code += (i >> bit) & 1 ? '-' : '.';
      }
      nodes.push({ code, char: decodeChar(code), depth, x: (i + 0.5) / count });
    }
  }
  return nodes;
}

/** Elternpfad eines Knotens ('' für Kinder der Wurzel). */
export function parentCode(code: string): string {
  return code.slice(0, -1);
}
