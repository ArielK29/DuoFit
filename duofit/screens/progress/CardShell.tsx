import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@styles/theme';

interface CardShellProps {
  title: string;
  chip?: React.ReactNode;
  isExample?: boolean;
  children: React.ReactNode;
}

// Card frame used by the Progress charts: title on the right, a pill (goal,
// average, month total) on the left.
export const CardShell: React.FC<CardShellProps> = ({ title, chip, isExample, children }) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <View style={styles.titleGroup}>
        <Text style={styles.title}>{title}</Text>
        {isExample && (
          <View style={styles.exampleTag}>
            <Text style={styles.exampleTagText}>לדוגמה</Text>
          </View>
        )}
      </View>
      {chip}
    </View>
    {children}
  </View>
);

export const Banner: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.banner}>
    <Text style={styles.bannerText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.xl * 1.5,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: 22,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
  },
  exampleTag: {
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.sm,
  },
  exampleTagText: {
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
  },
  banner: {
    backgroundColor: 'rgba(0,229,255,0.12)',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  bannerText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.cyan,
    textAlign: 'center',
  },
});

export const pillStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minHeight: 40,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
  },
  pillText: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
  },
  pillMuted: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
  },
});
