/** Optionen: Darstellung, Sprache, Tempo, Farnsworth, Ton, Haptik und Lernfortschritt. */

import { ReactNode } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { playText } from '../../audio/playback';
import { AppSwitch, Button, Card, SectionTitle, Segmented } from '../../components/ui';
import { LANGUAGE_NAMES, useT } from '../../i18n';
import { KOCH_ORDER, setLevel } from '../../lib/koch';
import { farnsworthSpacing } from '../../lib/timing';
import type { Accent, Language, ThemeMode } from '../../state/settings';
import { DEFAULT_SETTINGS, ProgressKind, useStore } from '../../state/store';
import { ACCENTS, Palette, useTheme } from '../../theme';

const ACCENT_ORDER: Accent[] = ['amber', 'teal', 'blue', 'violet', 'rose'];

export default function SettingsScreen() {
  const { colors, styles } = useTheme(makeStyles);
  const t = useT();
  const { settings, updateSettings, progress, setProgress, resetProgress } = useStore();

  const confirm = (message: string, onYes: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(message)) onYes();
      return;
    }
    Alert.alert(t('settings.resetTitle'), message, [
      { text: t('settings.cancel'), style: 'cancel' },
      { text: t('settings.resetButton'), style: 'destructive', onPress: onYes },
    ]);
  };

  const reset = (kind: ProgressKind, label: string) =>
    confirm(t('settings.resetConfirm', { label }), () => resetProgress(kind));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page}>
        <View>
          <SectionTitle>{t('settings.appearance')}</SectionTitle>
          <Card style={styles.card}>
            <Text style={styles.label}>{t('settings.mode')}</Text>
            <Segmented<ThemeMode>
              value={settings.themeMode}
              onChange={(v) => updateSettings({ themeMode: v })}
              options={[
                { value: 'system', label: t('settings.modeSystem') },
                { value: 'light', label: t('settings.modeLight') },
                { value: 'dark', label: t('settings.modeDark') },
              ]}
            />
            <Text style={styles.label}>{t('settings.color')}</Text>
            <Segmented<Accent>
              value={settings.accent}
              onChange={(v) => updateSettings({ accent: v })}
              options={ACCENT_ORDER.map((a) => ({
                value: a,
                label: t(`settings.accent.${a}`),
                swatch: ACCENTS[a][colors.scheme],
              }))}
            />
          </Card>
        </View>

        <View>
          <SectionTitle>{t('settings.language')}</SectionTitle>
          <Card style={styles.card}>
            <Segmented<Language>
              value={settings.language}
              onChange={(v) => updateSettings({ language: v })}
              options={[
                { value: 'system', label: t('settings.languageSystem') },
                { value: 'de', label: LANGUAGE_NAMES.de },
                { value: 'en', label: LANGUAGE_NAMES.en },
                { value: 'vi', label: LANGUAGE_NAMES.vi },
              ]}
            />
          </Card>
        </View>

        <View>
          <SectionTitle>{t('settings.key')}</SectionTitle>
          <Card style={styles.card}>
            <Stepper
              label={t('settings.sendWpm')}
              hint={t('settings.sendWpmHint')}
              value={settings.sendWpm}
              unit="WPM"
              min={4}
              max={40}
              onChange={(v) => updateSettings({ sendWpm: v })}
            />
            <Toggle
              label={t('settings.adaptive')}
              hint={t('settings.adaptiveHint')}
              value={settings.adaptive}
              onChange={(v) => updateSettings({ adaptive: v })}
            />
            <Stepper
              label={t('settings.gap')}
              hint={t('settings.gapHint')}
              value={settings.gapTolerance}
              step={0.1}
              min={0.7}
              max={3}
              format={(v) => `${v.toFixed(1)}×`}
              onChange={(v) => updateSettings({ gapTolerance: v })}
            />
          </Card>
        </View>

        <View>
          <SectionTitle>{t('settings.playback')}</SectionTitle>
          <Card style={styles.card}>
            <Stepper
              label={t('settings.charWpm')}
              value={settings.charWpm}
              unit="WPM"
              min={5}
              max={40}
              onChange={(v) => updateSettings({ charWpm: v, effectiveWpm: Math.min(settings.effectiveWpm, v) })}
            />
            <Stepper
              label={t('settings.effWpm')}
              hint={t('settings.effWpmHint')}
              value={settings.effectiveWpm}
              unit="WPM"
              min={2}
              max={settings.charWpm}
              onChange={(v) => updateSettings({ effectiveWpm: v })}
            />
            <Stepper
              label={t('settings.frequency')}
              value={settings.frequency}
              unit="Hz"
              step={50}
              min={400}
              max={1000}
              onChange={(v) => updateSettings({ frequency: v })}
            />
            <Stepper
              label={t('settings.volume')}
              value={settings.volume}
              step={0.1}
              min={0.1}
              max={1}
              format={(v) => `${Math.round(v * 100)} %`}
              onChange={(v) => updateSettings({ volume: v })}
            />
            <Button
              label={t('settings.sample')}
              icon="volume-high"
              onPress={() =>
                playText('PARIS', {
                  spacing: farnsworthSpacing(settings.charWpm, settings.effectiveWpm),
                  frequency: settings.frequency,
                  volume: settings.volume,
                  sound: true,
                  vibrate: false,
                })
              }
            />
          </Card>
        </View>

        <View>
          <SectionTitle>{t('settings.feedback')}</SectionTitle>
          <Card style={styles.card}>
            <Toggle label={t('settings.sidetone')} value={settings.sound} onChange={(v) => updateSettings({ sound: v })} />
            <Toggle label={t('settings.haptics')} value={settings.haptics} onChange={(v) => updateSettings({ haptics: v })} />
            <Toggle
              label={t('settings.hints')}
              hint={t('settings.hintsHint')}
              value={settings.showHints}
              onChange={(v) => updateSettings({ showHints: v })}
            />
          </Card>
        </View>

        <View>
          <SectionTitle>{t('settings.progress')}</SectionTitle>
          <Card style={styles.card}>
            {(['send', 'listen'] as const).map((kind) => {
              const label = t(kind === 'send' ? 'settings.send' : 'settings.listen');
              return (
                <View key={kind} style={{ gap: 8 }}>
                  <Stepper
                    label={t('settings.level', { label })}
                    hint={t('settings.levelHint', { n: progress[kind].level, total: KOCH_ORDER.length })}
                    value={progress[kind].level - 1}
                    min={1}
                    max={KOCH_ORDER.length - 1}
                    onChange={(v) => setProgress(kind, setLevel(progress[kind], v + 1))}
                  />
                  <Button label={t('settings.reset', { label })} icon="refresh" onPress={() => reset(kind, label)} />
                </View>
              );
            })}
          </Card>
        </View>

        <Button
          label={t('settings.defaults')}
          variant="ghost"
          onPress={() =>
            // Darstellung und Sprache bleiben erhalten.
            updateSettings({
              ...DEFAULT_SETTINGS,
              language: settings.language,
              themeMode: settings.themeMode,
              accent: settings.accent,
            })
          }
        />
        <Text style={styles.footer}>{t('settings.webTip')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const { styles } = useTheme(makeStyles);
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row label={label} hint={hint}>
      <AppSwitch value={value} onChange={onChange} label={label} />
    </Row>
  );
}

function Stepper({
  label,
  hint,
  value,
  unit,
  min,
  max,
  step = 1,
  format,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const { styles } = useTheme(makeStyles);
  const t = useT();
  const set = (v: number) => onChange(Math.round(Math.max(min, Math.min(max, v)) * 100) / 100);
  return (
    <Row label={label} hint={hint}>
      <View style={styles.stepper}>
        <Button
          icon="remove"
          onPress={() => set(value - step)}
          disabled={value <= min}
          accessibilityLabel={t('settings.decrease', { label })}
        />
        <Text style={styles.value}>{format ? format(value) : `${value}${unit ? ` ${unit}` : ''}`}</Text>
        <Button
          icon="add"
          onPress={() => set(value + step)}
          disabled={value >= max}
          accessibilityLabel={t('settings.increase', { label })}
        />
      </View>
    </Row>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    page: { padding: 16, gap: 20 },
    card: { gap: 14 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    label: { color: colors.text, fontSize: 15, fontWeight: '600' },
    hint: { color: colors.muted, fontSize: 12, marginTop: 2 },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    value: { color: colors.text, fontSize: 15, minWidth: 64, textAlign: 'center', fontVariant: ['tabular-nums'] },
    footer: { color: colors.faint, fontSize: 12, textAlign: 'center' },
  });
