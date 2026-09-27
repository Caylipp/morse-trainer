/**
 * Die große Morsetaste. Nutzt das Responder-System direkt (statt Pressable),
 * damit Drücken und Loslassen ohne Verzögerung ankommen.
 */

import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../theme/colors';

export function MorseKey({
  pressed,
  heldRatio,
  onDown,
  onUp,
  minHeight = 140,
}: {
  pressed: boolean;
  heldRatio: number;
  onDown: () => void;
  onUp: () => void;
  minHeight?: number;
}) {
  const isDash = heldRatio >= 1;
  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel="Morsetaste"
      accessibilityHint="Kurz drücken für Punkt, lang drücken für Strich"
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={onDown}
      onResponderRelease={onUp}
      onResponderTerminate={onUp}
      style={[styles.key, { minHeight }, pressed && styles.pressed]}
    >
      <View style={styles.meter} pointerEvents="none">
        <View
          style={[
            styles.meterFill,
            {
              width: `${Math.min(100, heldRatio * 50)}%`,
              backgroundColor: isDash ? colors.accent : colors.text,
            },
          ]}
        />
        <View style={styles.meterMark} />
      </View>
      <Text style={[styles.symbol, pressed && { color: colors.accent }]} pointerEvents="none">
        {pressed ? (isDash ? '−' : '·') : ''}
      </Text>
      <Text style={styles.hint} pointerEvents="none">
        {pressed ? (isDash ? 'Strich' : 'Punkt') : 'Tippen · Halten'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  key: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    userSelect: 'none',
  },
  pressed: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  symbol: { color: colors.text, fontSize: 64, fontWeight: '700', lineHeight: 72, height: 72 },
  hint: { color: colors.muted, fontSize: 14, marginTop: 4 },
  meter: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 14,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  meterFill: { height: 6 },
  // Markiert die Punkt/Strich-Grenze in der Mitte des Balkens.
  meterMark: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, backgroundColor: colors.bg },
});
