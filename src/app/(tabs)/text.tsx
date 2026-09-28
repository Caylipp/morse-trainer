/**
 * Text → Morse: Eingabe umwandeln und als Ton, Vibration oder Lichtsignal
 * (Bildschirm-Blitz) ausgeben. Darunter die Morsetabelle zum Nachschlagen.
 */

import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { playText, stopPlayback } from '../../audio/playback';
import { AppSwitch, Button, Card, SectionTitle } from '../../components/ui';
import { TranslationKey, useT } from '../../i18n';
import { MORSE_TABLE, prettyCode, tokenizeText } from '../../lib/morse';
import { farnsworthSpacing } from '../../lib/timing';
import { useStore } from '../../state/store';
import { Palette, radius, useTheme } from '../../theme';

const GROUPS: { title: TranslationKey; chars: string[] }[] = [
  { title: 'text.letters', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') },
  { title: 'text.umlauts', chars: ['Ä', 'Ö', 'Ü', 'CH', 'ß'] },
  { title: 'text.digits', chars: '1234567890'.split('') },
  { title: 'text.punctuation', chars: ['.', ',', '?', '/', '=', '+', '-', ':', '@', '!', '(', ')'] },
];

/** Was gerade abgespielt wird: der eingegebene Text oder ein Zeichen aus der Tabelle. */
type Source = { kind: 'input' } | { kind: 'table'; char: string };

function KeepAwake() {
  useKeepAwake();
  return null;
}

export default function TextScreen() {
  const { colors, styles } = useTheme(makeStyles);
  const t = useT();
  const { settings } = useStore();
  const { width } = useWindowDimensions();
  // Tabelle füllt die Breite: so viele Spalten wie passen, mindestens vier.
  const inner = Math.min(width, 720) - 32;
  const cols = Math.max(4, Math.floor((inner + 6) / 84));
  const cellWidth = (inner - (cols - 1) * 6) / cols;

  const [text, setText] = useState('SOS');
  const [sound, setSound] = useState(true);
  const [vibrate, setVibrate] = useState(false);
  const [light, setLight] = useState(false);
  const [source, setSource] = useState<Source | null>(null);
  const [signal, setSignal] = useState(false);
  const [activeChar, setActiveChar] = useState<number | undefined>(undefined);

  useEffect(() => () => stopPlayback(), []);

  const words = tokenizeText(text);
  const flat = words.flat();
  const playing = source !== null;
  // Das Lichtsignal gilt nur für den eingegebenen Text, nicht für die Tabelle.
  const flashing = light && source?.kind === 'input';

  const play = (value: string, from: Source) => {
    if (playing) {
      stopPlayback();
      return;
    }
    setSource(from);
    playText(value, {
      spacing: farnsworthSpacing(settings.charWpm, settings.effectiveWpm),
      frequency: settings.frequency,
      volume: settings.volume,
      sound,
      vibrate,
      onSignal: (on, charIndex) => {
        setSignal(on);
        // Nur beim eingegebenen Text die Position oben mitlaufen lassen.
        if (from.kind === 'input' && charIndex !== undefined) setActiveChar(charIndex);
      },
      onDone: () => {
        setSource(null);
        setSignal(false);
        setActiveChar(undefined);
      },
    });
  };

  let index = 0;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {playing && <KeepAwake />}
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 12 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('text.placeholder')}
            placeholderTextColor={colors.faint}
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.input}
            accessibilityLabel={t('text.inputLabel')}
          />
          <View style={styles.morse}>
            {words.map((word, wi) => (
              <View key={wi} style={styles.word}>
                {word.map((c) => {
                  const i = index++;
                  const active = i === activeChar;
                  return (
                    <View key={i} style={[styles.letter, active && styles.letterActive]}>
                      <Text style={[styles.letterChar, active && { color: colors.accent }]}>{c}</Text>
                      <Text style={[styles.letterCode, active && { color: colors.accent }]}>
                        {prettyCode(MORSE_TABLE[c])}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
            {flat.length === 0 && <Text style={styles.muted}>{t('text.empty')}</Text>}
          </View>
          <View style={styles.toggles}>
            <Toggle label={t('text.sound')} value={sound} onChange={setSound} />
            <Toggle label={t('text.vibration')} value={vibrate} onChange={setVibrate} />
            <Toggle label={t('text.light')} value={light} onChange={setLight} />
          </View>
          <Button
            label={source?.kind === 'input' ? t('text.stop') : t('text.play')}
            icon={source?.kind === 'input' ? 'stop' : 'play'}
            variant="primary"
            onPress={() => play(text, { kind: 'input' })}
            disabled={flat.length === 0 && !playing}
          />
        </Card>

        {GROUPS.map((g) => (
          <View key={g.title}>
            <SectionTitle>{t(g.title)}</SectionTitle>
            <View style={styles.table}>
              {g.chars.map((c) => {
                const active = source?.kind === 'table' && source.char === c;
                return (
                  <Pressable
                    key={c}
                    accessibilityRole="button"
                    accessibilityLabel={t('text.playChar', { char: c })}
                    onPress={() => play(c, { kind: 'table', char: c })}
                    style={({ pressed }) => [
                      styles.cell,
                      { width: cellWidth },
                      (pressed || active) && styles.cellActive,
                      active && signal && styles.cellSignal,
                    ]}
                  >
                    <Text style={styles.cellChar}>{c}</Text>
                    <Text style={styles.cellCode}>{prettyCode(MORSE_TABLE[c])}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={flashing} animationType="none" transparent={false} onRequestClose={stopPlayback}>
        <Pressable
          style={[styles.flash, { backgroundColor: signal ? '#FFFFFF' : '#000000' }]}
          onPress={stopPlayback}
          accessibilityLabel={t('text.flashLabel')}
        >
          <Text style={[styles.flashHint, { color: signal ? '#999' : '#444' }]}>{t('text.flashHint')}</Text>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { styles } = useTheme(makeStyles);
  return (
    <View style={styles.toggle}>
      <AppSwitch value={value} onChange={onChange} label={label} />
      <Text style={styles.toggleLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    page: { padding: 16, gap: 18, width: '100%', maxWidth: 720, alignSelf: 'center' },
    input: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '600',
      backgroundColor: colors.surfaceHigh,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    morse: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, minHeight: 44 },
    word: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    letter: { alignItems: 'center', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 6 },
    letterActive: { backgroundColor: colors.accentDim },
    letterChar: { color: colors.text, fontSize: 15, fontWeight: '700' },
    letterCode: { color: colors.muted, fontSize: 15, letterSpacing: 1 },
    muted: { color: colors.muted },
    toggles: { flexDirection: 'row', justifyContent: 'space-between' },
    toggle: { alignItems: 'center', gap: 4 },
    toggleLabel: { color: colors.muted, fontSize: 12 },
    table: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    cell: {
      paddingVertical: 8,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      gap: 2,
    },
    cellActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
    cellSignal: { borderWidth: 2 },
    cellChar: { color: colors.text, fontSize: 18, fontWeight: '700' },
    cellCode: { color: colors.accent, fontSize: 14, letterSpacing: 1 },
    flash: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 60 },
    flashHint: { fontSize: 14 },
  });
