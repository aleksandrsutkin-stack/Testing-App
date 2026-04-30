// src/components/Screen.tsx
// v0.6: useColors() + makeStyles(colors) factory pattern. Light + dark mode.
import { ReactNode, useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { useColors, ColorPalette } from '../theme/colors';

interface ScreenProps { children: ReactNode; scroll?: boolean; contentStyle?: ViewStyle; }

export function Screen({ children, scroll = true, contentStyle }: ScreenProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  if (!scroll) return <SafeAreaView style={[styles.safe, contentStyle]}>{children}</SafeAreaView>;
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, contentStyle]}>{children}</ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 48 }
  });
}
