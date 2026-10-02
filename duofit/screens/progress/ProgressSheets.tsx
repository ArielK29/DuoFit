import React, { useState } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { BottomSheet } from '@components/BottomSheet';
import { ValueStepper } from '@components/ValueStepper';
import { MAX_WEEKLY_GOAL, MIN_WEEKLY_GOAL } from '@hooks/useProgressStore';
import { theme } from '@styles/theme';

const MIN_KG = 30;
const MAX_KG = 250;

const SaveButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <Pressable style={styles.save} onPress={onPress} accessibilityRole="button">
    <Text style={styles.saveText}>שמור</Text>
  </Pressable>
);

interface WeightSheetProps {
  visible: boolean;
  currentKg: number;
  goalKg: number;
  onSave: (kg: number, goalKg: number) => void;
  onClose: () => void;
}

export const WeightSheet: React.FC<WeightSheetProps> = ({ visible, currentKg, goalKg, onSave, onClose }) => (
  <BottomSheet visible={visible} title="רישום משקל" onClose={onClose}>
    <WeightForm currentKg={currentKg} goalKg={goalKg} onSave={onSave} onClose={onClose} />
  </BottomSheet>
);

const WeightForm: React.FC<Omit<WeightSheetProps, 'visible'>> = ({ currentKg, goalKg, onSave, onClose }) => {
  const [kg, setKg] = useState(Math.round(currentKg * 10) / 10);
  const [goal, setGoal] = useState(Math.round(goalKg * 10) / 10);

  return (
    <>
      <ValueStepper label="המשקל שלך היום" value={kg} unit='ק"ג' min={MIN_KG} max={MAX_KG} step={0.1} decimals={1} onChange={setKg} />
      <ValueStepper label="יעד משקל" value={goal} unit='ק"ג' min={MIN_KG} max={MAX_KG} step={0.5} decimals={1} onChange={setGoal} />
      <SaveButton
        onPress={() => {
          onSave(kg, goal);
          onClose();
        }}
      />
    </>
  );
};

interface GoalSheetProps {
  visible: boolean;
  goal: number;
  onSave: (goal: number) => void;
  onClose: () => void;
}

export const GoalSheet: React.FC<GoalSheetProps> = ({ visible, goal, onSave, onClose }) => (
  <BottomSheet visible={visible} title="יעד אימונים שבועי" onClose={onClose}>
    <GoalForm goal={goal} onSave={onSave} onClose={onClose} />
  </BottomSheet>
);

const GoalForm: React.FC<Omit<GoalSheetProps, 'visible'>> = ({ goal, onSave, onClose }) => {
  const [value, setValue] = useState(goal);

  return (
    <>
      <ValueStepper
        label="כמה אימונים בשבוע?"
        value={value}
        unit="אימונים"
        min={MIN_WEEKLY_GOAL}
        max={MAX_WEEKLY_GOAL}
        step={1}
        onChange={setValue}
      />
      <SaveButton
        onPress={() => {
          onSave(value);
          onClose();
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  save: {
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.magenta,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.sm,
  },
  saveText: {
    fontSize: 17,
    fontFamily: theme.typography.button.fontFamily,
    color: theme.colors.black,
  },
});
