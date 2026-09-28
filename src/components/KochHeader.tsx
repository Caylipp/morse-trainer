/** Kopfbereich für die Koch-Übungen: Stufe, Zeichen mit Trefferquote, Fortschritt. */

import { StyleSheet, Text, View } from 'react-native';

import {
  charAccuracy,
  isComplete,
  KOCH_ORDER,
  KochProgress,
  newestChar,
  UNLOCK_ACCURACY,
  UNLOCK_WINDOW,
  unlockedChars,
  windowAccuracy,
} from '../lib/koch';
import { useT } from '../i18n';
import { Palette, useTheme } from '../theme';
import { ProgressBar } from './ui';

function accuracyColor(colors: Palette, acc: number | undefined): string {
  if (acc === undefined) return colors.border;
  if (acc >= 0.9) return colors.good;
  if (acc >= 0.6) return colors.accent;
  return colors.bad;
}

export function KochHeader({ progress, current }: { progress: KochProgress; current?: string }) {
  const { colors, styles } = useTheme(makeStyles);
  const t = useT();
  const chars = unlockedChars(progress);
  const acc = windowAccuracy(progress);
  const n = progress.window.length;
  const next = KOCH_ORDER[progress.level];
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.level}>
          {t('koch.level', { n: progress.level - 1 })}
          <Text style={styles.muted}> · {t('koch.chars', { n: chars.length, total: KOCH_ORDER.length })}</Text>
        </Text>
        <Text style={styles.muted}>
          {isComplete(progress)
            ? t('koch.done')
            : `${n}/${UNLOCK_WINDOW} · ${Math.round(acc * 100)} % → ${next}`}
        </Text>
      </View>
      <ProgressBar
        value={isComplete(progress) ? 1 : (n / UNLOCK_WINDOW) * Math.min(1, acc / UNLOCK_ACCURACY)}
        color={acc >= UNLOCK_ACCURACY ? colors.good : colors.accent}
      />
      <View style={styles.chips}>
        {chars.map((c) => {
          const a = charAccuracy(progress.stats[c]);
          return (
            <View
              key={c}
              style={[
                styles.chip,
                { borderColor: accuracyColor(colors, a) },
                c === current && styles.chipCurrent,
              ]}
            >
              <Text style={[styles.chipText, c === newestChar(progress) && { color: colors.accent }]}>{c}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  level: { color: colors.text, fontSize: 16, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 13, fontWeight: '400' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
  },
  chipCurrent: { backgroundColor: colors.accentDim },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '700' },
});
