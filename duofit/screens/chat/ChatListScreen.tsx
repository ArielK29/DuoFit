import { useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageSquare, Search } from 'lucide-react-native';
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
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredMatches = matches.filter((match) => match.partnerName.includes(searchQuery.trim()));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>צ'אטים</Text>

      {matches.length > 0 && (
        <View style={styles.searchBar}>
          <Search color={theme.colors.textTertiary} size={18} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="חיפוש שותף"
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>
      )}

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
          {filteredMatches.map(({ partnerId, partnerName, lastMessage }) => (
            <Pressable
              key={partnerId}
              onPress={() => router.push({ pathname: '/conversation', params: { partnerId, partnerName } })}
            >
              <Card style={styles.row}>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitial}>{partnerName[0]}</Text>
                  </View>
                  {lastMessage?.senderId === 'partner' && <View style={styles.unreadDot} />}
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={[styles.partnerName, lastMessage?.senderId === 'partner' && styles.partnerNameUnread]}>
                    {partnerName}
                  </Text>
                  <Text
                    style={[styles.preview, lastMessage?.senderId === 'partner' && styles.previewUnread]}
                    numberOfLines={1}
                  >
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: 48,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.text,
    textAlign: 'right',
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
  avatarWrap: {
    position: 'relative',
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
  unreadDot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 12,
    height: 12,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.magenta,
    borderWidth: 2,
    borderColor: theme.colors.surface,
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
  partnerNameUnread: {
    color: theme.colors.cyan,
  },
  preview: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  previewUnread: {
    color: theme.colors.text,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
  },
  time: {
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
  },
});
