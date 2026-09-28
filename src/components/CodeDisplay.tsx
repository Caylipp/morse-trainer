/** Zeigt den gerade entstehenden Buchstaben als Punkte/Striche plus Kandidaten. */

import { StyleSheet, Text, View } from 'react-native';

import { useT } from '../i18n';
import { candidatesForPrefix, decodeChar } from '../lib/morse';
import { Palette, useTheme } from '../theme';

export function SymbolRow({
  code,
  size = 16,
  color,
  pendingLast = false,
}: {
  code: string;
  size?: number;
  color?: string;
  /** Letztes Symbol ist noch nicht losgelassen und wird blasser gezeichnet. */
  pendingLast?: boolean;
}) {
  const { colors } = useTheme(makeStyles);
  const fill = color ?? colors.accent;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: size, gap: size * 0.45 }}>
      {[...code].map((s, i) => (
        <View
          key={i}
          style={{
            width: s === '.' ? size : size * 3,
            height: size,
            borderRadius: size / 2,
            backgroundColor: fill,
            opacity: pendingLast && i === code.length - 1 ? 0.45 : 1,
          }}
        />
      ))}
    </View>
  );
}

export function CodeDisplay({
  code,
  pending = false,
  gapProgress,
}: {
  /** Code inklusive eines gerade gehaltenen Symbols. */
  code: string;
  pending?: boolean;
  gapProgress: number;
}) {
  const { colors, styles } = useTheme(makeStyles);
  const t = useT();
  const char = code ? decodeChar(code) : undefined;
  const candidates = code ? candidatesForPrefix(code).slice(0, 12) : [];
  const invalid = code !== '' && !char;
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <View style={styles.symbolBox}>
          {code ? (
            <SymbolRow code={code} pendingLast={pending} />
          ) : (
            <Text style={styles.placeholder}>{t('code.placeholder')}</Text>
          )}
        </View>
        <View style={styles.gapTrack}>
          <View style={[styles.gapFill, { width: `${Math.round(gapProgress * 100)}%` }]} />
        </View>
        <Text style={styles.candidates} numberOfLines={1}>
          {candidates.length > 0 ? t('code.candidates', { list: candidates.join(' ') }) : ' '}
        </Text>
      </View>
      <View style={[styles.charBox, invalid && !pending && styles.charBoxBad]}>
        <Text
          style={[
            styles.char,
            invalid && !pending && { color: colors.bad },
            pending && { opacity: 0.5 },
          ]}
        >
          {code ? (char ?? '?') : ''}
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    left: { flex: 1, gap: 6 },
    symbolBox: { height: 24, justifyContent: 'center', overflow: 'hidden' },
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
