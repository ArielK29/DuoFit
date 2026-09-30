import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { Trophy, Heart, MessageCircle, Flag, Camera } from 'lucide-react-native';
import { Card } from '@components/Card';
import { theme } from '@styles/theme';

// Illustrative only — DuoFit has no real user directory/social graph yet
// (#15); the whole tab is already labeled "תצוגה מקדימה" below.
const MOCK_MEMBER_COUNT = 3214;

interface CommunityPost {
  id: string;
  authorName: string;
  authorInitial: string;
  avatarColor: string;
  activityTag: string;
  timeAgo: string;
  text: string;
  achievement?: { label: string; value: string };
  likes: number;
  comments: number;
}

// Static mock feed — no backend/social-graph yet (#15), same "תצוגה מקדימה"
// convention used for Dashboard/Discover before they had real data.
const MOCK_POSTS: CommunityPost[] = [
  {
    id: '1',
    authorName: 'מאיה שרון',
    authorInitial: 'מ',
    avatarColor: theme.colors.cyan,
    activityTag: 'כוח',
    timeAgo: 'לפני 25 דק׳',
    text: 'שיא אישי חדש בסקוואט! תודה לרועי שעמד מאחוריי ולא נתן לי לוותר על החזרה האחרונה.',
    achievement: { label: 'סקוואט', value: '100 ק"ג' },
    likes: 48,
    comments: 12,
  },
  {
    id: '2',
    authorName: 'עומר דהן',
    authorInitial: 'ע',
    avatarColor: theme.colors.magenta,
    activityTag: 'כדורסל',
    timeAgo: 'לפני שעה',
    text: 'חסרים 2 שחקנים ל-3 על 3 הערב במגרש גורדון. רמה בינונית, אווירה טובה — מי בא?',
    likes: 19,
    comments: 7,
  },
  {
    id: '3',
    authorName: 'שיר מזרחי',
    authorInitial: 'ש',
    avatarColor: theme.colors.cyan,
    activityTag: 'ריצה',
    timeAgo: 'לפני 3 שעות',
    text: 'ריצת בוקר עם הקבוצה — 7 אנשים ב-06:30. מי אמר שאין מוטיבציה בבוקר?',
    achievement: { label: 'מרחק', value: '6.4 ק"מ' },
    likes: 86,
    comments: 21,
  },
  {
    id: '4',
    authorName: 'איתי ברק',
    authorInitial: 'א',
    avatarColor: theme.colors.magenta,
    activityTag: 'קליסטניקס',
    timeAgo: 'אתמול',
    text: '3 שבועות של עבודה משותפת בפארק סוף סוף משתלמות. תודה לכל מי שהתאמן איתי בדרך.',
    achievement: { label: 'משיכות רצופות', value: '15' },
    likes: 64,
    comments: 15,
  },
];

const ACTIVITY_FILTERS = ['הכל', ...Array.from(new Set(MOCK_POSTS.map((post) => post.activityTag)))];

export function CommunityScreen() {
  const [activeFilter, setActiveFilter] = useState('הכל');

  const handleComposerPress = () => {
    Alert.alert('בקרוב', 'פרסום עדכון יהיה זמין לאחר חיבור לשרת אמיתי');
  };

  const visiblePosts = useMemo(
    () => (activeFilter === 'הכל' ? MOCK_POSTS : MOCK_POSTS.filter((post) => post.activityTag === activeFilter)),
    [activeFilter]
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>קהילה</Text>
        <Text style={styles.subtitle}>{MOCK_MEMBER_COUNT.toLocaleString('he-IL')} מתאמנים בתל אביב והסביבה</Text>

        <View style={styles.previewBadge}>
          <Text style={styles.previewBadgeText}>תצוגה מקדימה — פוסטים לדוגמה</Text>
        </View>

        <Pressable style={styles.composer} onPress={handleComposerPress}>
          <Camera color={theme.colors.textTertiary} size={18} strokeWidth={2} />
          <Text style={styles.composerText}>איך היה האימון היום?</Text>
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {ACTIVITY_FILTERS.map((filter) => (
            <Pressable
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {visiblePosts.map((post) => (
          <Card key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.tagPill}>
                <Text style={styles.tagPillText}>{post.activityTag}</Text>
              </View>
              <View style={styles.authorBlock}>
                <Text style={styles.authorName}>{post.authorName}</Text>
                <Text style={styles.timeAgo}>{post.timeAgo}</Text>
              </View>
              <View style={[styles.avatarCircle, { backgroundColor: post.avatarColor }]}>
                <Text style={styles.avatarInitial}>{post.authorInitial}</Text>
              </View>
            </View>

            <Text style={styles.postText}>{post.text}</Text>

            {post.achievement && (
              <View style={styles.achievementCard}>
                <View style={styles.achievementIconWrap}>
                  <Trophy color={theme.colors.magenta} size={20} strokeWidth={2} />
                </View>
                <View style={styles.achievementTextWrap}>
                  <Text style={styles.achievementLabel}>{post.achievement.label}</Text>
                  <Text style={styles.achievementValue}>{post.achievement.value}</Text>
                </View>
              </View>
            )}

            <View style={styles.postFooter}>
              <Flag color={theme.colors.textTertiary} size={16} strokeWidth={2} />
              <View style={styles.postFooterRight}>
                <View style={styles.footerStat}>
                  <Text style={styles.footerStatText}>{post.comments}</Text>
                  <MessageCircle color={theme.colors.textTertiary} size={16} strokeWidth={2} />
                </View>
                <View style={styles.footerStat}>
                  <Text style={styles.footerStatText}>{post.likes}</Text>
                  <Heart color={theme.colors.textTertiary} size={16} strokeWidth={2} />
                </View>
              </View>
            </View>
          </Card>
        ))}
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
  title: {
    width: '100%',
    fontSize: 28,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    width: '100%',
    fontSize: 13,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.md,
  },
  previewBadge: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  previewBadgeText: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: 48,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  composerText: {
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textTertiary,
  },
  filtersRow: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  filterChip: {
    minHeight: 36,
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
  },
  filterChipActive: {
    backgroundColor: theme.colors.cyan,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: theme.colors.black,
  },
  postCard: {
    marginBottom: theme.spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 15,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.black,
  },
  authorBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  authorName: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
  },
  timeAgo: {
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  tagPill: {
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  tagPillText: {
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  postText: {
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.text,
    textAlign: 'right',
    marginBottom: theme.spacing.md,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  achievementIconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementTextWrap: {
    alignItems: 'flex-end',
  },
  achievementLabel: {
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  achievementValue: {
    fontSize: 18,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postFooterRight: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  footerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  footerStatText: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textTertiary,
  },
});
