import { Picker } from '@react-native-picker/picker';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export interface PickerOption<T extends string | number> { label: string; value: T; }
interface LabeledPickerProps<T extends string | number> { label: string; value: T; options: PickerOption<T>[]; onChange: (value: T) => void; helperText?: string; }

export function LabeledPicker<T extends string | number>({ label, value, options, onChange, helperText }: LabeledPickerProps<T>) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerShell}>
        <Picker selectedValue={value} onValueChange={(v) => onChange(v as T)}>
          {options.map((o) => <Picker.Item key={String(o.value)} label={o.label} value={o.value} />)}
        </Picker>
      </View>
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink },
  pickerShell: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface },
  helper: { color: colors.inkMuted, fontSize: 12, lineHeight: 18 }
});
