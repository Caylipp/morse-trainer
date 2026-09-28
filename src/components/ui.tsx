import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, ReactNode } from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Switch, Text, View, ViewStyle } from 'react-native';

import { Palette, radius, useTheme } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function Button({
  label,
  icon,
  onPress,
  variant = 'secondary',
  disabled,
  style,
  accessibilityLabel,
}: {
  label?: string;
  icon?: IconName;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { colors, styles } = useTheme(makeStyles);
  const fg = variant === 'primary' ? colors.onAccent : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={18} color={fg} />}
      {label && <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>}
    </Pressable>
  );
}

export function AppSwitch({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  const { colors } = useTheme(makeStyles);
  // react-native-web ignoriert thumbColor für den aktiven Zustand.
  const webThumb = Platform.OS === 'web' ? { activeThumbColor: '#FFFFFF' } : {};
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ true: colors.accent, false: colors.border }}
      thumbColor="#FFFFFF"
      accessibilityLabel={label}
      {...webThumb}
    />
  );
}

/** Auswahl aus wenigen Optionen als nebeneinanderliegende Schaltflächen. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; swatch?: string }[];
  onChange: (v: T) => void;
}) {
  const { colors, styles } = useTheme(makeStyles);
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={({ pressed }) => [
              styles.segment,
              active && styles.segmentActive,
              pressed && { opacity: 0.7 },
            ]}
          >
            {o.swatch && <View style={[styles.swatch, { backgroundColor: o.swatch }]} />}
            <Text style={[styles.segmentLabel, active && { color: colors.text, fontWeight: '700' }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { styles } = useTheme(makeStyles);
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const { styles } = useTheme(makeStyles);
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function ProgressBar({ value, color, height = 6 }: { value: number; color?: string; height?: number }) {
  const { colors, styles } = useTheme(makeStyles);
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={{
          width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`,
          height,
          borderRadius: height / 2,
          backgroundColor: color ?? colors.accent,
        }}
      />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1,
      borderColor: colors.border,
    },
    primary: { backgroundColor: colors.accent, borderColor: colors.accent },
    ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
    buttonLabel: { fontSize: 15, fontWeight: '600' },
    segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    segment: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.sm,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
    },
    segmentActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
    segmentLabel: { color: colors.muted, fontSize: 14 },
    swatch: { width: 14, height: 14, borderRadius: 7 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    sectionTitle: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    track: { backgroundColor: colors.surfaceHigh, overflow: 'hidden', width: '100%' },
  });
