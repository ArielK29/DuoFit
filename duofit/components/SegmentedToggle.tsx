import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '@styles/theme';

interface SegmentedToggleProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

// Pill-shaped segmented control, per the FitMatch reference (שותפים/מקומות,
// and the gender picker in the filter sheet).
export function SegmentedToggle<T extends string>({ options, value, onChange }: SegmentedToggleProps<T>) {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    padding: 4,
  },
  segment: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
  },
  segmentActive: {
    backgroundColor: theme.colors.surfaceHover,
  },
  label: {
    fontSize: 15,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
  },
  labelActive: {
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
  },
});
