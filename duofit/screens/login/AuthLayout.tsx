import React from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Logo } from '@components/Logo';
import { theme } from '@styles/theme';

interface AuthLayoutProps {
  subtitle: string;
  description?: string;
  children: React.ReactNode;
}

// Shared frame for the sign-in / sign-up / forgot-password screens.
export const AuthLayout: React.FC<AuthLayoutProps> = ({ subtitle, description, children }) => (
  <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Logo size={180} />
        <Text style={styles.subtitle}>{subtitle}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      {children}
    </ScrollView>
  </KeyboardAvoidingView>
);

export const authStyles = StyleSheet.create({
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
  },
  linkRow: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  linkText: {
    color: theme.colors.cyan,
    fontSize: 15,
    fontFamily: theme.typography.label.fontFamily,
  },
  muted: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    fontFamily: theme.typography.label.fontFamily,
  },
  successTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontFamily: theme.typography.h2.fontFamily,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  successText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: theme.typography.body.fontFamily,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  buttons: {
    gap: theme.spacing.sm,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
