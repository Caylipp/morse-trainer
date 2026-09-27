/**
 * Koch-Übung "Hören": Ein Zeichen wird mit Farnsworth-Timing vorgespielt,
 * man tippt die Antwort. Eigener Fortschritt, unabhängig vom Senden.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { hapticResult } from '../../audio/haptics';
import { playText, stopPlayback } from '../../audio/playback';
import { SymbolRow } from '../../components/CodeDisplay';
import { KochHeader } from '../../components/KochHeader';
import { Button, Card } from '../../components/ui';
import { pickNextChar, recordAttempt, unlockedChars } from '../../lib/koch';
import { encodeChar, prettyCode } from '../../lib/morse';
import { farnsworthSpacing } from '../../lib/timing';
import { useStore } from '../../state/store';
import { colors, radius } from '../../theme/colors';

interface Answer {
  picked: string;
  correct: boolean;
}

export default function ListenScreen() {
  const { progress: all, setProgress, settings } = useStore();
  const progress = all.listen;
  const [started, setStarted] = useState(false);
  const [picked, setPicked] = useState(() => pickNextChar(progress));
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [unlocked, setUnlocked] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      stopPlayback();
    },
    [],
  );

  // Falls die Stufe (z. B. in den Optionen) gesenkt wurde, ein erlaubtes Zeichen nehmen.
  const chars = unlockedChars(progress);
  const target = chars.includes(picked) ? picked : chars[chars.length - 1];

  const play = useCallback(
    (char: string) => {
      setPlaying(true);
      playText(char, {
        spacing: farnsworthSpacing(settings.charWpm, settings.effectiveWpm),
        frequency: settings.frequency,
        volume: settings.volume,
        sound: true,
        vibrate: false,
        onDone: () => setPlaying(false),
      });
    },
    [settings],
  );

  const next = (p = progress, previous = target) => {
    const c = pickNextChar(p, previous);
    setPicked(c);
    setAnswer(null);
    play(c);
  };

  const pick = (char: string) => {
    if (answer || !started) return;
    const correct = char === target;
    const result = recordAttempt(progress, target, correct);
    setProgress('listen', result.progress);
    setAnswer({ picked: char, correct });
    if (settings.haptics) hapticResult(correct);
    if (result.unlocked) {
      setUnlocked(result.unlocked);
      return; // Weiter erst nach Bestätigung des neuen Zeichens.
    }
    if (!correct) play(target);
    timer.current = setTimeout(() => next(result.progress, target), correct ? 700 : 2200);
  };

  const targetCode = encodeChar(target) ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page}>
        <KochHeader progress={progress} />
        <Text style={styles.info}>
          Zeichen mit {settings.charWpm} WPM, Pausen wie {settings.effectiveWpm} WPM (Farnsworth)
        </Text>

        {unlocked && (
          <Card style={styles.unlock}>
            <Text style={styles.unlockText}>
              Neues Zeichen: <Text style={styles.unlockChar}>{unlocked}</Text>{' '}
              {prettyCode(encodeChar(unlocked) ?? '')}
            </Text>
            <View style={styles.row}>
              <Button icon="volume-high" label="Anhören" onPress={() => play(unlocked)} />
              <Button
                label="Weiter"
                variant="primary"
                onPress={() => {
                  setUnlocked(null);
                  next();
                }}
              />
            </View>
          </Card>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={started ? 'Zeichen wiederholen' : 'Übung starten'}
          onPress={() => {
            if (!started) setStarted(true);
            play(target);
          }}
          style={({ pressed }) => [
            styles.playBox,
            playing && styles.playing,
            answer && { borderColor: answer.correct ? colors.good : colors.bad },
            pressed && { opacity: 0.8 },
          ]}
        >
          {answer ? (
            <>
              <Text style={[styles.bigChar, { color: answer.correct ? colors.good : colors.bad }]}>{target}</Text>
              <SymbolRow code={targetCode} size={12} color={colors.muted} />
              {!answer.correct && <Text style={styles.small}>Deine Antwort: {answer.picked}</Text>}
            </>
          ) : (
            <>
              <Text style={styles.playIcon}>{started ? (playing ? '♪' : '↻') : '▶'}</Text>
              <Text style={styles.small}>{started ? 'Nochmal hören' : 'Start'}</Text>
            </>
          )}
        </Pressable>

        <View style={styles.grid}>
          {chars.map((c) => {
            const isPicked = answer?.picked === c;
            const isTarget = answer && c === target;
            return (
              <Pressable
                key={c}
                accessibilityRole="button"
                accessibilityLabel={`Antwort ${c}`}
                onPress={() => pick(c)}
                disabled={!started || !!answer}
                style={({ pressed }) => [
                  styles.answer,
                  isTarget && { borderColor: colors.good, backgroundColor: colors.goodDim },
                  isPicked && !answer?.correct && { borderColor: colors.bad, backgroundColor: colors.badDim },
                  pressed && { opacity: 0.7 },
                  !started && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.answerText}>{c}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: 16, gap: 14 },
  row: { flexDirection: 'row', gap: 8 },
  info: { color: colors.muted, fontSize: 12 },
  unlock: { gap: 10, borderColor: colors.accent },
  unlockText: { color: colors.text, fontSize: 16 },
  unlockChar: { color: colors.accent, fontSize: 22, fontWeight: '800' },
  playBox: {
    height: 170,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playing: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  playIcon: { color: colors.accent, fontSize: 56, lineHeight: 64 },
  bigChar: { fontSize: 64, fontWeight: '800', lineHeight: 72 },
  small: { color: colors.muted, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  answer: {
    width: 62,
    height: 62,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerText: { color: colors.text, fontSize: 24, fontWeight: '700' },
});
