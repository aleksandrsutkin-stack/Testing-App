// src/theme/colors.ts
// v0.6: Full dark-mode support via a runtime hook.
// Components consume colors via useColors() and use the makeStyles(colors)
// factory pattern. The static `colors` export is preserved for backwards
// compatibility (used by the PDF report which is light-mode only).

import { useColorScheme } from 'react-native';

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceMuted: string;
  ink: string;
  inkMuted: string;
  primary: string;
  primaryDark: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  border: string;
  info: string;
}

export const lightColors: ColorPalette = {
  background:   '#F7F4EC',
  surface:      '#FFFFFF',
  surfaceMuted: '#EFEAE0',
  ink:          '#172033',
  inkMuted:     '#657083',
  primary:      '#3E5BFF',
  primaryDark:  '#2138B8',
  accent:       '#FFB443',
  success:      '#2F9E44',
  warning:      '#F08C00',
  danger:       '#D9480F',
  border:       '#E2E7F0',
  info:         '#EAF0FF'
};

export const darkColors: ColorPalette = {
  background:   '#0B1020',
  surface:      '#161B2E',
  surfaceMuted: '#1F2440',
  ink:          '#F1F5FA',
  inkMuted:     '#9AA4BD',
  primary:      '#7C8FFF',
  primaryDark:  '#A5B4FC',
  accent:       '#FFD58A',
  success:      '#4ADE80',
  warning:      '#F59E0B',
  danger:       '#F87171',
  border:       '#2A3050',
  info:         '#1E2A4D'
};

/**
 * Hook that returns the active color palette based on system color scheme.
 * Use this in components to support light + dark mode automatically.
 */
export function useColors(): ColorPalette {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}

/**
 * Backwards-compat static export. Defaults to light palette. Used by:
 *  - PDF report (always light)
 *  - any legacy file we haven't migrated to useColors() yet
 */
export const colors: ColorPalette = lightColors;
