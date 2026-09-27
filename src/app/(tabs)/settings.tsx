/** Optionen: Tempo, Farnsworth, Ton, Haptik und Lernfortschritt. */

import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { playText } from '../../audio/playback';
import { AppSwitch, Button, Card, SectionTitle } from '../../components/ui';
import { KOCH_ORDER, setLevel } from '../../lib/koch';
import { farnsworthSpacing } from '../../lib/timing';
import { DEFAULT_SETTINGS, ProgressKind, useStore } from '../../state/store';
import { colors } from '../../theme/colors';

function confirm(message: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onYes();
    return;
  }
  Alert.alert('Bist du sicher?', message, [
    { text: 'Abbrechen', style: 'cancel' },
    { text: 'Zurücksetzen', style: 'destructive', onPress: onYes },
  ]);
}

export default function SettingsScreen() {
  const { settings, updateSettings, progress, setProgress, resetProgress } = useStore();

  const reset = (kind: ProgressKind, label: string) =>
    confirm(`Fortschritt „${label}“ wirklich zurücksetzen?`, () => resetProgress(kind));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page}>
        <View>
          <SectionTitle>Taste</SectionTitle>
          <Card style={styles.card}>
            <Stepper
              label="Starttempo"
              hint="Ausgangswert für die Erkennung"
              value={settings.sendWpm}
              unit="WPM"
              min={4}
              max={40}
              onChange={(v) => updateSettings({ sendWpm: v })}
            />
            <Toggle
              label="Tempo automatisch anpassen"
              hint="Lernt dein Tempo aus Punkt- und Strichlängen"
              value={settings.adaptive}
              onChange={(v) => updateSettings({ adaptive: v })}
            />
            <Stepper
              label="Pausen-Toleranz"
              hint="Höher = mehr Zeit, bevor ein Buchstabe endet"
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
          <SectionTitle>Wiedergabe</SectionTitle>
          <Card style={styles.card}>
            <Stepper
              label="Zeichentempo"
              value={settings.charWpm}
              unit="WPM"
              min={5}
              max={40}
              onChange={(v) =>
                updateSettings({ charWpm: v, effectiveWpm: Math.min(settings.effectiveWpm, v) })
              }
            />
            <Stepper
              label="Effektives Tempo"
              hint="Farnsworth: längere Pausen zwischen Zeichen"
              value={settings.effectiveWpm}
              unit="WPM"
              min={2}
              max={settings.charWpm}
              onChange={(v) => updateSettings({ effectiveWpm: v })}
            />
            <Stepper
              label="Tonhöhe"
              value={settings.frequency}
              unit="Hz"
              step={50}
              min={400}
              max={1000}
              onChange={(v) => updateSettings({ frequency: v })}
            />
            <Stepper
              label="Lautstärke"
              value={settings.volume}
              step={0.1}
              min={0.1}
              max={1}
              format={(v) => `${Math.round(v * 100)} %`}
              onChange={(v) => updateSettings({ volume: v })}
            />
            <Button
              label="Probe: PARIS"
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
          <SectionTitle>Feedback</SectionTitle>
          <Card style={styles.card}>
            <Toggle label="Mithörton beim Tasten" value={settings.sound} onChange={(v) => updateSettings({ sound: v })} />
            <Toggle label="Haptik" value={settings.haptics} onChange={(v) => updateSettings({ haptics: v })} />
            <Toggle
              label="Hilfe beim Lernen"
              hint="Code und Pfad im Baum anzeigen"
              value={settings.showHints}
              onChange={(v) => updateSettings({ showHints: v })}
            />
          </Card>
        </View>

        <View>
          <SectionTitle>Lernfortschritt</SectionTitle>
          <Card style={styles.card}>
            {(
              [
                ['send', 'Senden'],
                ['listen', 'Hören'],
              ] as const
            ).map(([kind, label]) => (
              <View key={kind} style={{ gap: 8 }}>
                <Stepper
                  label={`${label}: Stufe`}
                  hint={`${progress[kind].level} von ${KOCH_ORDER.length} Zeichen`}
                  value={progress[kind].level - 1}
                  min={1}
                  max={KOCH_ORDER.length - 1}
                  onChange={(v) => setProgress(kind, setLevel(progress[kind], v + 1))}
                />
                <Button label={`${label} zurücksetzen`} icon="refresh" onPress={() => reset(kind, label)} />
              </View>
            ))}
          </Card>
        </View>

        <Button label="Standardwerte wiederherstellen" variant="ghost" onPress={() => updateSettings(DEFAULT_SETTINGS)} />
        <Text style={styles.footer}>
          Tipp: Im Browser funktioniert die Leertaste als Morsetaste.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
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
  const set = (v: number) => onChange(Math.round(Math.max(min, Math.min(max, v)) * 100) / 100);
  return (
    <Row label={label} hint={hint}>
      <View style={styles.stepper}>
        <Button icon="remove" onPress={() => set(value - step)} disabled={value <= min} accessibilityLabel={`${label} verringern`} />
        <Text style={styles.value}>{format ? format(value) : `${value}${unit ? ` ${unit}` : ''}`}</Text>
        <Button icon="add" onPress={() => set(value + step)} disabled={value >= max} accessibilityLabel={`${label} erhöhen`} />
      </View>
    </Row>
  );
}

const styles = StyleSheet.create({
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
