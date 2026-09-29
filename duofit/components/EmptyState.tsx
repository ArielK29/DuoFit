import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@components/Button';
import { theme } from '@styles/theme';

interface EmptyStateProps {
  icon: React.ReactNode;
  headline: string;
  subheading: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

// Generic empty-state layout per 03-EDGE-CASES.md (icon, headline, subheading,
// optional CTA) — reusable across Discover, Chat, and other empty-data screens.
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  headline,
  subheading,
  ctaLabel,
  onCtaPress,
}) => {
  return (
    <View style={styles.container}>
      {icon}
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.subheading}>{subheading}</Text>
      {ctaLabel && onCtaPress && (
        <View style={styles.ctaWrapper}>
          <Button label={ctaLabel} variant="primary" onPress={onCtaPress} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  headline: {
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  subheading: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  ctaWrapper: {
    marginTop: theme.spacing.xl,
    alignSelf: 'stretch',
  },
});
