// src/components/QuestionOptionCard.tsx
// v0.6: useColors() + makeStyles(colors) factory pattern. Light + dark mode.
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { QuestionOption } from '../features/assessment/types';
import { useColors, ColorPalette } from '../theme/colors';

interface QuestionOptionCardProps { option: QuestionOption; selected: boolean; onPress: () => void; }

export function QuestionOptionCard({ option, selected, onPress }: QuestionOptionCardProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected ? styles.selected : null, pressed ? styles.pressed : null]}
    >
      <Text style={[styles.text, selected ? styles.selectedText : null]}>{option.label}</Text>
    </Pressable>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    card: { minHeight: 54, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 14, justifyContent: 'center' },
    selected: { borderColor: colors.primary, backgroundColor: colors.info },
    pressed: { opacity: 0.86 },
    text: { fontSize: 16, color: colors.ink, fontWeight: '700' },
    selectedText: { color: colors.primaryDark }
  });
}
