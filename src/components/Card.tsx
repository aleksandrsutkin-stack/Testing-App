// src/components/Card.tsx
// v0.6: useColors() + makeStyles(colors) factory pattern. Light + dark mode.
import { ReactNode, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useColors, ColorPalette } from '../theme/colors';

interface CardProps { children: ReactNode; style?: ViewStyle; }

export function Card({ children, style }: CardProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={[styles.card, style]}>{children}</View>;
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface, borderRadius: 24, padding: 18,
      borderWidth: 1, borderColor: colors.border,
      shadowColor: '#000000', shadowOpacity: 0.06, shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 }, elevation: 2
    }
  });
}
