import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface ProgressBarProps { current: number; total: number; }

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = total > 0 ? Math.min(current / total, 1) : 0;
  return (
    <View style={styles.wrapper}>
      <View style={styles.track}><View style={[styles.fill, { width: `${percent * 100}%` }]} /></View>
      <Text style={styles.label}>{current} of {total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  track: { height: 10, borderRadius: 999, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 999 },
  label: { color: colors.inkMuted, fontSize: 12, fontWeight: '700', textAlign: 'right' }
});
