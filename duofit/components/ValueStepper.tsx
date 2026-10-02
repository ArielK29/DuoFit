import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { theme } from '@styles/theme';

interface ValueStepperProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  decimals?: number;
  onChange: (value: number) => void;
}

// Big −/+ stepper (48px targets) for picking a number without a keyboard.
export const ValueStepper: React.FC<ValueStepperProps> = ({ label, value, unit, min, max, step, decimals = 0, onChange }) => {
  const clamp = (next: number) => Math.min(max, Math.max(min, Math.round(next / step) * step));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          style={styles.button}
          onPress={() => onChange(clamp(value + step))}
          disabled={value >= max}
          accessibilityLabel={`הגדל ${label}`}
        >
          <Plus color={theme.colors.text} size={22} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.value}>{`${value.toFixed(decimals)} ${unit}`}</Text>
        <Pressable
          style={styles.button}
          onPress={() => onChange(clamp(value - step))}
          disabled={value <= min}
          accessibilityLabel={`הקטן ${label}`}
        >
          <Minus color={theme.colors.text} size={22} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    width: '100%',
    fontSize: 14,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.xs,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 26,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
});
