import { useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { BadgeCheck, Flame, PenSquare, Search, Sparkles, Users } from 'lucide-react-native';
import { HeaderActions } from '@components/HeaderActions';
import { SegmentedToggle } from '@components/SegmentedToggle';
import { useChatStore } from '@hooks/useChatStore';
import { PARTNER_POOL, findPartnerById } from '@hooks/usePartnerMatching';
import { useWorkoutStore } from '@hooks/useWorkoutStore';
import { NewChatSheet } from '@screens/chat/NewChatSheet';
import { ChatFilter, ChatRow, avatarColorFor, buildRows, formatListTime } from '@lib/chat';
import { computePartnerStreaks } from '@lib/streaks';
import { theme } from '@styles/theme';
import { visualRight } from '@lib/rtl';

const FILTER_OPTIONS: { value: ChatFilter; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'groups', label: 'קבוצות' },
  { value: 'personal', label: 'אישי' },
];

// Suggested group: strength partners from the pool who are free on Monday and
// Wednesday. Tapping "צור" opens a real group chat with them.
const SUGGESTED_GROUP_ID = 'group-strength-mon-wed';
const SUGGESTED_GROUP_NAME = 'כוח · ב׳ ו-ד׳';
const SUGGESTED_ACTIVITY = 'כוח';
const SUGGESTED_DAYS = [1, 3];

export function ChatListScreen() {
  const router = useRouter();
  const scheduledWorkouts = useWorkoutStore((state) => state.scheduledWorkouts);
  const conversations = useChatStore((state) => state.conversations);
  const { openSeeded, ensureConversation, createGroup } = useChatStore.getState();

  const [filter, setFilter] = useState<ChatFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatVisible, setNewChatVisible] = useState(false);

  const rows = useMemo(() => {
    const scheduledPartners = new Map<string, string>();
    scheduledWorkouts.forEach((workout) => scheduledPartners.set(workout.partnerId, workout.partnerName));
    const streaks = new Map(
      computePartnerStreaks(scheduledWorkouts.filter((workout) => workout.checkedIn)).map((entry) => [
        entry.partnerId,
        entry.streak,
      ])
    );
    return buildRows({
      conversations,
      scheduledPartners,
      streaks,
      isVerified: (partnerId) => findPartnerById(partnerId)?.verified ?? false,
      now: new Date(),
    });
  }, [conversations, scheduledWorkouts]);

  const query = searchQuery.trim();
  const visibleRows = rows.filter(
    (row) =>
      (filter === 'all' || (filter === 'groups') === row.isGroup) &&
      (query === '' || row.name.includes(query) || row.preview.includes(query))
  );

  const suggestedMembers = PARTNER_POOL.filter(
    (partner) =>
      partner.activities.includes(SUGGESTED_ACTIVITY) && SUGGESTED_DAYS.every((day) => partner.availableDays.includes(day))
  );
  const showSuggestion = suggestedMembers.length >= 2 && !conversations[SUGGESTED_GROUP_ID] && filter !== 'personal';

  const openRow = (row: ChatRow) => {
    if (row.seed) openSeeded(row.seed);
    router.push({ pathname: '/conversation', params: { partnerId: row.id, partnerName: row.name } });
  };

  const createSuggestedGroup = () => {
    createGroup(
      SUGGESTED_GROUP_ID,
      SUGGESTED_GROUP_NAME,
      suggestedMembers.map((partner) => partner.name),
      suggestedMembers.length + 1
    );
    router.push({
      pathname: '/conversation',
      params: { partnerId: SUGGESTED_GROUP_ID, partnerName: SUGGESTED_GROUP_NAME },
    });
  };

  const startChat = (partnerId: string, partnerName: string) => {
    ensureConversation(partnerId, partnerName);
    setNewChatVisible(false);
    router.push({ pathname: '/conversation', params: { partnerId, partnerName } });
  };

  const now = new Date();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>צ'אטים</Text>
          <HeaderActions
            trailing={
              <Pressable style={styles.newChatButton} onPress={() => setNewChatVisible(true)} accessibilityLabel="שיחה חדשה">
                <PenSquare color={theme.colors.text} size={22} strokeWidth={2} />
              </Pressable>
            }
          />
        </View>

        <View style={styles.previewPill}>
          <Text style={styles.previewPillText}>תצוגה מקדימה — חלק מהשיחות לדוגמה</Text>
        </View>

        <SegmentedToggle options={FILTER_OPTIONS} value={filter} onChange={setFilter} />

        <View style={styles.searchBar}>
          <Search color={theme.colors.textSecondary} size={20} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="חיפוש שותף, קבוצה או מקום"
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>

        {visibleRows.length === 0 ? (
          <Text style={styles.empty}>
            {query !== '' ? 'לא נמצאו שיחות שמתאימות לחיפוש' : filter === 'groups' ? 'עוד אין לך קבוצות. הצטרף לקבוצה בקהילה' : 'אין שיחות להצגה'}
          </Text>
        ) : (
          visibleRows.map((row) => <ChatRowItem key={row.id} row={row} now={now} onPress={() => openRow(row)} />)
        )}

        {showSuggestion && (
          <View style={styles.suggestion}>
            <View style={styles.suggestionIcon}>
              <Sparkles color={theme.colors.black} size={24} strokeWidth={2} />
            </View>
            <View style={styles.suggestionText}>
              <Text style={styles.suggestionTitle}>קבוצות נשארות, זוגות מתפזרים</Text>
              <Text style={styles.suggestionBody}>
                {`${suggestedMembers.length} מתאמני כוח באזור שלך פנויים בימי ב׳ ו-ד׳`}
              </Text>
            </View>
            <Pressable style={styles.suggestionButton} onPress={createSuggestedGroup} accessibilityLabel="צור קבוצה">
              <Text style={styles.suggestionButtonText}>צור</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <NewChatSheet visible={newChatVisible} onPick={startChat} onClose={() => setNewChatVisible(false)} />
    </View>
  );
}

function ChatRowItem({ row, now, onPress }: { row: ChatRow; now: Date; onPress: () => void }) {
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[
        row.isGroup ? `קבוצה ${row.name}` : row.name,
        row.unread > 0 ? `${row.unread} הודעות שלא נקראו` : null,
        row.preview,
        row.sentAt ? formatListTime(row.sentAt, now) : null,
      ]
        .filter(Boolean)
        .join(', ')}
    >
      {row.isGroup ? (
        <View style={styles.groupTile}>
          <Users color={theme.colors.text} size={28} strokeWidth={2} />
          {row.memberCount !== undefined && (
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>{row.memberCount}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.avatar, { backgroundColor: avatarColorFor(row.id) }]}>
          <Text style={styles.avatarInitial}>{row.name[0]}</Text>
        </View>
      )}

      <View style={styles.textBlock}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {row.name}
          </Text>
          {row.verified && <BadgeCheck color={theme.colors.cyan} size={18} strokeWidth={2} />}
        </View>
        <Text style={[styles.preview, row.unread > 0 && styles.previewUnread]} numberOfLines={1}>
          {row.preview}
        </Text>
      </View>

      <View style={styles.meta}>
        {row.sentAt && <Text style={styles.time}>{formatListTime(row.sentAt, now)}</Text>}
        {row.unread > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{row.unread}</Text>
          </View>
        ) : row.streak !== undefined && row.streak > 1 ? (
          <View style={styles.streak}>
            <Flame color={theme.colors.magenta} fill={theme.colors.magenta} size={14} strokeWidth={2} />
            <Text style={styles.streakText}>{row.streak}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing.lg,
  },
  scrollContent: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 34,
    fontFamily: theme.typography.h1.fontFamily,
    color: theme.colors.text,
  },
  newChatButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPill: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  previewPillText: {
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 52,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
  },
  empty: {
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 84,
    paddingVertical: theme.spacing.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 26,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.black,
  },
  groupTile: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.xl + 4,
    backgroundColor: theme.colors.surfaceHover,
    borderWidth: 1,
    borderColor: theme.colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    position: 'absolute',
    bottom: -4,
    ...visualRight(-4),
  },
  memberBadgeText: {
    fontSize: 12,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.black,
  },
  textBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    maxWidth: '100%',
  },
  name: {
    flexShrink: 1,
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
  },
  preview: {
    maxWidth: '100%',
    fontSize: 15,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  previewUnread: {
    color: theme.colors.text,
  },
  meta: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    minWidth: 44,
  },
  time: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
  },
  unreadBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.magenta,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.black,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakText: {
    fontSize: 16,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.magenta,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.xl * 1.5,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  suggestionIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.magenta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  suggestionTitle: {
    fontSize: 17,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
  },
  suggestionBody: {
    width: '100%',
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginTop: 2,
  },
  suggestionButton: {
    minWidth: 72,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.cyan,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
  },
  suggestionButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.button.fontFamily,
    color: theme.colors.black,
  },
});
