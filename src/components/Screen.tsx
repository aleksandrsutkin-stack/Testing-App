import { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface ScreenProps { children: ReactNode; scroll?: boolean; contentStyle?: ViewStyle; }

export function Screen({ children, scroll = true, contentStyle }: ScreenProps) {
  if (!scroll) return <SafeAreaView style={[styles.safe, contentStyle]}>{children}</SafeAreaView>;
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, contentStyle]}>{children}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 }
});
