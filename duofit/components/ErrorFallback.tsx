import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { Button } from '@components/Button';
import { theme } from '@styles/theme';

I18nManager.forceRTL(true);

export interface ErrorFallbackProps {
  error: unknown;
  componentStack: string;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ resetError }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>משהו השתבש</Text>
      <Text style={styles.subtitle}>
        קרתה שגיאה לא צפויה. אפשר לנסות שוב, ואם זה ממשיך לקרות נשמח שתדווח לנו.
      </Text>
      <View style={styles.buttonWrapper}>
        <Button label="נסה שוב" variant="primary" size="lg" onPress={resetError} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  title: {
    fontSize: 24,
    color: theme.colors.text,
    fontFamily: theme.typography.h2.fontFamily,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.body.fontFamily,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  buttonWrapper: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
  },
});

export default ErrorFallback;
