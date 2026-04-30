import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface CardProps { children: ReactNode; style?: ViewStyle; }

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: 24, padding: 18,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000000', shadowOpacity: 0.06, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 2
  }
});
