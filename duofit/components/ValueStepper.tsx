import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { HOLD_START_DELAY_MS, nextRepeatDelay, steppedValue } from '@lib/holdRepeat';
import { theme } from '@styles/theme';
import { visualRightText } from '@lib/rtl';

interface ValueStepperProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  decimals?: number;
  // Extra buttons that jump by these amounts (for example 0.1, 0.5, 1, 5), shown under the stepper as − and + rows.
  quickSteps?: number[];
  onChange: (value: number) => void;
}

// Big −/+ stepper (48px targets) for picking a number without a keyboard. A tap is one step; press and hold repeats by itself
// (faster the longer the finger stays) and stops the moment the finger lifts, so a few taps can still land on the exact number.
export const ValueStepper: React.FC<ValueStepperProps> = ({ label, value, unit, min, max, step, decimals = 0, quickSteps, onChange }) => {
  // The timer reads the latest value and callback through refs, because the screen re-renders while the finger is down.
  const latest = useRef({ value, onChange });
  useEffect(() => {
    latest.current = { value, onChange };
  }, [value, onChange]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => stop, [stop]);

  const apply = useCallback(
    (direction: 1 | -1) => {
      const next = steppedValue(latest.current.value, step, direction, min, max);
      if (next === latest.current.value) return false;
      // Update the ref at once too: the next repeat can fire before the new render arrives.
      latest.current = { ...latest.current, value: next };
      latest.current.onChange(next);
      return true;
    },
    [step, min, max]
  );

  const start = useCallback(
    (direction: 1 | -1) => {
      stop();
      apply(direction);
      const startedAt = Date.now();
      const tick = () => {
        if (!apply(direction)) {
          stop();
          return;
        }
        timer.current = setTimeout(tick, nextRepeatDelay(Date.now() - startedAt));
      };
      timer.current = setTimeout(tick, HOLD_START_DELAY_MS);
    },
    [apply, stop]
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          style={styles.button}
          onPressIn={() => start(1)}
          onPressOut={stop}
          disabled={value >= max}
          accessibilityRole="button"
          accessibilityLabel={`הגדל ${label}`}
          accessibilityHint="לחיצה ארוכה מעלה בהדרגה"
        >
          <Plus color={theme.colors.text} size={22} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.value}>{`${value.toFixed(decimals)} ${unit}`}</Text>
        <Pressable
          style={styles.button}
          onPressIn={() => start(-1)}
          onPressOut={stop}
          disabled={value <= min}
          accessibilityRole="button"
          accessibilityLabel={`הקטן ${label}`}
          accessibilityHint="לחיצה ארוכה מורידה בהדרגה"
        >
          <Minus color={theme.colors.text} size={22} strokeWidth={2.5} />
        </Pressable>
      </View>
      {quickSteps && quickSteps.length > 0 && (
        <>
          {([1, -1] as const).map((direction) => (
            <View key={direction} style={styles.quickRow}>
              {quickSteps.map((amount) => {
                const text = `${direction === 1 ? '+' : '−'}${amount}`;
                const blocked = direction === 1 ? value >= max : value <= min;
                return (
                  <Pressable
                    key={amount}
                    style={[styles.quickChip, blocked && styles.quickChipOff]}
                    onPress={() => {
                      stop();
                      onChange(steppedValue(latest.current.value, amount, direction, min, max));
                    }}
                    disabled={blocked}
                    accessibilityRole="button"
                    accessibilityLabel={`${direction === 1 ? 'הוסף' : 'הורד'} ${amount} ${unit}`}
                  >
                    <Text style={styles.quickChipText}>{text}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </>
      )}
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
    lineHeight: 22,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
    ...visualRightText,
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
  quickRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  quickChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickChipOff: {
    opacity: 0.4,
  },
  quickChipText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
  },
  value: {
    fontSize: 26,
    lineHeight: 36,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
});
