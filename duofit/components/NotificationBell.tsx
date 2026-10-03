import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { selectUnreadCount, useNotificationStore } from '@hooks/useNotificationStore';
import { theme } from '@styles/theme';

// Bell with an unread count; opens the notification center.
export const NotificationBell: React.FC = () => {
  const router = useRouter();
  const unread = useNotificationStore(selectUnreadCount);

  return (
    <Pressable
      style={styles.button}
      onPress={() => router.push('/notifications')}
      accessibilityRole="button"
      accessibilityLabel={unread > 0 ? `התראות, ${unread} חדשות` : 'התראות'}
    >
      <Bell color={theme.colors.text} size={20} strokeWidth={2} />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    minWidth: 18,
    height: 18,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.magenta,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    transform: [{ translateX: 10 }],
  },
  badgeText: {
    fontSize: 11,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.black,
  },
});
