// src/components/LabeledPicker.tsx
// v0.6: useColors() + makeStyles(colors) factory pattern. Light + dark mode.
// Note: react-native Picker's color/dropdownIconColor are platform-styled, but
// we still pass the active ink color so the chevron and items read in dark mode.
import { useMemo } from 'react';
import { Picker } from '@react-native-picker/picker';
import { StyleSheet, Text, View } from 'react-native';
import { useColors, ColorPalette } from '../theme/colors';

export interface PickerOption<T extends string | number> { label: string; value: T; }
interface LabeledPickerProps<T extends string | number> { label: string; value: T; options: PickerOption<T>[]; onChange: (value: T) => void; helperText?: string; }

export function LabeledPicker<T extends string | number>({ label, value, options, onChange, helperText }: LabeledPickerProps<T>) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerShell}>
        <Picker
          selectedValue={value}
          onValueChange={(v) => onChange(v as T)}
          dropdownIconColor={colors.ink}
          style={{ color: colors.ink }}
        >
          {options.map((o) => (
            <Picker.Item key={String(o.value)} label={o.label} value={o.value} color={colors.ink} />
          ))}
        </Picker>
      </View>
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrapper: { gap: 8 },
    label: { fontSize: 14, fontWeight: '600', color: colors.ink },
    pickerShell: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface },
    helper: { color: colors.inkMuted, fontSize: 12, lineHeight: 18 }
  });
}
