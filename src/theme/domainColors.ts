// src/theme/domainColors.ts
// Single source of truth for domain colors used by both the in-app
// MetricBar and the PDF report. Each domain keeps the same color
// across the app and the export so the user never sees inconsistency.

import { DomainId } from '../features/assessment/types';

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

export function domainColor(domain: string): string {
  return (DOMAIN_COLORS as Record<string, string>)[domain] ?? '#4F46E5';
}

// Score band colors used in both the app and PDF
export const BAND_COLORS = {
  'advanced':       { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7', accent: '#10B981' },
  'ready':          { bg: '#EFF6FF', text: '#1E40AF', border: '#93C5FD', accent: '#3B82F6' },
  'ready-soon':     { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D', accent: '#F59E0B' },
  'developing':     { bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74', accent: '#F97316' },
  'needs-practice': { bg: '#FEF2F2', text: '#991B1B', border: '#FCA5A5', accent: '#EF4444' },
} as const;

export type BandColor = { bg: string; text: string; border: string; accent: string };

export function bandStyle(band: string): BandColor {
  return (BAND_COLORS as Record<string, BandColor>)[band] ?? BAND_COLORS['developing'];
}
