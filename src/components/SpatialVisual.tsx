// src/components/SpatialVisual.tsx
//
// v0.6: theme-aware. Strokes/fills now adapt to dark mode; the wrapping
// container uses surfaceMuted/border from the active palette.
//
// Renders a small SVG illustration alongside a question prompt for spatial
// reasoning items. Without these, "imagine a cube" doesn't actually test
// spatial reasoning — it tests reading comprehension of spatial language.
//
// Visual types are referenced by template ID via the `visualType` field on
// AssessmentQuestion. Each type has its own renderer below.

import { useMemo } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import Svg, { Rect, Path, Polygon, Line, Circle, Text as SvgText, G } from 'react-native-svg';
import { useColors, ColorPalette } from '../theme/colors';

interface SpatialVisualProps {
  visualType: string;
  params?: Record<string, string | number>;
}

interface VisualColors {
  stroke: string;
  fillLight: string;
  fillMid: string;
  textDark: string;
  axis: string;
  faded: string;
  star: string;
  starStroke: string;
}

const lightVisual: VisualColors = {
  stroke:      '#4F46E5',
  fillLight:   '#EEF2FF',
  fillMid:     '#A5B4FC',
  textDark:    '#1E1B4B',
  axis:        '#4F46E5',
  faded:       '#9CA3AF',
  star:        '#F59E0B',
  starStroke:  '#B45309',
};

const darkVisual: VisualColors = {
  stroke:      '#A5B4FC',
  fillLight:   '#1F2440',
  fillMid:     '#4F46E5',
  textDark:    '#F1F5FA',
  axis:        '#A5B4FC',
  faded:       '#9AA4BD',
  star:        '#FCD34D',
  starStroke:  '#F59E0B',
};

export function SpatialVisual({ visualType, params = {} }: SpatialVisualProps) {
  const colors = useColors();
  const scheme = useColorScheme();
  const v = scheme === 'dark' ? darkVisual : lightVisual;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const renderer = RENDERERS[visualType];
  if (!renderer) return null;

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height="160" viewBox="0 0 320 160">
        {renderer(params, v)}
      </Svg>
    </View>
  );
}

// ─── Renderers ───────────────────────────────────────────────────────────────

const RENDERERS: Record<string, (params: Record<string, string | number>, v: VisualColors) => React.ReactNode> = {

  // Cube (isometric)
  cube: (_p, v) => (
    <G>
      <Polygon points="100,30 200,30 240,60 140,60" fill={v.fillLight} stroke={v.stroke} strokeWidth={1.5} />
      <Polygon points="200,30 240,60 240,130 200,100" fill={v.fillMid} stroke={v.stroke} strokeWidth={1.5} />
      <Polygon points="100,30 100,100 200,100 200,30" fill={v.fillLight} stroke={v.stroke} strokeWidth={1.5} />
      <SvgText x="160" y="148" textAnchor="middle" fill={v.textDark} fontSize="11" fontWeight="600">Cube (3D solid)</SvgText>
    </G>
  ),

  // 3×3 grid
  'grid-3': (_p, v) => {
    const startX = 100, startY = 25, cell = 35;
    const cells = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        cells.push(
          <Rect key={`${r}${c}`} x={startX + c * cell} y={startY + r * cell} width={cell} height={cell}
            fill={v.fillLight} stroke={v.stroke} strokeWidth={1.2} />
        );
      }
    }
    return (
      <G>
        {cells}
        <SvgText x="160" y="148" textAnchor="middle" fill={v.textDark} fontSize="11" fontWeight="600">3 × 3 grid</SvgText>
      </G>
    );
  },

  // 4×4 grid
  'grid-4': (_p, v) => {
    const startX = 96, startY = 18, cell = 32;
    const cells = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        cells.push(
          <Rect key={`${r}${c}`} x={startX + c * cell} y={startY + r * cell} width={cell} height={cell}
            fill={v.fillLight} stroke={v.stroke} strokeWidth={1.2} />
        );
      }
    }
    return (
      <G>
        {cells}
        <SvgText x="160" y="158" textAnchor="middle" fill={v.textDark} fontSize="11" fontWeight="600">4 × 4 grid</SvgText>
      </G>
    );
  },

  // Mirror reflection
  'mirror-letter': (params, v) => {
    const letter = String(params.letter ?? 'b');
    const axis = String(params.axis ?? 'horizontal');
    const isVerticalAxis = axis === 'horizontal';
    return (
      <G>
        <Rect x="60" y="35" width="80" height="80" rx="8" fill={v.fillLight} stroke={v.stroke} strokeWidth={1.5} />
        <SvgText x="100" y="92" textAnchor="middle" fill={v.textDark} fontSize="48" fontWeight="700">{letter}</SvgText>
        <SvgText x="100" y="135" textAnchor="middle" fill={v.textDark} fontSize="11" fontWeight="600">Original</SvgText>
        <Line x1="160" y1={isVerticalAxis ? 25 : 75} x2="160" y2={isVerticalAxis ? 125 : 75}
              stroke={v.axis} strokeWidth={1} strokeDasharray="4 4" />
        {!isVerticalAxis ? (
          <Line x1="40" y1="75" x2="280" y2="75" stroke={v.axis} strokeWidth={1} strokeDasharray="4 4" />
        ) : null}
        <Rect x="180" y="35" width="80" height="80" rx="8" fill={v.fillLight} stroke={v.stroke} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.4} />
        <SvgText x="220" y="80" textAnchor="middle" fill={v.faded} fontSize="14" fontWeight="500">?</SvgText>
        <SvgText x="220" y="135" textAnchor="middle" fill={v.textDark} fontSize="11" fontWeight="600">Reflection</SvgText>
      </G>
    );
  },

  // Arrow with mirror axis
  'mirror-arrow': (params, v) => {
    const direction = String(params.direction ?? 'right');
    const arrowPath = direction === 'right'
      ? "M 65 75 L 130 75 M 115 60 L 130 75 L 115 90"
      : "M 130 75 L 65 75 M 80 60 L 65 75 L 80 90";
    return (
      <G>
        <Rect x="55" y="35" width="90" height="80" rx="8" fill={v.fillLight} stroke={v.stroke} strokeWidth={1.5} />
        <Path d={arrowPath} stroke={v.textDark} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <SvgText x="100" y="135" textAnchor="middle" fill={v.textDark} fontSize="11" fontWeight="600">Original</SvgText>
        <Line x1="160" y1="25" x2="160" y2="125" stroke={v.axis} strokeWidth={1} strokeDasharray="4 4" />
        <Rect x="175" y="35" width="90" height="80" rx="8" fill={v.fillLight} stroke={v.stroke} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.4} />
        <SvgText x="220" y="80" textAnchor="middle" fill={v.faded} fontSize="14" fontWeight="500">?</SvgText>
        <SvgText x="220" y="135" textAnchor="middle" fill={v.textDark} fontSize="11" fontWeight="600">Reflection</SvgText>
      </G>
    );
  },

  // Basic shape (KG)
  shape: (params, v) => {
    const which = String(params.shape ?? 'circle');
    if (which === 'circle') {
      return (
        <G>
          <Circle cx="160" cy="75" r="42" fill={v.fillLight} stroke={v.stroke} strokeWidth={2} />
          <SvgText x="160" y="143" textAnchor="middle" fill={v.textDark} fontSize="11" fontWeight="600">Circle</SvgText>
        </G>
      );
    }
    if (which === 'square') {
      return (
        <G>
          <Rect x="118" y="33" width="84" height="84" fill={v.fillLight} stroke={v.stroke} strokeWidth={2} />
          <SvgText x="160" y="143" textAnchor="middle" fill={v.textDark} fontSize="11" fontWeight="600">Square</SvgText>
        </G>
      );
    }
    if (which === 'triangle') {
      return (
        <G>
          <Polygon points="160,28 116,118 204,118" fill={v.fillLight} stroke={v.stroke} strokeWidth={2} />
          <SvgText x="160" y="143" textAnchor="middle" fill={v.textDark} fontSize="11" fontWeight="600">Triangle</SvgText>
        </G>
      );
    }
    if (which === 'rectangle') {
      return (
        <G>
          <Rect x="100" y="44" width="120" height="62" fill={v.fillLight} stroke={v.stroke} strokeWidth={2} />
          <SvgText x="160" y="143" textAnchor="middle" fill={v.textDark} fontSize="11" fontWeight="600">Rectangle</SvgText>
        </G>
      );
    }
    return null;
  },

  // Counted stars row
  'count-stars': (params, v) => {
    const n = Math.max(1, Math.min(10, Number(params.count ?? 5)));
    const totalWidth = n * 26;
    const startX = (320 - totalWidth) / 2;
    const stars = [];
    for (let i = 0; i < n; i++) {
      const cx = startX + i * 26 + 13;
      const r = 11;
      const points: string[] = [];
      for (let k = 0; k < 10; k++) {
        const ang = (k * Math.PI) / 5 - Math.PI / 2;
        const rr = k % 2 === 0 ? r : r * 0.45;
        points.push(`${cx + rr * Math.cos(ang)},${75 + rr * Math.sin(ang)}`);
      }
      stars.push(
        <Polygon key={i} points={points.join(' ')} fill={v.star} stroke={v.starStroke} strokeWidth={1} />
      );
    }
    return (
      <G>
        {stars}
        <SvgText x="160" y="135" textAnchor="middle" fill={v.textDark} fontSize="11" fontWeight="600">Count the stars</SvgText>
      </G>
    );
  },
};

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 14,
      paddingVertical: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border
    }
  });
}
