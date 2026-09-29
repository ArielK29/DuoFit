import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import { useWorkoutStore } from '@hooks/useWorkoutStore';
import { useChatStore } from '@hooks/useChatStore';
import { Card } from '@components/Card';
import { EmptyState } from '@components/EmptyState';
import { theme } from '@styles/theme';

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);

  if (diffMinutes < 1) return 'עכשיו';
  if (diffMinutes < 60) return `לפני ${diffMinutes} דק'`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

export function ChatListScreen() {
  const router = useRouter();
  const scheduledWorkouts = useWorkoutStore((state) => state.scheduledWorkouts);
  const conversations = useChatStore((state) => state.conversations);

  const matches = useMemo(() => {
    const partnersById = new Map<string, string>();
    scheduledWorkouts.forEach((workout) => partnersById.set(workout.partnerId, workout.partnerName));

    return Array.from(partnersById.entries())
      .map(([partnerId, partnerName]) => {
        const conversation = conversations[partnerId];
        const lastMessage = conversation?.messages[conversation.messages.length - 1];
        return { partnerId, partnerName, lastMessage };
      })
      .sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.sentAt).getTime() - new Date(a.lastMessage.sentAt).getTime();
      });
  }, [scheduledWorkouts, conversations]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>צ'אטים</Text>

      {matches.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={
              <View style={styles.emptyIconCircle}>
                <MessageSquare color={theme.colors.cyan} size={24} strokeWidth={2} />
              </View>
            }
            headline="עדיין אין הודעות"
            subheading="צא לאימון הראשון שלך!"
            ctaLabel="גלה שותפים"
            onCtaPress={() => router.push('/discover')}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {matches.map(({ partnerId, partnerName, lastMessage }) => (
            <Pressable
              key={partnerId}
              onPress={() => router.push({ pathname: '/conversation', params: { partnerId, partnerName } })}
            >
              <Card style={styles.row}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{partnerName[0]}</Text>
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={styles.partnerName}>{partnerName}</Text>
                  <Text style={styles.preview} numberOfLines={1}>
                    {lastMessage
                      ? lastMessage.kind === 'invite'
                        ? 'הזמנה לאימון'
                        : lastMessage.text
                      : 'התחילו שיחה'}
                  </Text>
                </View>
                {lastMessage && <Text style={styles.time}>{formatRelativeTime(lastMessage.sentAt)}</Text>}
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  title: {
    width: '100%',
    fontSize: 28,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.lg,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: theme.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.cyan,
  },
  rowTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  partnerName: {
    fontSize: 16,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
  },
  preview: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
  },
});
