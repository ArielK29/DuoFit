import React from 'react';
import { View, Text, Pressable, Alert, Linking, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useAccountSheet } from '@hooks/useAccountSheet';
import { useAuth } from '@hooks/useAuth';
import { theme } from '@styles/theme';

export const UserAvatar: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  const user = useAuth((state) => state.user);

  const circle = (
    <View style={styles.avatar}>
      {user?.avatar ? (
        <Image source={{ uri: user.avatar }} style={styles.avatarImage} contentFit="cover" />
      ) : (
        <Text style={styles.avatarInitial}>{user?.name?.[0] ?? '?'}</Text>
      )}
    </View>
  );

  if (!onPress) return circle;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="החשבון שלי">
      {circle}
    </Pressable>
  );
};

function confirmEmergencyCall() {
  Alert.alert('מצב חירום', 'בחר למי להתקשר. השיחה תתחיל רק אחרי שתלחץ על חיוג.', [
    { text: 'משטרה · 100', onPress: () => Linking.openURL('tel:100') },
    { text: 'מד״א · 101', onPress: () => Linking.openURL('tel:101') },
    { text: 'ביטול', style: 'cancel' },
  ]);
}

// SOS + avatar cluster from the FitMatch headers (the avatar can be swapped
// for another action, e.g. the Chat tab's "new chat" button). SOS is a real action: after
// a confirmation it opens the phone dialer with the emergency number.
export const HeaderActions: React.FC<{ trailing?: React.ReactNode }> = ({ trailing }) => {
  const openAccount = useAccountSheet((state) => state.open);

  return (
  <View style={styles.row}>
    <Pressable style={styles.sosButton} onPress={confirmEmergencyCall} accessibilityLabel="חירום">
      <Text style={styles.sosText}>SOS</Text>
    </Pressable>
    {trailing ?? <UserAvatar onPress={openAccount} />}
  </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
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
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
  },
  sosButton: {
    minWidth: 64,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.magenta,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
  },
  sosText: {
    fontSize: 16,
    fontFamily: theme.typography.button.fontFamily,
    color: theme.colors.black,
  },
});
