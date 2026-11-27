/**
 * Q-Codes und Abkürzungen: Das Wort wird mit Farnsworth-Timing vorgespielt, man wählt
 * die Bedeutung. Spaced Repetition (Leitner), nachsichtig und ohne Zeitdruck.
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { hapticResult } from '../../audio/haptics';
import { playText, stopPlayback } from '../../audio/playback';
import { Button, ProgressBar } from '../../components/ui';
import { resolveLocale, useT } from '../../i18n';
import { ABBREV_IDS, buildChoices, findAbbrev } from '../../lib/abbrev';
import { dueCount, masteredCount, pickNext, review } from '../../lib/srs';
import { farnsworthSpacing } from '../../lib/timing';
import { useStore } from '../../state/store';
import { Palette, radius, useTheme } from '../../theme';

/** Aktuelle Zeit; als Funktion außerhalb der Komponente, weil sie nur in Ereignissen gebraucht wird. */
const clock = () => Date.now();

export default function AbbrevScreen() {
  const { colors, styles } = useTheme(makeStyles);
  const t = useT();
  const { settings, srs, setSrs } = useStore();
  const locale = resolveLocale(settings.language);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState<string>(() => pickNext(srs, ABBREV_IDS, clock()) ?? ABBREV_IDS[0]);
  const [picked, setPicked] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [isNew, setIsNew] = useState(() => !srs[current]);
  const [now, setNow] = useState(() => clock());

  useEffect(() => () => stopPlayback(), []);

  const choices = useMemo(() => buildChoices(current), [current]);
  const item = findAbbrev(current);

  const play = useCallback(
    (code: string) => {
      setPlaying(true);
      playText(code, {
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

  const choose = (code: string) => {
    if (picked || !started) return;
    const correct = code === current;
    const at = clock();
    setNow(at);
    setSrs(review(srs, current, correct, at));
    setPicked(code);
    if (settings.haptics) hapticResult(correct);
    if (!correct) play(current);
  };

  const next = () => {
    stopPlayback();
    const at = clock();
    const nextCode = pickNext(srs, ABBREV_IDS, at, current) ?? current;
    setNow(at);
    setIsNew(!srs[nextCode]);
    setCurrent(nextCode);
    setPicked(null);
    play(nextCode);
  };

  if (!item) return null;
  const answered = picked !== null;
  const correct = picked === current;
  const showCode = answered || settings.showHints;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.head}>
          <Button icon="chevron-back" label={t('common.back')} variant="ghost" onPress={() => router.navigate('/settings')} />
          <Text style={styles.title}>{t('abbrev.title')}</Text>
        </View>
        <View style={{ gap: 6 }}>
          <Text style={styles.muted}>
            {t('abbrev.progress', {
              mastered: masteredCount(srs, ABBREV_IDS),
              total: ABBREV_IDS.length,
              due: dueCount(srs, ABBREV_IDS, now),
            })}
          </Text>
          <ProgressBar value={masteredCount(srs, ABBREV_IDS) / ABBREV_IDS.length} />
        </View>
        <Text style={styles.muted}>{t('abbrev.info', { char: settings.charWpm, eff: settings.effectiveWpm })}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(started ? 'abbrev.again' : 'abbrev.startLabel')}
          onPress={() => {
            if (!started) setStarted(true);
            play(current);
          }}
          style={({ pressed }) => [
            styles.playBox,
            playing && styles.playing,
            answered && { borderColor: correct ? colors.good : colors.bad },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons
            name={playing ? 'volume-high' : started ? 'refresh' : 'play'}
            size={44}
            color={answered ? (correct ? colors.good : colors.bad) : colors.accent}
          />
          {started && showCode ? (
            <Text style={styles.code}>{current}</Text>
          ) : (
            <Text style={styles.muted}>{t(started ? 'abbrev.listenCarefully' : 'abbrev.start')}</Text>
          )}
          {started && (
            <Text style={styles.muted}>
              {isNew && !answered ? `${t('abbrev.new')} · ` : ''}
              {t(item.kind === 'q' ? 'abbrev.q' : 'abbrev.abbr')}
            </Text>
          )}
        </Pressable>

        {started && !answered && <Text style={styles.prompt}>{t('abbrev.prompt')}</Text>}

        <View style={styles.choices}>
          {choices.map((code) => {
            const text = findAbbrev(code)?.[locale] ?? code;
            const isPicked = picked === code;
            const isTarget = answered && code === current;
            return (
              <Pressable
                key={code}
                accessibilityRole="button"
                accessibilityLabel={text}
                disabled={!started || answered}
                onPress={() => choose(code)}
                style={({ pressed }) => [
                  styles.choice,
                  isTarget && { borderColor: colors.good, backgroundColor: colors.goodDim },
                  isPicked && !correct && { borderColor: colors.bad, backgroundColor: colors.badDim },
                  pressed && { opacity: 0.7 },
                  !started && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.choiceText}>{text}</Text>
                {answered && (isTarget || isPicked) && <Text style={styles.choiceCode}>{code}</Text>}
              </Pressable>
            );
          })}
        </View>

        {answered && <Button label={t('abbrev.next')} icon="arrow-forward" variant="primary" onPress={next} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    page: { padding: 16, gap: 14 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { color: colors.text, fontSize: 20, fontWeight: '700' },
    muted: { color: colors.muted, fontSize: 13 },
    prompt: { color: colors.text, fontSize: 16, fontWeight: '600' },
    playBox: {
      height: 150,
      borderRadius: radius.lg,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    playing: { borderColor: colors.accent, backgroundColor: colors.accentDim },
    code: { color: colors.text, fontSize: 40, fontWeight: '800', letterSpacing: 2 },
    choices: { gap: 8 },
    choice: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      padding: 14,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
    },
    choiceText: { color: colors.text, fontSize: 15, flex: 1 },
    choiceCode: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  });
