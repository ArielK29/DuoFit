import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { HeartPulse } from 'lucide-react-native';
import { Button } from '@components/Button';
import { visualRightText } from '@lib/rtl';
import { healthPermissionHint, healthSourceName } from '@lib/healthSource';
import { theme } from '@styles/theme';

interface HealthConnectCardProps {
  loading: boolean;
  failed: boolean;
  onConnect: () => void;
}

// Invitation to connect Apple Health (iPhone) or Health Connect (Android); the screens decide when to show it.
export const HealthConnectCard: React.FC<HealthConnectCardProps> = ({ loading, failed, onConnect }) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <View style={styles.iconTile}>
        <HeartPulse color={theme.colors.magenta} size={24} strokeWidth={2} />
      </View>
      <Text style={styles.title}>{`חבר את ${healthSourceName(Platform.OS)}`}</Text>
    </View>
    <Text style={styles.body}>
      כדי לראות כאן צעדים, קלוריות וריצות אמיתיים במקום מספרים לדוגמה. המידע נקרא רק בטלפון שלך ולא נשלח לשרת של FitFriend.
    </Text>
    {failed && (
      <Text style={styles.error}>
        {`לא הצלחנו לקרוא מ-${healthSourceName(Platform.OS)}. ${healthPermissionHint(Platform.OS)}`}
      </Text>
    )}
    <Button label={failed ? 'נסה שוב' : 'חבר'} variant="primary" loading={loading} onPress={onConnect} />
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
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,0,168,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    ...visualRightText,
  },
  error: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.magenta,
    ...visualRightText,
  },
});
