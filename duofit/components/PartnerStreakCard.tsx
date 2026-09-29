import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import { Card } from '@components/Card';
import { theme } from '@styles/theme';

interface PartnerStreakCardProps {
  partnerName: string;
  streak: number;
}

// "ביחד ברצף" card, per the FitMatch reference — real per-partner streak,
// computed from actual completed workouts (useWorkoutStore), not fabricated.
export const PartnerStreakCard: React.FC<PartnerStreakCardProps> = ({ partnerName, streak }) => {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Flame color={theme.colors.magenta} size={18} strokeWidth={2} />
        <Text style={styles.streakValue}>{streak}</Text>
      </View>
      <Text style={styles.label}>אתה ו{partnerName}</Text>
      <Text style={styles.hint}>אל תשבור עכשיו</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 150,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  streakValue: {
    fontSize: 20,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  label: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
    textAlign: 'right',
    marginBottom: 2,
  },
  hint: {
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.magenta,
    textAlign: 'right',
  },
});
