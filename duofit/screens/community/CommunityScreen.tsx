import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, RefreshControl, StyleSheet } from 'react-native';
import { Camera, Plus } from 'lucide-react-native';
import { HeaderActions, UserAvatar } from '@components/HeaderActions';
import { useAuth } from '@hooks/useAuth';
import { useCommunityStore, UserPost } from '@hooks/useCommunityStore';
import { useFeedStore } from '@hooks/useFeedStore';
import { FEED_FILTERS, MEMBER_COUNT, SEED_POSTS } from '@constants/community';
import { ChallengeSection } from '@screens/community/ChallengeSection';
import { CommentsModal } from '@screens/community/CommentsModal';
import { ComposeModal } from '@screens/community/ComposeModal';
import { GroupsSection } from '@screens/community/GroupsSection';
import { FeedPost, PostCard } from '@screens/community/PostCard';
import { PlankTimerModal } from '@screens/community/PlankTimerModal';
import { theme } from '@styles/theme';
import { DEMO_DATA } from '@lib/demo';
import { askChoice } from '@lib/askChoice';
import { visualLeft, visualRightText } from '@lib/rtl';

function formatTimeAgo(iso: string): string {
  const minutes = Math.floor((new Date().getTime() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'עכשיו';
  if (minutes < 60) return `לפני ${minutes} דק׳`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  return `לפני ${Math.floor(hours / 24)} ימים`;
}

export function CommunityScreen() {
  const user = useAuth((state) => state.user);
  const { userPosts, likedPostIds, rsvpPostIds, hiddenPostIds, comments } = useCommunityStore();
  const { toggleLike, toggleRsvp, hidePost, deletePost } = useCommunityStore.getState();
  const feed = useFeedStore();

  const [activeFilter, setActiveFilter] = useState('הכל');
  const [composeVisible, setComposeVisible] = useState(false);
  const [plankVisible, setPlankVisible] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const initial = user?.name?.[0] ?? '?';

  // Real members: load the shared feed when the tab opens and when the member pulls down.
  const loadFeed = feed.load;
  useEffect(() => {
    if (!DEMO_DATA) loadFeed();
  }, [loadFeed]);
  const refresh = useCallback(() => {
    loadFeed();
  }, [loadFeed]);

  const myPosts: FeedPost[] = userPosts.map((post: UserPost) => ({
    id: post.id,
    authorName: user?.name ?? 'אתה',
    authorInitial: initial,
    avatarColor: theme.colors.magenta,
    verified: false,
    activity: post.activity,
    meta: formatTimeAgo(post.createdAt),
    text: post.text,
    imageUri: post.imageUri,
    likes: likedPostIds.includes(post.id) ? 1 : 0,
    comments: comments[post.id]?.length ?? 0,
    isMine: true,
  }));

  const seedPosts: FeedPost[] = SEED_POSTS.map((post) => ({
    id: post.id,
    authorName: post.authorName,
    authorInitial: post.authorName[0],
    avatarColor: post.avatarColor,
    verified: post.verified,
    activity: post.activity,
    meta: `${post.timeAgo} · ${post.place}`,
    text: post.text,
    attachment: post.attachment,
    likes: post.likes + (likedPostIds.includes(post.id) ? 1 : 0),
    comments: post.comments + (comments[post.id]?.length ?? 0),
    isMine: false,
  }));

  const remotePosts: FeedPost[] = feed.posts.map((post) => ({
    id: post.id,
    authorId: post.userId,
    authorName: post.userId === user?.id ? (user?.name ?? 'אתה') : post.authorName,
    authorInitial: post.authorName[0] ?? '?',
    avatarUrl: post.avatarUrl ?? undefined,
    avatarColor: theme.colors.magenta,
    verified: false,
    activity: post.activity,
    meta: formatTimeAgo(post.createdAt),
    text: post.body,
    imageUri: post.imageUrl ?? undefined,
    likes: post.likes,
    comments: post.comments,
    isMine: post.userId === user?.id,
  }));

  const allPosts = DEMO_DATA ? [...myPosts, ...seedPosts] : remotePosts;
  const visiblePosts = allPosts.filter(
    (post) => !hiddenPostIds.includes(post.id) && (activeFilter === 'הכל' || post.activity === activeFilter)
  );
  const commentsPost = allPosts.find((post) => post.id === commentsPostId);
  // The post disappeared (reported, or its author was blocked) while its comments were open.
  useEffect(() => {
    if (!DEMO_DATA && feed.loaded && commentsPostId && !commentsPost) setCommentsPostId(null);
  }, [feed.loaded, commentsPostId, commentsPost]);
  const isLiked = (postId: string) =>
    DEMO_DATA ? likedPostIds.includes(postId) : (feed.posts.find((item) => item.id === postId)?.liked ?? false);

  const reportPost = (post: FeedPost) => {
    if (DEMO_DATA) {
      Alert.alert('דיווח על פוסט', `לדווח על הפוסט של ${post.authorName}? הוא יוסתר מהפיד שלך.`, [
        { text: 'ביטול', style: 'cancel' },
        { text: 'דווח והסתר', style: 'destructive', onPress: () => hidePost(post.id) },
      ]);
      return;
    }
    // Real members: report (hidden for you at once, hidden for everybody after 3 reports) or block the person.
    askChoice(
      'דיווח או חסימה',
      `הפוסט של ${post.authorName}. דיווח מסתיר אותו ממך מיד. חסימה מסתירה את כל מה שהאדם הזה כותב, וגם אתה לא תופיע אצלו.`,
      [
        { label: 'דווח והסתר', destructive: true, onPress: () => feed.report({ postId: post.id }, 'inappropriate') },
        ...(post.authorId ? [{ label: `חסום את ${post.authorName}`, destructive: true, onPress: () => feed.block(post.authorId as string) }] : []),
      ]
    );
  };

  const confirmDelete = (post: FeedPost) =>
    askChoice('מחיקת פוסט', 'למחוק את הפוסט שלך?', [
      { label: 'מחק', destructive: true, onPress: () => (DEMO_DATA ? deletePost(post.id) : feed.deletePost(post.id)) },
    ]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={DEMO_DATA ? undefined : <RefreshControl refreshing={feed.loading} onRefresh={refresh} tintColor={theme.colors.cyan} />}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>קהילה</Text>
            <Text style={styles.subtitle}>
              {MEMBER_COUNT === null ? 'הקהילה של DuoFit' : `${MEMBER_COUNT.toLocaleString('he-IL')} מתאמנים בתל אביב והסביבה`}
            </Text>
          </View>
          <HeaderActions />
        </View>

        {DEMO_DATA && (
          <View style={styles.previewPill}>
            <Text style={styles.previewPillText}>תצוגה מקדימה — פוסטים, קבוצות ודירוג לדוגמה</Text>
          </View>
        )}

        <Pressable style={styles.composer} onPress={() => setComposeVisible(true)} accessibilityLabel="כתוב פוסט">
          <UserAvatar />
          <Text style={styles.composerText}>איך היה האימון היום?</Text>
          <Camera color={theme.colors.textSecondary} size={22} strokeWidth={2} />
        </Pressable>

        <ChallengeSection onTryRecord={() => setPlankVisible(true)} />

        <GroupsSection />

        <Text style={styles.feedTitle}>הפיד</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroll}
        >
          {FEED_FILTERS.map((filter) => (
            <Pressable
              key={filter}
              style={[styles.chip, activeFilter === filter && styles.chipActive]}
              onPress={() => setActiveFilter(filter)}
              accessibilityState={{ selected: activeFilter === filter }}
            >
              <Text style={[styles.chipText, activeFilter === filter && styles.chipTextActive]}>{filter}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {visiblePosts.length === 0 ? (
          <Text style={styles.emptyFeed}>
            {feed.loading && !feed.loaded
              ? 'טוען את הפיד...'
              : feed.loadFailed && !feed.loaded
                ? 'לא הצלחנו לטעון את הפיד. משוך למטה כדי לנסות שוב'
              : activeFilter === 'הכל'
                ? 'עוד אין פוסטים. היה הראשון לשתף איך היה האימון'
                : 'אין פוסטים בקטגוריה הזו כרגע'}
          </Text>
        ) : (
          visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              liked={isLiked(post.id)}
              rsvped={rsvpPostIds.includes(post.id)}
              onToggleLike={() => (DEMO_DATA ? toggleLike(post.id) : feed.toggleLike(post.id))}
              onOpenComments={() => setCommentsPostId(post.id)}
              onToggleRsvp={() => toggleRsvp(post.id)}
              onReport={() => reportPost(post)}
              onDelete={() => confirmDelete(post)}
            />
          ))
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setComposeVisible(true)} accessibilityLabel="פוסט חדש">
        <Plus color={theme.colors.black} size={30} strokeWidth={2.5} />
      </Pressable>

      <ComposeModal visible={composeVisible} onClose={() => setComposeVisible(false)} />
      <PlankTimerModal visible={plankVisible} onClose={() => setPlankVisible(false)} />
      <CommentsModal
        postId={commentsPostId}
        authorName={commentsPost?.authorName ?? ''}
        onClose={() => setCommentsPostId(null)}
      />
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
    paddingTop: theme.spacing.xl,
    paddingBottom: 120, // room for the floating "+" button
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  headerText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 34,
    fontFamily: theme.typography.h1.fontFamily,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
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
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 72,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.xl * 1.5,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  composerText: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    ...visualRightText,
  },
  feedTitle: {
    width: '100%',
    fontSize: 22,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
    marginBottom: theme.spacing.md,
  },
  chipsScroll: {
    flexGrow: 0,
    marginBottom: theme.spacing.lg,
  },
  chipsRow: {
    gap: theme.spacing.sm,
  },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.xl,
  },
  chipActive: {
    backgroundColor: theme.colors.cyan,
  },
  chipText: {
    fontSize: 15,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.black,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
  },
  emptyFeed: {
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.xl,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    ...visualLeft(theme.spacing.lg),
    width: 72,
    height: 72,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.magenta,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
});
