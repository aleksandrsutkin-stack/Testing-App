// src/components/SpatialVisual.tsx
//
// Renders a small SVG illustration alongside a question prompt for spatial
// reasoning items. Without these, "imagine a cube" doesn't actually test
// spatial reasoning — it tests reading comprehension of spatial language.
//
// Visual types are referenced by template ID via the `visualType` field on
// AssessmentQuestion. Each type has its own renderer below.

import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Path, Polygon, Line, Circle, Text as SvgText, G } from 'react-native-svg';

interface SpatialVisualProps {
  visualType: string;
  params?: Record<string, string | number>;
}

export function SpatialVisual({ visualType, params = {} }: SpatialVisualProps) {
  const renderer = RENDERERS[visualType];
  if (!renderer) return null;

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height="160" viewBox="0 0 320 160">
        {renderer(params)}
      </Svg>
    </View>
  );
}

const STROKE = '#4F46E5';
const FILL_LIGHT = '#EEF2FF';
const FILL_MID = '#A5B4FC';
const TEXT_DARK = '#1E1B4B';

// ─── Renderers ───────────────────────────────────────────────────────────────

const RENDERERS: Record<string, (params: Record<string, string | number>) => React.ReactNode> = {

  // Cube (isometric) — used by spatial-cube-faces
  cube: () => (
    <G>
      {/* Back faces */}
      <Polygon points="100,30 200,30 240,60 140,60" fill={FILL_LIGHT} stroke={STROKE} strokeWidth={1.5} />
      <Polygon points="200,30 240,60 240,130 200,100" fill={FILL_MID} stroke={STROKE} strokeWidth={1.5} />
      <Polygon points="100,30 100,100 200,100 200,30" fill="#FFFFFF" stroke={STROKE} strokeWidth={1.5} />
      <SvgText x="160" y="148" textAnchor="middle" fill={TEXT_DARK} fontSize="11" fontWeight="600">Cube (3D solid)</SvgText>
    </G>
  ),

  // 3×3 grid — used by spatial-count-shapes
  'grid-3': () => {
    const startX = 100, startY = 25, cell = 35;
    const cells = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        cells.push(
          <Rect key={`${r}${c}`} x={startX + c * cell} y={startY + r * cell} width={cell} height={cell}
            fill={FILL_LIGHT} stroke={STROKE} strokeWidth={1.2} />
        );
      }
    }
    return (
      <G>
        {cells}
        <SvgText x="160" y="148" textAnchor="middle" fill={TEXT_DARK} fontSize="11" fontWeight="600">3 × 3 grid</SvgText>
      </G>
    );
  },

  // 4×4 grid — used by spatial-count-shapes (alt)
  'grid-4': () => {
    const startX = 96, startY = 18, cell = 32;
    const cells = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        cells.push(
          <Rect key={`${r}${c}`} x={startX + c * cell} y={startY + r * cell} width={cell} height={cell}
            fill={FILL_LIGHT} stroke={STROKE} strokeWidth={1.2} />
        );
      }
    }
    return (
      <G>
        {cells}
        <SvgText x="160" y="158" textAnchor="middle" fill={TEXT_DARK} fontSize="11" fontWeight="600">4 × 4 grid</SvgText>
      </G>
    );
  },

  // Mirror reflection: original letter/symbol + mirror axis + dimmed reflection silhouette
  'mirror-letter': (params) => {
    const letter = String(params.letter ?? 'b');
    const axis = String(params.axis ?? 'horizontal'); // 'horizontal' = vertical mirror axis (left-right flip)
    const isVerticalAxis = axis === 'horizontal'; // i.e. mirror axis is the vertical line in the middle
    return (
      <G>
        {/* Original */}
        <Rect x="60" y="35" width="80" height="80" rx="8" fill={FILL_LIGHT} stroke={STROKE} strokeWidth={1.5} />
        <SvgText x="100" y="92" textAnchor="middle" fill={TEXT_DARK} fontSize="48" fontWeight="700">{letter}</SvgText>
        <SvgText x="100" y="135" textAnchor="middle" fill={TEXT_DARK} fontSize="11" fontWeight="600">Original</SvgText>

        {/* Mirror axis */}
        <Line x1="160" y1={isVerticalAxis ? 25 : 75} x2="160" y2={isVerticalAxis ? 125 : 75}
              stroke={STROKE} strokeWidth={1} strokeDasharray="4 4" />
        {!isVerticalAxis ? (
          <Line x1="40" y1="75" x2="280" y2="75" stroke={STROKE} strokeWidth={1} strokeDasharray="4 4" />
        ) : null}

        {/* Reflection placeholder */}
        <Rect x="180" y="35" width="80" height="80" rx="8" fill="#FFFFFF" stroke={STROKE} strokeWidth={1.5} strokeDasharray="3 3" />
        <SvgText x="220" y="80" textAnchor="middle" fill="#9CA3AF" fontSize="14" fontWeight="500">?</SvgText>
        <SvgText x="220" y="135" textAnchor="middle" fill={TEXT_DARK} fontSize="11" fontWeight="600">Reflection</SvgText>
      </G>
    );
  },

  // Arrow with mirror axis — used by spatial-mirror-image (arrow variant)
  'mirror-arrow': (params) => {
    const direction = String(params.direction ?? 'right');
    const arrowPath = direction === 'right'
      ? "M 65 75 L 130 75 M 115 60 L 130 75 L 115 90"
      : "M 130 75 L 65 75 M 80 60 L 65 75 L 80 90";
    return (
      <G>
        <Rect x="55" y="35" width="90" height="80" rx="8" fill={FILL_LIGHT} stroke={STROKE} strokeWidth={1.5} />
        <Path d={arrowPath} stroke={TEXT_DARK} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <SvgText x="100" y="135" textAnchor="middle" fill={TEXT_DARK} fontSize="11" fontWeight="600">Original</SvgText>
        <Line x1="160" y1="25" x2="160" y2="125" stroke={STROKE} strokeWidth={1} strokeDasharray="4 4" />
        <Rect x="175" y="35" width="90" height="80" rx="8" fill="#FFFFFF" stroke={STROKE} strokeWidth={1.5} strokeDasharray="3 3" />
        <SvgText x="220" y="80" textAnchor="middle" fill="#9CA3AF" fontSize="14" fontWeight="500">?</SvgText>
        <SvgText x="220" y="135" textAnchor="middle" fill={TEXT_DARK} fontSize="11" fontWeight="600">Reflection</SvgText>
      </G>
    );
  },

  // Basic shape (KG) — circle / square / triangle / rectangle
  shape: (params) => {
    const which = String(params.shape ?? 'circle');
    if (which === 'circle') {
      return (
        <G>
          <Circle cx="160" cy="75" r="42" fill={FILL_LIGHT} stroke={STROKE} strokeWidth={2} />
          <SvgText x="160" y="143" textAnchor="middle" fill={TEXT_DARK} fontSize="11" fontWeight="600">Circle</SvgText>
        </G>
      );
    }
    if (which === 'square') {
      return (
        <G>
          <Rect x="118" y="33" width="84" height="84" fill={FILL_LIGHT} stroke={STROKE} strokeWidth={2} />
          <SvgText x="160" y="143" textAnchor="middle" fill={TEXT_DARK} fontSize="11" fontWeight="600">Square</SvgText>
        </G>
      );
    }
    if (which === 'triangle') {
      return (
        <G>
          <Polygon points="160,28 116,118 204,118" fill={FILL_LIGHT} stroke={STROKE} strokeWidth={2} />
          <SvgText x="160" y="143" textAnchor="middle" fill={TEXT_DARK} fontSize="11" fontWeight="600">Triangle</SvgText>
        </G>
      );
    }
    if (which === 'rectangle') {
      return (
        <G>
          <Rect x="100" y="44" width="120" height="62" fill={FILL_LIGHT} stroke={STROKE} strokeWidth={2} />
          <SvgText x="160" y="143" textAnchor="middle" fill={TEXT_DARK} fontSize="11" fontWeight="600">Rectangle</SvgText>
        </G>
      );
    }
    return null;
  },

  // Counted stars row — used by KG counting
  'count-stars': (params) => {
    const n = Math.max(1, Math.min(10, Number(params.count ?? 5)));
    const totalWidth = n * 26;
    const startX = (320 - totalWidth) / 2;
    const stars = [];
    for (let i = 0; i < n; i++) {
      const cx = startX + i * 26 + 13;
      // Simple 5-point star path
      const r = 11;
      const points: string[] = [];
      for (let k = 0; k < 10; k++) {
        const ang = (k * Math.PI) / 5 - Math.PI / 2;
        const rr = k % 2 === 0 ? r : r * 0.45;
        points.push(`${cx + rr * Math.cos(ang)},${75 + rr * Math.sin(ang)}`);
      }
      stars.push(
        <Polygon key={i} points={points.join(' ')} fill="#F59E0B" stroke="#B45309" strokeWidth={1} />
      );
    }
    return (
      <G>
        {stars}
        <SvgText x="160" y="135" textAnchor="middle" fill={TEXT_DARK} fontSize="11" fontWeight="600">Count the stars</SvgText>
      </G>
    );
  },
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  }
});
