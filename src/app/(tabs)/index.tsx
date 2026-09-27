/** Freies Tasten: Live-Dekodierung mit Morse-Baum. */

import { useKeepAwake } from 'expo-keep-awake';
import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CodeDisplay } from '../../components/CodeDisplay';
import { MorseKey } from '../../components/MorseKey';
import { MorseTree } from '../../components/MorseTree';
import { SignalStrip } from '../../components/SignalStrip';
import { Button, Card } from '../../components/ui';
import { useKeyer } from '../../hooks/useKeyer';
import { wpmFromUnit } from '../../lib/timing';
import { colors } from '../../theme/colors';

export default function KeyScreen() {
  useKeepAwake();
  const { height } = useWindowDimensions();
  const keyer = useKeyer();
  const { snapshot } = keyer;
  const scroll = useRef<ScrollView>(null);

  const treeHeight = Math.max(150, Math.min(230, height * 0.27));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.page}>
        <Card style={styles.output}>
          <ScrollView
            ref={scroll}
            style={styles.textScroll}
            onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
          >
            <Text style={styles.text} accessibilityLiveRegion="polite">
              {snapshot.text || (snapshot.code ? '' : <Text style={styles.placeholder}>Dein Text erscheint hier …</Text>)}
              <Text style={styles.cursor}>▍</Text>
            </Text>
          </ScrollView>
          <View style={styles.toolbar}>
            <Text style={styles.tempo}>
              ≈ {Math.round(wpmFromUnit(snapshot.unit))} WPM · Einheit {Math.round(snapshot.unit)} ms
            </Text>
            <View style={styles.tools}>
              <Button icon="backspace-outline" onPress={keyer.backspace} accessibilityLabel="Löschen" />
              <Button icon="trash-outline" onPress={keyer.clear} accessibilityLabel="Alles löschen" />
            </View>
          </View>
        </Card>

        <MorseTree code={snapshot.code} height={treeHeight} />

        <View style={styles.codeArea}>
          <CodeDisplay code={snapshot.code} gapProgress={snapshot.gapProgress} />
          <SignalStrip recent={snapshot.recent} unit={snapshot.unit} />
        </View>

        <MorseKey
          pressed={snapshot.pressed}
          heldRatio={snapshot.heldRatio}
          onDown={keyer.down}
          onUp={keyer.up}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { flex: 1, padding: 16, gap: 12 },
  output: { gap: 8, paddingVertical: 10 },
  textScroll: { maxHeight: 64 },
  text: { color: colors.text, fontSize: 24, fontWeight: '600', letterSpacing: 2, fontVariant: ['tabular-nums'] },
  placeholder: { color: colors.faint, fontSize: 18, letterSpacing: 0, fontWeight: '400' },
  cursor: { color: colors.accent },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tools: { flexDirection: 'row', gap: 8 },
  tempo: { color: colors.muted, fontSize: 12 },
  codeArea: { gap: 8 },
});
