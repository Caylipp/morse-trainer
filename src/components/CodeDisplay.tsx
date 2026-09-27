/** Zeigt den gerade entstehenden Buchstaben als Punkte/Striche plus Kandidaten. */

import { StyleSheet, Text, View } from 'react-native';

import { candidatesForPrefix, decodeChar } from '../lib/morse';
import { colors } from '../theme/colors';

export function SymbolRow({ code, size = 16, color = colors.accent }: { code: string; size?: number; color?: string }) {
  return (
    <View style={[styles.symbols, { height: size, gap: size * 0.45 }]}>
      {[...code].map((s, i) => (
        <View
          key={i}
          style={{
            width: s === '.' ? size : size * 3,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

export function CodeDisplay({ code, gapProgress }: { code: string; gapProgress: number }) {
  const char = code ? decodeChar(code) : undefined;
  const candidates = code ? candidatesForPrefix(code).slice(0, 12) : [];
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <View style={styles.symbolBox}>
          {code ? <SymbolRow code={code} /> : <Text style={styles.placeholder}>Tippe auf die Taste</Text>}
        </View>
        <View style={styles.gapTrack}>
          <View style={[styles.gapFill, { width: `${Math.round(gapProgress * 100)}%` }]} />
        </View>
        <Text style={styles.candidates} numberOfLines={1}>
          {candidates.length > 0 ? `möglich: ${candidates.join(' ')}` : ' '}
        </Text>
      </View>
      <View style={[styles.charBox, code !== '' && !char && styles.charBoxBad]}>
        <Text style={[styles.char, !char && code !== '' && { color: colors.bad }]}>
          {code ? (char ?? '?') : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  left: { flex: 1, gap: 6 },
  symbolBox: { height: 24, justifyContent: 'center', overflow: 'hidden' },
  symbols: { flexDirection: 'row', alignItems: 'center' },
  placeholder: { color: colors.faint, fontSize: 14 },
  gapTrack: { height: 3, backgroundColor: colors.surfaceHigh, borderRadius: 2, overflow: 'hidden' },
  gapFill: { height: 3, backgroundColor: colors.muted },
  candidates: { color: colors.muted, fontSize: 13 },
  charBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charBoxBad: { borderColor: colors.bad },
  char: { color: colors.accent, fontSize: 36, fontWeight: '800' },
});
