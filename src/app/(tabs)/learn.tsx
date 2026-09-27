/**
 * Koch-Übung "Senden": Die App zeigt ein Zeichen, man tastet es.
 * Ab 90 % Treffern über die letzten 20 Versuche kommt ein neues Zeichen dazu.
 */

import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { hapticResult } from '../../audio/haptics';
import { playText } from '../../audio/playback';
import { SymbolRow } from '../../components/CodeDisplay';
import { KochHeader } from '../../components/KochHeader';
import { MorseKey } from '../../components/MorseKey';
import { MorseTree } from '../../components/MorseTree';
import { Button, Card } from '../../components/ui';
import { KeyerApi, useKeyer } from '../../hooks/useKeyer';
import { DecoderEvent } from '../../lib/decoder';
import { pickNextChar, recordAttempt, unlockedChars } from '../../lib/koch';
import { encodeChar, prettyCode } from '../../lib/morse';
import { farnsworthSpacing } from '../../lib/timing';
import { useStore } from '../../state/store';
import { colors, radius } from '../../theme/colors';

interface Feedback {
  correct: boolean;
  sentCode: string;
  sentChar?: string;
}

export default function LearnScreen() {
  useKeepAwake();
  const { height } = useWindowDimensions();
  const { progress: all, setProgress, settings } = useStore();
  const progress = all.send;

  const [picked, setPicked] = useState(() => pickNextChar(progress));
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [unlocked, setUnlocked] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [hintOverride, setHintOverride] = useState<boolean | null>(null);
  const hint = hintOverride ?? settings.showHints;

  // Falls die Stufe (z. B. in den Optionen) gesenkt wurde, ein erlaubtes Zeichen nehmen.
  const chars = unlockedChars(progress);
  const target = chars.includes(picked) ? picked : chars[chars.length - 1];

  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const play = useCallback(
    (text: string) =>
      playText(text, {
        spacing: farnsworthSpacing(settings.charWpm, settings.effectiveWpm),
        frequency: settings.frequency,
        volume: settings.volume,
        sound: settings.sound,
        vibrate: false,
      }),
    [settings],
  );

  const onEvents = useCallback(
    (events: DecoderEvent[], api: KeyerApi) => {
      const letter = events.find((e) => e.type === 'letter');
      if (!letter || letter.type !== 'letter' || busy.current) return;
      busy.current = true;
      const goal = target;
      const correct = letter.char === goal;
      const result = recordAttempt(progress, goal, correct);
      setProgress('send', result.progress);
      setFeedback({ correct, sentCode: letter.code, sentChar: letter.char });
      setStreak((s) => (correct ? s + 1 : 0));
      if (settings.haptics) hapticResult(correct);
      if (result.unlocked) setUnlocked(result.unlocked);

      timer.current = setTimeout(
        () => {
          api.clear();
          setFeedback(null);
          setPicked(pickNextChar(result.progress, goal));
          busy.current = false;
        },
        correct ? 700 : 1600,
      );
    },
    [progress, target, setProgress, settings.haptics],
  );

  const keyer = useKeyer(onEvents);
  const { snapshot } = keyer;
  const targetCode = encodeChar(target) ?? '';

  const skip = () => {
    if (busy.current) return;
    keyer.clear();
    setPicked(pickNextChar(progress, target));
  };

  const treeHeight = Math.max(120, Math.min(190, height * 0.22));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.page}>
        <KochHeader progress={progress} current={target} />

        {unlocked && (
          <Card style={styles.unlock}>
            <Text style={styles.unlockText}>
              Neues Zeichen: <Text style={styles.unlockChar}>{unlocked}</Text>{' '}
              {prettyCode(encodeChar(unlocked) ?? '')}
            </Text>
            <View style={styles.row}>
              <Button icon="volume-high" onPress={() => play(unlocked)} accessibilityLabel="Anhören" />
              <Button label="Weiter" onPress={() => setUnlocked(null)} variant="primary" />
            </View>
          </Card>
        )}

        <View style={styles.targetRow}>
          <View
            style={[
              styles.targetBox,
              feedback && { borderColor: feedback.correct ? colors.good : colors.bad },
              feedback && { backgroundColor: feedback.correct ? colors.goodDim : colors.badDim },
            ]}
          >
            <Text style={styles.targetChar}>{target}</Text>
            <View style={styles.targetCode}>
              {hint || (feedback && !feedback.correct) ? (
                <SymbolRow code={targetCode} size={12} color={colors.muted} />
              ) : (
                <Text style={styles.hidden}>? ? ?</Text>
              )}
            </View>
          </View>
          <View style={styles.side}>
            <Text style={styles.feedback} numberOfLines={2}>
              {feedback
                ? feedback.correct
                  ? '✓ Richtig!'
                  : `✗ Gesendet: ${feedback.sentChar ?? '?'} (${prettyCode(feedback.sentCode)})`
                : snapshot.code
                  ? prettyCode(snapshot.code)
                  : 'Taste dieses Zeichen'}
            </Text>
            <Text style={styles.streak}>{streak > 1 ? `🔥 ${streak} in Folge` : ' '}</Text>
            <View style={styles.row}>
              <Button icon="volume-high" onPress={() => play(target)} accessibilityLabel="Anhören" />
              <Button
                icon={hint ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setHintOverride(!hint)}
                accessibilityLabel={hint ? 'Hilfe ausblenden' : 'Hilfe einblenden'}
              />
              <Button icon="play-skip-forward" onPress={skip} accessibilityLabel="Überspringen" />
            </View>
          </View>
        </View>

        <MorseTree
          code={snapshot.code}
          target={hint ? targetCode : undefined}
          enabledChars={chars}
          height={treeHeight}
        />
        <View style={styles.gapTrack}>
          <View style={[styles.gapFill, { width: `${Math.round(snapshot.gapProgress * 100)}%` }]} />
        </View>

        <MorseKey
          pressed={snapshot.pressed}
          heldRatio={snapshot.heldRatio}
          onDown={keyer.down}
          onUp={keyer.up}
          minHeight={120}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { flex: 1, padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 8 },
  unlock: { gap: 10, borderColor: colors.accent },
  unlockText: { color: colors.text, fontSize: 16 },
  unlockChar: { color: colors.accent, fontSize: 22, fontWeight: '800' },
  targetRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  targetBox: {
    width: 110,
    height: 110,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  targetChar: { color: colors.text, fontSize: 52, fontWeight: '800', lineHeight: 60 },
  targetCode: { height: 14, justifyContent: 'center' },
  hidden: { color: colors.faint, fontSize: 12 },
  side: { flex: 1, gap: 6 },
  feedback: { color: colors.text, fontSize: 17, fontWeight: '600' },
  streak: { color: colors.accent, fontSize: 13 },
  gapTrack: { height: 3, backgroundColor: colors.surfaceHigh, borderRadius: 2, overflow: 'hidden' },
  gapFill: { height: 3, backgroundColor: colors.muted },
});
