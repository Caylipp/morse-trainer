/**
 * Der Morse-Baum: Punkt verzweigt nach links, Strich nach rechts.
 * Der aktuell getastete Pfad leuchtet, noch erreichbare Zeichen bleiben hell,
 * alles andere wird abgedunkelt. Während die Taste gehalten wird, ist der Zweig
 * vormarkiert, der beim Loslassen entstehen würde (erst Punkt, ab der
 * Strich-Grenze Strich).
 */

import { memo, useMemo, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';

import { useT } from '../i18n';
import { buildTree, parentCode, TreeNode } from '../lib/morse';
import { Palette, useTheme } from '../theme';

const DEPTH = 4;
const NODES = buildTree(DEPTH);
// Ohne Angabe nutzt SVG im Browser eine Serifenschrift.
const FONT = Platform.select({ web: 'system-ui, -apple-system, sans-serif', default: undefined });

interface Props {
  /** Getasteter Code, inklusive eines gerade gehaltenen Symbols. */
  code: string;
  /** Das letzte Symbol von `code` ist noch nicht losgelassen (Vormarkierung). */
  pending?: boolean;
  /** Optional: Code des Zielzeichens, dessen Pfad als Hilfe gestrichelt markiert wird. */
  target?: string;
  /** Optional: nur diese Zeichen werden als "aktiv" hervorgehoben (z. B. Koch-Stufe). */
  enabledChars?: string[];
  height?: number;
}

const makeStyles = (_colors: Palette) =>
  StyleSheet.create({
    wrap: { width: '100%' },
  });

function MorseTreeImpl({ code, pending = false, target, enabledChars, height = 200 }: Props) {
  const { colors, styles } = useTheme(makeStyles);
  const t = useT();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const layout = useMemo(() => {
    if (!width) return null;
    const leafSpacing = width / 2 ** DEPTH;
    const r = Math.max(7, Math.min(14, leafSpacing / 2 - 1.5));
    const top = 8;
    const rowH = (height - top - r - 3) / DEPTH;
    const pos = (n: { x: number; depth: number }) => ({ cx: n.x * width, cy: top + n.depth * rowH });
    return { r, pos, root: { cx: width / 2, cy: top } };
  }, [width, height]);

  const shown = code.slice(0, DEPTH);
  // Der vorläufige Knoten ist nur dann markiert, wenn er noch im gezeichneten Baum liegt.
  const pendingCode = pending && code.length <= DEPTH ? shown : null;
  const enabled = enabledChars ? new Set(enabledChars) : null;

  const stateOf = (n: TreeNode) => {
    const onPath = shown.startsWith(n.code);
    const isPending = n.code === pendingCode;
    const isCurrent = n.code === shown;
    const reachable = n.code.startsWith(shown);
    const onTarget = target !== undefined && target.startsWith(n.code);
    return { onPath, isPending, isCurrent, reachable, onTarget };
  };

  return (
    <View style={[styles.wrap, { height }]} onLayout={onLayout}>
      {layout && (
        <Svg width={width} height={height}>
          <G>
            {NODES.map((n) => {
              const parent = parentCode(n.code);
              const p = parent ? layout.pos(NODES.find((m) => m.code === parent)!) : layout.root;
              const c = layout.pos(n);
              const s = stateOf(n);
              return (
                <Line
                  key={`e${n.code}`}
                  x1={p.cx}
                  y1={p.cy}
                  x2={c.cx}
                  y2={c.cy}
                  stroke={s.onPath ? colors.accent : s.onTarget ? colors.good : colors.border}
                  strokeWidth={s.onPath ? 3 : s.onTarget ? 2 : 1}
                  strokeDasharray={
                    s.isPending ? '6 4' : s.onTarget && !s.onPath ? '4 3' : undefined
                  }
                />
              );
            })}
          </G>
          <Circle cx={layout.root.cx} cy={layout.root.cy} r={5} fill={code ? colors.accent : colors.muted} />
          {NODES.map((n) => {
            const { cx, cy } = layout.pos(n);
            const s = stateOf(n);
            const isEnabled = !enabled || (n.char !== undefined && enabled.has(n.char));
            const dim = (!s.reachable && code !== '') || !isEnabled;
            const solid = s.isCurrent && !s.isPending;
            const fill = solid ? colors.accent : s.onPath ? colors.accentDim : colors.surfaceHigh;
            const stroke = s.onPath
              ? colors.accent
              : s.onTarget
                ? colors.good
                : enabled && isEnabled
                  ? colors.muted
                  : colors.border;
            const label = n.char ?? '';
            return (
              <G key={n.code} opacity={dim ? 0.3 : 1}>
                <Circle
                  cx={cx}
                  cy={cy}
                  r={layout.r}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={s.isPending ? 2.5 : 1.5}
                  strokeDasharray={s.isPending ? '3 2' : undefined}
                />
                <SvgText
                  x={cx}
                  y={cy + layout.r * 0.36}
                  fontSize={label.length > 1 ? layout.r * 0.72 : layout.r * 1.0}
                  fontWeight="700"
                  fontFamily={FONT}
                  fill={solid ? colors.onAccent : colors.text}
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              </G>
            );
          })}
          <SvgText x={2} y={12} fontSize={11} fill={colors.muted} fontFamily={FONT}>
            {t('tree.dot')}
          </SvgText>
          <SvgText x={width - 2} y={12} fontSize={11} fill={colors.muted} textAnchor="end" fontFamily={FONT}>
            {t('tree.dash')}
          </SvgText>
        </Svg>
      )}
    </View>
  );
}

export const MorseTree = memo(MorseTreeImpl);
