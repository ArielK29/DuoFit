import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { TERMS_SECTIONS, TERMS_UPDATED } from '@lib/termsText';
import { visualRightText } from '@lib/rtl';
import { theme } from '@styles/theme';

// Terms of service and privacy notice: reachable before sign-in (from the sign-up screen) and after it (from the account sheet).
export const TermsScreen: React.FC = () => {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="חזרה">
          <ArrowLeft color={theme.colors.magenta} size={22} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          תנאי שימוש ופרטיות
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>עודכן לאחרונה: {TERMS_UPDATED}</Text>
        {TERMS_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {section.title}
            </Text>
            {section.body.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  updated: {
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.md,
    ...visualRightText,
  },
  section: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.cyan,
    ...visualRightText,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    ...visualRightText,
  },
});
