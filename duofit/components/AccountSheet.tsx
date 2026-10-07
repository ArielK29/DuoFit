import React from 'react';
import { View, Text, Alert, Platform, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { BottomSheet } from '@components/BottomSheet';
import { Button } from '@components/Button';
import { useAccountSheet } from '@hooks/useAccountSheet';
import { useAuth } from '@hooks/useAuth';
import { visualRightText } from '@lib/rtl';
import { theme } from '@styles/theme';

// "My account": who is signed in, and the real sign-out.
export const AccountSheet: React.FC = () => {
  const visible = useAccountSheet((state) => state.visible);
  const close = useAccountSheet((state) => state.close);
  const user = useAuth((state) => state.user);
  const signOut = useAuth((state) => state.signOut);
  const deleteAccount = useAuth((state) => state.deleteAccount);
  const isLoading = useAuth((state) => state.isLoading);
  const error = useAuth((state) => state.error);

  const handleSignOut = async () => {
    close();
    await signOut();
  };

  const runDelete = async () => {
    const deleted = await deleteAccount();
    if (deleted) close();
  };

  // Two steps on purpose: deleting is permanent.
  const confirmDelete = () => {
    const title = 'למחוק את החשבון?';
    const message =
      'המחיקה סופית ואי אפשר לשחזר אותה. יימחקו הפרופיל, התמונה, ההתקדמות וכל השיחות שלך, גם אצל השותפים.';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) runDelete();
      return;
    }
    Alert.alert(title, message, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק לצמיתות', style: 'destructive', onPress: runDelete },
    ]);
  };

  return (
    <BottomSheet visible={visible} title="החשבון שלי" onClose={close}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <Text style={styles.avatarInitial}>{user?.name?.[0] ?? '?'}</Text>
          )}
        </View>
        <View style={styles.text}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>
      <Text style={styles.note}>הנתונים שלך שמורים בחשבון הזה. כשתתנתק, הנתונים המקומיים במכשיר יימחקו.</Text>
      <Button label="התנתק" variant="secondary" size="lg" onPress={handleSignOut} />
      <View style={styles.deleteWrap}>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Button label="מחק את החשבון שלי" variant="danger" size="lg" loading={isLoading} disabled={isLoading} onPress={confirmDelete} />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  deleteWrap: {
    marginTop: theme.spacing.xl,
  },
  error: {
    color: theme.colors.error,
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 26,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
  },
  text: {
    flex: 1,
    alignItems: 'flex-end',
  },
  name: {
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
  },
  email: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
  },
  note: {
    width: '100%',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.lg,
    ...visualRightText,
  },
});
