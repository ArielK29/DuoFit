import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ProgressRing } from '@components/ProgressRing';
import { theme } from '@styles/theme';

interface HeroStatCardProps {
  value: string;
  suffix?: string; // "/3" goal or a unit like "שע'"
  label: string;
  subtext?: string;
  subtextColor?: string;
  progress: number;
  color: string;
  icon: LucideIcon;
  isExample?: boolean;
}

// Large ring card at the top of each Home carousel page, per the FitMatch
// reference. `isExample` marks values that aren't real data yet.
export const HeroStatCard: React.FC<HeroStatCardProps> = ({
  value,
  suffix,
  label,
  subtext,
  subtextColor = theme.colors.magenta,
  progress,
  color,
  icon: Icon,
  isExample,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.value}>
          {value}
          {suffix && <Text style={styles.suffix}>{suffix}</Text>}
        </Text>
        <Text style={styles.label}>{label}</Text>
        {subtext && <Text style={[styles.subtext, { color: subtextColor }]}>{subtext}</Text>}
        {isExample && <Text style={styles.exampleTag}>לדוגמה</Text>}
      </View>
      <ProgressRing
        size={88}
        strokeWidth={10}
        progress={progress}
        color={color}
        trackColor={theme.colors.surfaceHover}
      >
        <Icon color={color} size={28} strokeWidth={2} />
      </ProgressRing>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  textBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 40,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  suffix: {
    fontSize: 18,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.textTertiary,
  },
  label: {
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  subtext: {
    fontSize: 12,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    marginTop: theme.spacing.xs,
    textAlign: 'right',
  },
  exampleTag: {
    fontSize: 10,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
  },
});
