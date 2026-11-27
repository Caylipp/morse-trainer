/**
 * Statistik: Fehlerquote je Zeichen (Senden/Hören getrennt), häufige Verwechslungen
 * und der Stand der Abkürzungen. Nur Anzeige, nichts wird verändert.
 */

import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, ProgressBar, SectionTitle, Segmented } from '../../components/ui';
import { useT } from '../../i18n';
import { ABBREV_IDS } from '../../lib/abbrev';
import { charReports, topConfusions, totals } from '../../lib/koch';
import { dueCount, masteredCount } from '../../lib/srs';
import { ProgressKind, useStore } from '../../state/store';
import { Palette, useTheme } from '../../theme';

export default function StatsScreen() {
  const { colors, styles } = useTheme(makeStyles);
  const t = useT();
  const { progress, srs } = useStore();
  const [now] = useState(() => Date.now());
  const [kind, setKind] = useState<ProgressKind>('listen');
  const p = progress[kind];
  const { attempts, correct } = totals(p);
  const reports = charReports(p);
  const confusions = topConfusions(p);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.head}>
          <Button icon="chevron-back" label={t('common.back')} variant="ghost" onPress={() => router.navigate('/settings')} />
          <Text style={styles.title}>{t('stats.title')}</Text>
        </View>

        <Segmented<ProgressKind>
          value={kind}
          onChange={setKind}
          options={[
            { value: 'listen', label: t('settings.listen') },
            { value: 'send', label: t('settings.send') },
          ]}
        />

        {attempts === 0 ? (
          <Text style={styles.muted}>{t('stats.empty')}</Text>
        ) : (
          <>
            <Text style={styles.overall}>
              {t('stats.overall', { pct: Math.round((correct / attempts) * 100), n: attempts })}
            </Text>

            <View>
              <SectionTitle>{t('stats.chars')}</SectionTitle>
              <Card style={styles.card}>
                {reports.map((r) => (
                  <View
                    key={r.char}
                    style={styles.charRow}
                    accessible
                    accessibilityLabel={t('stats.charRow', {
                      char: r.char,
                      n: r.attempts,
                      pct: Math.round(r.errorRate * 100),
                    })}
                  >
                    <Text style={styles.char}>{r.char}</Text>
                    <View style={{ flex: 1 }}>
                      <ProgressBar
                        value={r.errorRate}
                        color={r.errorRate > 0.4 ? colors.bad : r.errorRate > 0.1 ? colors.accent : colors.good}
                      />
                    </View>
                    <Text style={styles.small}>{Math.round(r.errorRate * 100)} % · {r.attempts}</Text>
                  </View>
                ))}
              </Card>
            </View>

            <View>
              <SectionTitle>{t('stats.confusions')}</SectionTitle>
              <Card style={styles.card}>
                <Text style={styles.muted}>{t('stats.confusionHint')}</Text>
                {confusions.length === 0 ? (
                  <Text style={styles.text}>{t('stats.noConfusions')}</Text>
                ) : (
                  confusions.map((c) => (
                    <Text key={`${c.char}${c.answered}`} style={styles.text}>
                      {t('stats.confusionRow', { char: c.char, answered: c.answered, n: c.count })}
                    </Text>
                  ))
                )}
              </Card>
            </View>
          </>
        )}

        <View>
          <SectionTitle>{t('stats.abbrev')}</SectionTitle>
          <Card>
            <Text style={styles.text}>
              {t('stats.abbrevRow', {
                mastered: masteredCount(srs, ABBREV_IDS),
                total: ABBREV_IDS.length,
                due: dueCount(srs, ABBREV_IDS, now),
              })}
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    page: { padding: 16, gap: 16 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { color: colors.text, fontSize: 20, fontWeight: '700' },
    card: { gap: 10 },
    overall: { color: colors.text, fontSize: 16, fontWeight: '600' },
    muted: { color: colors.muted, fontSize: 13 },
    text: { color: colors.text, fontSize: 15 },
    small: { color: colors.muted, fontSize: 12, minWidth: 64, textAlign: 'right', fontVariant: ['tabular-nums'] },
    charRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    char: { color: colors.text, fontSize: 16, fontWeight: '700', width: 24, textAlign: 'center' },
  });
