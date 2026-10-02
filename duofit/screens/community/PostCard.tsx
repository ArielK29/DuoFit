import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { BadgeCheck, Flag, Heart, MessageCircle, Trash2, Trophy } from 'lucide-react-native';
import { PostAttachment } from '@constants/community';
import { theme } from '@styles/theme';

export interface FeedPost {
  id: string;
  authorName: string;
  authorInitial: string;
  avatarColor: string;
  verified: boolean;
  activity: string;
  meta: string;
  text: string;
  imageUri?: string;
  attachment?: PostAttachment;
  likes: number;
  comments: number;
  isMine: boolean;
}

interface PostCardProps {
  post: FeedPost;
  liked: boolean;
  rsvped: boolean;
  onToggleLike: () => void;
  onOpenComments: () => void;
  onToggleRsvp: () => void;
  onReport: () => void;
  onDelete: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  liked,
  rsvped,
  onToggleLike,
  onOpenComments,
  onToggleRsvp,
  onReport,
  onDelete,
}) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <View style={[styles.avatar, { backgroundColor: post.avatarColor }]}>
        <Text style={styles.avatarInitial}>{post.authorInitial}</Text>
      </View>
      <View style={styles.authorBlock}>
        <View style={styles.nameRow}>
          <Text style={styles.authorName}>{post.authorName}</Text>
          {post.verified && <BadgeCheck color={theme.colors.cyan} size={18} strokeWidth={2} />}
        </View>
        <Text style={styles.meta}>{post.meta}</Text>
      </View>
      <View style={styles.tagPill}>
        <Text style={styles.tagText}>{post.activity}</Text>
      </View>
    </View>

    <Text style={styles.text}>{post.text}</Text>

    {post.imageUri && <Image source={{ uri: post.imageUri }} style={styles.image} resizeMode="cover" />}

    {post.attachment && <Attachment attachment={post.attachment} rsvped={rsvped} onToggleRsvp={onToggleRsvp} />}

    <View style={styles.footer}>
      {post.isMine ? (
        <Pressable onPress={onDelete} hitSlop={16} accessibilityLabel="מחק פוסט">
          <Trash2 color={theme.colors.textTertiary} size={18} strokeWidth={2} />
        </Pressable>
      ) : (
        <Pressable onPress={onReport} hitSlop={16} accessibilityLabel="דווח על פוסט">
          <Flag color={theme.colors.textTertiary} size={18} strokeWidth={2} />
        </Pressable>
      )}
      <View style={styles.footerStats}>
        <Pressable
          style={styles.stat}
          onPress={onToggleLike}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityState={{ selected: liked }}
          accessibilityLabel={`${liked ? 'הסר לייק' : 'לייק'}, ${post.likes} לייקים`}
        >
          <Heart
            color={liked ? theme.colors.magenta : theme.colors.textTertiary}
            fill={liked ? theme.colors.magenta : 'transparent'}
            size={20}
            strokeWidth={2}
          />
          <Text style={[styles.statText, liked && styles.statTextActive]}>{post.likes}</Text>
        </Pressable>
        <Pressable
          style={styles.stat}
          onPress={onOpenComments}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`${post.comments} תגובות. פתח תגובות`}
        >
          <MessageCircle color={theme.colors.textTertiary} size={20} strokeWidth={2} />
          <Text style={styles.statText}>{post.comments}</Text>
        </Pressable>
      </View>
    </View>
  </View>
);

const Attachment: React.FC<{ attachment: PostAttachment; rsvped: boolean; onToggleRsvp: () => void }> = ({
  attachment,
  rsvped,
  onToggleRsvp,
}) => {
  if (attachment.kind === 'record') {
    return (
      <View style={styles.recordCard}>
        <View style={styles.recordIcon}>
          <Trophy color={theme.colors.black} size={24} strokeWidth={2} />
        </View>
        <View style={styles.recordText}>
          <Text style={styles.recordKicker}>{attachment.kicker}</Text>
          <Text style={styles.recordValue}>{attachment.value}</Text>
        </View>
        {attachment.badge && (
          <View style={styles.recordBadge}>
            <Text style={styles.recordBadgeText}>{attachment.badge}</Text>
          </View>
        )}
      </View>
    );
  }

  if (attachment.kind === 'event') {
    const spotsLeft = attachment.spots - (rsvped ? 1 : 0);
    const full = spotsLeft <= 0 && !rsvped;
    return (
      <View style={styles.eventCard}>
        <View style={styles.eventText}>
          <Text style={styles.eventWhen}>{attachment.when}</Text>
          <Text style={styles.eventPlace}>{`${attachment.place} · ${spotsLeft} מקומות פנויים`}</Text>
        </View>
        <Pressable
          style={[styles.eventButton, rsvped && styles.eventButtonDone, full && styles.eventButtonFull]}
          onPress={onToggleRsvp}
          disabled={full}
          accessibilityRole="button"
        >
          <Text style={[styles.eventButtonText, rsvped && styles.eventButtonTextDone]}>
            {full ? 'אין מקום' : rsvped ? 'נרשמת ✓' : 'אני בא'}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.statsCard}>
      {attachment.items.map((item) => (
        <View key={item.label} style={styles.statsItem}>
          <Text style={styles.statsValue}>{item.value}</Text>
          <Text style={styles.statsLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.xl * 1.5,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.black,
  },
  authorBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  authorName: {
    fontSize: 17,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
  },
  meta: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  tagPill: {
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
  },
  tagText: {
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  text: {
    width: '100%',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.md,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surfaceHover,
    marginBottom: theme.spacing.md,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: 'rgba(255,184,0,0.12)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  recordIcon: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  recordKicker: {
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  recordValue: {
    fontSize: 24,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  recordBadge: {
    backgroundColor: 'rgba(0,229,255,0.15)',
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
  },
  recordBadgeText: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.cyan,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  eventText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  eventWhen: {
    fontSize: 17,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
  },
  eventPlace: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  eventButton: {
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: theme.colors.magenta,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.xl,
  },
  eventButtonDone: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.cyan,
  },
  eventButtonFull: {
    backgroundColor: theme.colors.surface,
  },
  eventButtonText: {
    fontSize: 15,
    fontFamily: theme.typography.button.fontFamily,
    color: theme.colors.black,
  },
  eventButtonTextDone: {
    color: theme.colors.cyan,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 26,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  statsLabel: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minHeight: 48,
  },
  statText: {
    fontSize: 15,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.textTertiary,
  },
  statTextActive: {
    color: theme.colors.magenta,
  },
});
