import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Timer } from 'lucide-react-native';
import { useAuth } from '@hooks/useAuth';
import { useCommunityStore } from '@hooks/useCommunityStore';
import { PLANK_PARTICIPANTS } from '@constants/community';
import { buildLeaderboard, computePlankRank, formatDuration, getDaysLeftInWeek, getPlankSeconds } from '@lib/plank';
import { theme } from '@styles/theme';

interface ChallengeSectionProps {
  onTryRecord: () => void;
}

function daysLeftLabel(days: number): string {
  if (days <= 0) return 'נגמר היום';
  if (days === 1) return 'נגמר מחר';
  return `נגמר בעוד ${days} ימים`;
}

// "אתגר השבוע": the hero card + leaderboard. The plank time is the user's real
// record (from the timer); the participant count and the other rows are
// example data until there's a backend.
export const ChallengeSection: React.FC<ChallengeSectionProps> = ({ onTryRecord }) => {
  const user = useAuth((state) => state.user);
  const best = useCommunityStore((state) => state.plankBestSeconds);

  const seconds = getPlankSeconds(best);
  const rows = buildLeaderboard(seconds, 'אתה');
  const daysLeft = getDaysLeftInWeek(new Date());

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>אתגר השבוע</Text>
        <Text style={styles.sectionAside}>{daysLeftLabel(daysLeft)}</Text>
      </View>

      <View style={styles.hero}>
        <LinearGradient
          colors={['rgba(255,0,168,0.35)', 'rgba(255,0,168,0)']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.3, y: 0.6 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.kicker}>אתגר אזורי · תל אביב</Text>
        <Text style={styles.heroTitle}>אתגר הפלאנק של תל אביב</Text>
        <Text style={styles.heroBody}>הפלאנק הכי ארוך בשבוע. מנצחי השכונה מקבלים חודש Pro.</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{PLANK_PARTICIPANTS.toLocaleString('he-IL')}</Text>
            <Text style={styles.statLabel}>משתתפים</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatDuration(seconds)}</Text>
            <Text style={styles.statLabel}>{best === null ? 'השיא שלך (לדוגמה)' : 'השיא שלך'}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{`#${computePlankRank(seconds)}`}</Text>
            <Text style={styles.statLabel}>המקום שלך</Text>
          </View>
        </View>

        <Pressable style={styles.cta} onPress={onTryRecord} accessibilityLabel="נסה לשבור את השיא">
          <Text style={styles.ctaText}>נסה לשבור את השיא</Text>
          <Timer color={theme.colors.black} size={20} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.board}>
        {rows.map((row, index) => (
          <View key={`${row.rank}-${row.name}`} style={[styles.row, index > 0 && styles.rowDivider, row.isMe && styles.rowMe]}>
            <View style={[styles.rankBadge, rankBadgeStyle(row.rank, row.isMe)]}>
              <Text style={[styles.rankText, row.isMe && styles.rankTextMe]}>{row.rank}</Text>
            </View>
            <View style={[styles.avatar, { backgroundColor: row.isMe ? theme.colors.surfaceHover : row.avatarColor }]}>
              <Text style={[styles.avatarInitial, row.isMe && { color: theme.colors.text }]}>
                {row.isMe ? (user?.name?.[0] ?? '?') : row.name[0]}
              </Text>
            </View>
            <Text style={styles.rowName}>{row.name}</Text>
            <Text style={styles.rowTime}>{formatDuration(row.seconds)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

function rankBadgeStyle(rank: number, isMe: boolean) {
  if (isMe) return { backgroundColor: 'transparent' };
  if (rank === 1) return { backgroundColor: theme.colors.warning };
  if (rank === 2) return { backgroundColor: theme.colors.textSecondary };
  if (rank === 3) return { backgroundColor: `${theme.colors.warning}99` };
  return { backgroundColor: theme.colors.surfaceHover };
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
  },
  sectionAside: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
  },
  hero: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.xl * 1.5,
    padding: theme.spacing.xl,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  kicker: {
    width: '100%',
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.magenta,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.xs,
  },
  heroTitle: {
    width: '100%',
    fontSize: 26,
    fontFamily: theme.typography.h1.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.sm,
  },
  heroBody: {
    width: '100%',
    fontSize: 15,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 28,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    minHeight: 56,
    backgroundColor: theme.colors.magenta,
    borderRadius: theme.borderRadius.full,
  },
  ctaText: {
    fontSize: 17,
    fontFamily: theme.typography.button.fontFamily,
    color: theme.colors.black,
  },
  board: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.xl * 1.5,
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 64,
    paddingHorizontal: theme.spacing.lg,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceHover,
  },
  rowMe: {
    backgroundColor: 'rgba(255,0,168,0.12)',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.black,
  },
  rankTextMe: {
    color: theme.colors.magenta,
    fontSize: 16,
  },
  avatar: {
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
  rowName: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
  },
  rowTime: {
    fontSize: 16,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
  },
});
