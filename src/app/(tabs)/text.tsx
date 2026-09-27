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
import { MORSE_TABLE, prettyCode, tokenizeText } from '../../lib/morse';
import { farnsworthSpacing } from '../../lib/timing';
import { useStore } from '../../state/store';
import { colors, radius } from '../../theme/colors';

const GROUPS: { title: string; chars: string[] }[] = [
  { title: 'Buchstaben', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') },
  { title: 'Umlaute', chars: ['Ä', 'Ö', 'Ü', 'CH', 'ß'] },
  { title: 'Ziffern', chars: '1234567890'.split('') },
  { title: 'Zeichen', chars: ['.', ',', '?', '/', '=', '+', '-', ':', '@', '!', '(', ')'] },
];

function KeepAwake() {
  useKeepAwake();
  return null;
}

export default function TextScreen() {
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
  const [playing, setPlaying] = useState(false);
  const [signal, setSignal] = useState(false);
  const [activeChar, setActiveChar] = useState<number | undefined>(undefined);

  useEffect(() => () => stopPlayback(), []);

  const words = tokenizeText(text);
  const flat = words.flat();

  const play = (value: string, withLight = light) => {
    if (playing) {
      stopPlayback();
      return;
    }
    setPlaying(true);
    setLight(withLight);
    playText(value, {
      spacing: farnsworthSpacing(settings.charWpm, settings.effectiveWpm),
      frequency: settings.frequency,
      volume: settings.volume,
      sound,
      vibrate,
      onSignal: (on, charIndex) => {
        setSignal(on);
        if (charIndex !== undefined) setActiveChar(charIndex);
      },
      onDone: () => {
        setPlaying(false);
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
            placeholder="Text eingeben …"
            placeholderTextColor={colors.faint}
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.input}
            accessibilityLabel="Text zum Umwandeln"
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
            {flat.length === 0 && <Text style={styles.muted}>Keine morsbaren Zeichen.</Text>}
          </View>
          <View style={styles.toggles}>
            <Toggle label="Ton" value={sound} onChange={setSound} />
            <Toggle label="Vibration" value={vibrate} onChange={setVibrate} />
            <Toggle label="Licht" value={light} onChange={setLight} />
          </View>
          <Button
            label={playing ? 'Stopp' : 'Abspielen'}
            icon={playing ? 'stop' : 'play'}
            variant="primary"
            onPress={() => play(text)}
            disabled={flat.length === 0 && !playing}
          />
        </Card>

        {GROUPS.map((g) => (
          <View key={g.title}>
            <SectionTitle>{g.title}</SectionTitle>
            <View style={styles.table}>
              {g.chars.map((c) => (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={`${c} anhören`}
                  onPress={() => play(c, false)}
                  style={({ pressed }) => [
                    styles.cell,
                    { width: cellWidth },
                    pressed && { backgroundColor: colors.accentDim },
                  ]}
                >
                  <Text style={styles.cellChar}>{c}</Text>
                  <Text style={styles.cellCode}>{prettyCode(MORSE_TABLE[c])}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={playing && light} animationType="none" transparent={false} onRequestClose={stopPlayback}>
        <Pressable
          style={[styles.flash, { backgroundColor: signal ? '#FFFFFF' : '#000000' }]}
          onPress={stopPlayback}
          accessibilityLabel="Lichtsignal, tippen zum Beenden"
        >
          <Text style={[styles.flashHint, { color: signal ? '#999' : '#444' }]}>Tippen zum Beenden</Text>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <AppSwitch value={value} onChange={onChange} label={label} />
      <Text style={styles.toggleLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  cellChar: { color: colors.text, fontSize: 18, fontWeight: '700' },
  cellCode: { color: colors.accent, fontSize: 14, letterSpacing: 1 },
  flash: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 60 },
  flashHint: { fontSize: 14 },
});
