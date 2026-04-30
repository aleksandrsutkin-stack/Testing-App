import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface MetricBarProps {
  label: string;
  percent: number;
  caption?: string;
  color?: string;
}

export function MetricBar({ label, percent, caption, color }: MetricBarProps) {
  const safe = Math.max(0, Math.min(percent, 100));
  const fillColor = color ?? colors.primary;

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <View style={styles.labelRow}>
          {color ? <View style={[styles.dot, { backgroundColor: fillColor }]} /> : null}
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={[styles.value, { color: fillColor }]}>{Math.round(safe)}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${safe}%`, backgroundColor: fillColor }]} />
      </View>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  label: { color: colors.ink, fontWeight: '600', flex: 1, fontSize: 14 },
  value: { fontWeight: '700', fontSize: 14 },
  track: { height: 9, backgroundColor: colors.surfaceMuted, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  caption: { color: colors.inkMuted, fontSize: 12, lineHeight: 17 }
});
