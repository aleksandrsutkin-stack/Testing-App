// src/components/AppButton.tsx
// v0.6: useColors() + makeStyles(colors) factory pattern. Light + dark mode.
import { ReactNode, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useColors, ColorPalette } from '../theme/colors';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  style?: ViewStyle;
}

export function AppButton({ title, onPress, variant = 'primary', disabled = false, loading = false, leftIcon, style }: AppButtonProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isInactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive }}
      onPress={onPress}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isInactive ? styles.pressed : null,
        isInactive ? styles.disabled : null,
        style
      ]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : colors.primary} />
        : leftIcon}
      <Text style={[
        styles.text,
        variant !== 'primary' && styles.textSecondary,
        variant === 'danger' && styles.textDanger
      ]}>{title}</Text>
    </Pressable>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    base: { minHeight: 52, borderRadius: 18, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.danger },
    pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
    disabled: { opacity: 0.5 },
    text: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
    textSecondary: { color: colors.ink },
    textDanger: { color: colors.danger }
  });
}
