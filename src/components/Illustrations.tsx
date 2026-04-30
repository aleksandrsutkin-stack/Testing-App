// src/components/Illustrations.tsx
//
// v0.6 — NEW illustration system.
//
// Components:
//   <Mascot expression="idle|thinking|happy|celebrating" mood="primary|success|warm" size?  />
//   <Decoration variant="dots|blobs|stars" />
//   <EmptyState text="..."  />
//   <AchievementBadge label="..." />
//
// Design choices:
//   - "Liftie" is a simple, friendly, non-anthropomorphic mascot (a stylised
//     upward-pointing chevron-on-circle). No face = no gender/ethnicity
//     read, age-appropriate everywhere, and works at any size.
//   - All illustrations are pure SVG so they scale crisply and don't need
//     image assets.
//   - Colors are read from the active palette via useColors() so they
//     adapt to dark mode automatically.

import { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useColors, ColorPalette } from '../theme/colors';

// ─── Mascot — "Liftie" ───────────────────────────────────────────────────────

export type MascotExpression = 'idle' | 'thinking' | 'happy' | 'celebrating';
export type MascotMood = 'primary' | 'success' | 'warm';

interface MascotProps {
  expression?: MascotExpression;
  mood?: MascotMood;
  size?: number;
  style?: ViewStyle;
}

function moodColor(mood: MascotMood, colors: ColorPalette): { bg: string; chevron: string; halo: string } {
  switch (mood) {
    case 'success': return { bg: colors.success, chevron: '#FFFFFF', halo: 'rgba(74,222,128,0.25)' };
    case 'warm':    return { bg: colors.accent,  chevron: '#FFFFFF', halo: 'rgba(255,180,67,0.25)' };
    case 'primary':
    default:        return { bg: colors.primary, chevron: '#FFFFFF', halo: 'rgba(124,143,255,0.25)' };
  }
}

export function Mascot({ expression = 'idle', mood = 'primary', size = 96, style }: MascotProps) {
  const colors = useColors();
  const { bg, chevron, halo } = moodColor(mood, colors);

  // Eye configuration per expression. Coordinates are inside the 100x100 viewBox.
  // The chevron lives in the upper third; the eyes sit in the lower third.
  const eyes = (() => {
    switch (expression) {
      case 'thinking':    return { lx: 38, ly: 64, rx: 62, ry: 64, ear: 'circle', mouthY: 76 };
      case 'happy':       return { lx: 38, ly: 62, rx: 62, ry: 62, ear: 'arc',    mouthY: 75 };
      case 'celebrating': return { lx: 38, ly: 60, rx: 62, ry: 60, ear: 'star',   mouthY: 72 };
      case 'idle':
      default:            return { lx: 38, ly: 64, rx: 62, ry: 64, ear: 'circle', mouthY: 78 };
    }
  })();

  // Mouth path
  const mouthPath = (() => {
    switch (expression) {
      case 'thinking':    return `M 42 ${eyes.mouthY} Q 50 ${eyes.mouthY - 1} 58 ${eyes.mouthY}`;        // small flat
      case 'happy':       return `M 40 ${eyes.mouthY} Q 50 ${eyes.mouthY + 6} 60 ${eyes.mouthY}`;        // smile
      case 'celebrating': return `M 38 ${eyes.mouthY} Q 50 ${eyes.mouthY + 9} 62 ${eyes.mouthY}`;        // big smile
      case 'idle':
      default:            return `M 42 ${eyes.mouthY} Q 50 ${eyes.mouthY + 3} 58 ${eyes.mouthY}`;        // soft smile
    }
  })();

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Halo */}
        <Circle cx={50} cy={50} r={48} fill={halo} />
        {/* Body */}
        <Circle cx={50} cy={50} r={38} fill={bg} />
        {/* Upward chevron in upper-half — the "lift" symbol */}
        <Path
          d="M 36 42 L 50 28 L 64 42"
          stroke={chevron}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Eyes */}
        <Circle cx={eyes.lx} cy={eyes.ly} r={3.2} fill={chevron} />
        <Circle cx={eyes.rx} cy={eyes.ry} r={3.2} fill={chevron} />
        {/* Mouth */}
        <Path d={mouthPath} stroke={chevron} strokeWidth={2.5} strokeLinecap="round" fill="none" />
        {/* Celebrating: confetti dots */}
        {expression === 'celebrating' ? (
          <G>
            <Circle cx={14} cy={20} r={2.5} fill={colors.accent} />
            <Circle cx={86} cy={22} r={2.2} fill={colors.success} />
            <Circle cx={22} cy={86} r={2.0} fill={colors.primary} />
            <Circle cx={82} cy={84} r={2.4} fill={colors.warning} />
          </G>
        ) : null}
        {/* Thinking: small dot above */}
        {expression === 'thinking' ? <Circle cx={78} cy={18} r={2.5} fill={chevron} /> : null}
      </Svg>
    </View>
  );
}

// ─── Decoration ──────────────────────────────────────────────────────────────

interface DecorationProps {
  variant?: 'blobs' | 'dots' | 'stars';
  height?: number;
  style?: ViewStyle;
}

export function Decoration({ variant = 'blobs', height = 80, style }: DecorationProps) {
  const colors = useColors();

  const content = useMemo(() => {
    if (variant === 'dots') {
      return (
        <Svg width="100%" height={height} viewBox="0 0 320 80">
          {Array.from({ length: 14 }).map((_, i) => {
            const cx = 16 + i * 22;
            const cy = (i % 2 === 0 ? 24 : 56);
            const r = (i % 3 === 0 ? 5 : 3.5);
            const fill = (i % 4 === 0 ? colors.primary : i % 4 === 1 ? colors.accent : i % 4 === 2 ? colors.success : colors.primaryDark);
            return <Circle key={i} cx={cx} cy={cy} r={r} fill={fill} opacity={0.7} />;
          })}
        </Svg>
      );
    }
    if (variant === 'stars') {
      return (
        <Svg width="100%" height={height} viewBox="0 0 320 80">
          {[40, 110, 180, 250].map((cx, i) => (
            <Path
              key={i}
              d={`M ${cx} 18 L ${cx + 5} 36 L ${cx + 22} 36 L ${cx + 8} 47 L ${cx + 13} 64 L ${cx} 54 L ${cx - 13} 64 L ${cx - 8} 47 L ${cx - 22} 36 L ${cx - 5} 36 Z`}
              fill={i % 2 === 0 ? colors.accent : colors.primary}
              opacity={0.7}
            />
          ))}
        </Svg>
      );
    }
    // blobs (default)
    return (
      <Svg width="100%" height={height} viewBox="0 0 320 80">
        <Defs>
          <LinearGradient id="blobGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity={0.35} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0.20} />
          </LinearGradient>
        </Defs>
        <Circle cx={50}  cy={28} r={30} fill="url(#blobGrad)" />
        <Circle cx={130} cy={56} r={22} fill={colors.success} opacity={0.20} />
        <Circle cx={210} cy={26} r={26} fill={colors.primary} opacity={0.18} />
        <Circle cx={278} cy={56} r={18} fill={colors.accent} opacity={0.30} />
      </Svg>
    );
  }, [variant, height, colors]);

  return <View style={[{ width: '100%', height }, style]}>{content}</View>;
}

// ─── EmptyState ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  text: string;
  subtitle?: string;
  mascotExpression?: MascotExpression;
  mascotMood?: MascotMood;
  style?: ViewStyle;
}

export function EmptyState({ text, subtitle, mascotExpression = 'idle', mascotMood = 'primary', style }: EmptyStateProps) {
  const colors = useColors();
  const styles = useMemo(() => makeEmptyStyles(colors), [colors]);
  return (
    <View style={[styles.wrap, style]}>
      <Mascot expression={mascotExpression} mood={mascotMood} size={72} />
      <Text style={styles.text}>{text}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function makeEmptyStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: { alignItems: 'center', gap: 10, paddingVertical: 20 },
    text: { color: colors.ink, fontSize: 15, fontWeight: '600', textAlign: 'center' },
    subtitle: { color: colors.inkMuted, fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 260 }
  });
}

// ─── AchievementBadge ────────────────────────────────────────────────────────

interface AchievementBadgeProps {
  label: string;
  caption?: string;
  size?: number;
  mood?: MascotMood;
  style?: ViewStyle;
  children?: ReactNode;
}

export function AchievementBadge({ label, caption, size = 92, mood = 'success', style }: AchievementBadgeProps) {
  const colors = useColors();
  const { bg } = moodColor(mood, colors);
  const styles = useMemo(() => makeBadgeStyles(colors), [colors]);
  return (
    <View style={[styles.wrap, style]}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="badgeGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={bg} stopOpacity={1} />
              <Stop offset="1" stopColor={colors.primaryDark} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Circle cx={50} cy={50} r={46} fill="url(#badgeGrad)" />
          <Circle cx={50} cy={50} r={36} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.5} />
          <Path
            d="M 35 50 L 46 60 L 65 40"
            stroke="#FFFFFF" strokeWidth={5}
            strokeLinecap="round" strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>
      <Text style={styles.label}>{label}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

function makeBadgeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: { alignItems: 'center', gap: 6 },
    label: { color: colors.ink, fontSize: 14, fontWeight: '700', textAlign: 'center' },
    caption: { color: colors.inkMuted, fontSize: 12, textAlign: 'center', maxWidth: 200 }
  });
}
