import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowLeft, Bell, CalendarClock, CalendarPlus, CalendarX, MessageCircle, MessageSquare, Trophy } from 'lucide-react-native';
import {
  AppNotification,
  NotificationKind,
  selectUnreadCount,
  useNotificationStore,
} from '@hooks/useNotificationStore';
import { visualRightText } from '@lib/rtl';
import { theme } from '@styles/theme';

const KIND_ICONS: Record<NotificationKind, typeof Bell> = {
  workout_soon: CalendarClock,
  goal_reached: Trophy,
  message: MessageCircle,
  invite: CalendarPlus,
  workout_cancelled: CalendarX,
  comment: MessageSquare,
};

function timeAgo(iso: string): string {
  const minutes = Math.floor((new Date().getTime() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'עכשיו';
  if (minutes < 60) return `לפני ${minutes} דק׳`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'אתמול' : `לפני ${days} ימים`;
}

export function NotificationsScreen() {
  const router = useRouter();
  const items = useNotificationStore((state) => state.items);
  const unread = useNotificationStore(selectUnreadCount);
  const { markRead, markAllRead } = useNotificationStore.getState();

  const open = (item: AppNotification) => {
    markRead(item.id);
    if (!item.href) return;
    router.push({ pathname: item.href, params: item.params } as unknown as Href);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="חזרה">
          <ArrowLeft color={theme.colors.magenta} size={20} strokeWidth={2} />
          <Text style={styles.backText}>חזרה</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>התראות</Text>
          {unread > 0 && (
            <Pressable onPress={markAllRead} style={styles.markAll} accessibilityRole="button">
              <Text style={styles.markAllText}>סמן הכל כנקרא</Text>
            </Pressable>
          )}
        </View>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Bell color={theme.colors.cyan} size={24} strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>אין התראות עדיין</Text>
            <Text style={styles.emptyText}>כאן יופיעו תזכורות לאימונים, יעדים שהשגת והודעות חדשות</Text>
          </View>
        ) : (
          items.map((item) => {
            const Icon = KIND_ICONS[item.kind];
            return (
              <Pressable
                key={item.id}
                style={[styles.card, !item.read && styles.cardUnread]}
                onPress={() => open(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item.read ? '' : 'חדש. '}${item.title}. ${item.body}. ${timeAgo(item.createdAt)}`}
              >
                <View style={styles.iconTile}>
                  <Icon color={theme.colors.black} size={22} strokeWidth={2} />
                </View>
                <View style={styles.textBlock}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardBody}>{item.body}</Text>
                  <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                </View>
                {!item.read && <View style={styles.dot} />}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing.lg,
  },
  scrollContent: {
    paddingVertical: theme.spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minHeight: 48,
  },
  backText: {
    color: theme.colors.magenta,
    fontSize: 15,
    fontFamily: theme.typography.label.fontFamily,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 34,
    fontFamily: theme.typography.h1.fontFamily,
    color: theme.colors.text,
  },
  markAll: {
    minHeight: 48,
    justifyContent: 'center',
  },
  markAllText: {
    fontSize: 14,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.cyan,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxxl,
    gap: theme.spacing.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.xl * 1.5,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    minHeight: 80,
  },
  cardUnread: {
    borderColor: theme.colors.magenta,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
  },
  cardTitle: {
    width: '100%',
    fontSize: 16,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
  },
  cardBody: {
    width: '100%',
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    marginTop: 2,
    ...visualRightText,
  },
  time: {
    width: '100%',
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
    ...visualRightText,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.magenta,
  },
});
