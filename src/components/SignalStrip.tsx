/** Zeitstreifen der letzten Tastendrücke: Länge proportional zur Druckdauer. */

import { StyleSheet, View } from 'react-native';

import type { KeyerSnapshot } from '../hooks/useKeyer';
import { Palette, useTheme } from '../theme';

const makeStyles = (_colors: Palette) =>
  StyleSheet.create({
    strip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      height: 10,
      overflow: 'hidden',
    },
    mark: { height: 6, borderRadius: 3 },
  });

export function SignalStrip({ recent, unit }: { recent: KeyerSnapshot['recent']; unit: number }) {
  const { colors, styles } = useTheme(makeStyles);
  const pxPerUnit = 7;
  return (
    <View style={styles.strip}>
      {recent.map((r) => (
        <View
          key={r.id}
          style={[
            styles.mark,
            {
              width: Math.max(4, Math.min(60, (r.duration / unit) * pxPerUnit)),
              backgroundColor: r.symbol === '.' ? colors.text : colors.accent,
            },
          ]}
        />
      ))}
    </View>
  );
}
