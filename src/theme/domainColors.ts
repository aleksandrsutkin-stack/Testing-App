// src/theme/domainColors.ts
// v0.6: Domain colors and 5-band score colors with full light + dark variants.
// Components use the hooks (useDomainColor, useBandStyle); the PDF stays light-mode
// only and uses the static `domainColor` / `bandStyle` helpers.

import { useColorScheme } from 'react-native';
import { DomainId, ScoreBand } from '../features/assessment/types';

// ─── Domain colors ───────────────────────────────────────────────────────────
//
// Each domain has a matched light + dark token. The dark tokens are the same
// hue, brightened so they read clearly against the dark background.

export const DOMAIN_COLORS: Record<DomainId, string> = {
  'fluid-reasoning':       '#4F46E5',
  'visual-spatial':        '#7C3AED',
  'verbal':                '#2563EB',
  'quantitative':          '#0891B2',
  'working-memory':        '#0D9488',
  'processing-speed':      '#059669',
  'number-sense':          '#2563EB',
  'fractions-ratios':      '#7C3AED',
  'algebra-readiness':     '#9333EA',
  'geometry':              '#0891B2',
  'data-reasoning':        '#0D9488',
  'vocabulary':            '#D97706',
  'reading-comprehension': '#B45309',
  'science-reasoning':     '#16A34A',
  'mechanical-reasoning':  '#15803D',
  'coding-logic':          '#0369A1',
  'school-readiness':      '#C026D3',
  'executive-function':    '#DB2777',
};

export const DOMAIN_COLORS_DARK: Record<DomainId, string> = {
  'fluid-reasoning':       '#A5B4FC',
  'visual-spatial':        '#C4B5FD',
  'verbal':                '#93C5FD',
  'quantitative':          '#67E8F9',
  'working-memory':        '#5EEAD4',
  'processing-speed':      '#6EE7B7',
  'number-sense':          '#93C5FD',
  'fractions-ratios':      '#C4B5FD',
  'algebra-readiness':     '#D8B4FE',
  'geometry':              '#67E8F9',
  'data-reasoning':        '#5EEAD4',
  'vocabulary':            '#FCD34D',
  'reading-comprehension': '#FDBA74',
  'science-reasoning':     '#86EFAC',
  'mechanical-reasoning':  '#4ADE80',
  'coding-logic':          '#7DD3FC',
  'school-readiness':      '#F0ABFC',
  'executive-function':    '#F9A8D4',
};

/** Static, light-mode lookup. Used by the PDF report. */
export function domainColor(domain: string): string {
  return (DOMAIN_COLORS as Record<string, string>)[domain] ?? '#4F46E5';
}

/** Hook that returns a domain color for the active scheme. */
export function useDomainColor() {
  const scheme = useColorScheme();
  const map = scheme === 'dark' ? DOMAIN_COLORS_DARK : DOMAIN_COLORS;
  return (domain: string): string => (map as Record<string, string>)[domain] ?? (scheme === 'dark' ? '#A5B4FC' : '#4F46E5');
}

// ─── Score band colors (v0.6 — 5 bands, parent-friendly) ─────────────────────

export interface BandStyle { bg: string; text: string; border: string; accent: string; }

const BAND_LIGHT: Record<ScoreBand, BandStyle> = {
  'well-above':  { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7', accent: '#10B981' },
  'above':       { bg: '#EFF6FF', text: '#1E40AF', border: '#93C5FD', accent: '#3B82F6' },
  'on-grade':    { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D', accent: '#F59E0B' },
  'approaching': { bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74', accent: '#F97316' },
  'below':       { bg: '#FEF2F2', text: '#991B1B', border: '#FCA5A5', accent: '#EF4444' },
};

const BAND_DARK: Record<ScoreBand, BandStyle> = {
  'well-above':  { bg: '#052E22', text: '#6EE7B7', border: '#10B981', accent: '#34D399' },
  'above':       { bg: '#0B2148', text: '#93C5FD', border: '#3B82F6', accent: '#60A5FA' },
  'on-grade':    { bg: '#3B2E08', text: '#FCD34D', border: '#F59E0B', accent: '#FBBF24' },
  'approaching': { bg: '#3B1F0A', text: '#FDBA74', border: '#F97316', accent: '#FB923C' },
  'below':       { bg: '#3B0E0E', text: '#FCA5A5', border: '#EF4444', accent: '#F87171' },
};

/** Static, light-mode lookup. Used by the PDF report. */
export const BAND_COLORS = BAND_LIGHT;
export function bandStyle(band: string): BandStyle {
  return BAND_LIGHT[band as ScoreBand] ?? BAND_LIGHT['on-grade'];
}

/** Hook that returns a band-style lookup for the active scheme. */
export function useBandStyle() {
  const scheme = useColorScheme();
  const map = scheme === 'dark' ? BAND_DARK : BAND_LIGHT;
  return (band: string): BandStyle => map[band as ScoreBand] ?? map['on-grade'];
}
