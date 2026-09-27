import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, ArrowLeft, Users, Zap } from 'lucide-react-native';
import { ProgressRing } from '@components/ProgressRing';
import { theme } from '@styles/theme';

// Static placeholder data. This screen is a visual mockup only (per issue #2)
// — there is no backend yet (#15) and no completed check-ins to show real
// numbers for, so every value here is an example, not live data.
const MOCK_STATS = {
  streakDays: 4,
  streakGoal: 7,
  workouts: 12,
  workoutsGoal: 15,
  partners: 3,
  partnersGoal: 5,
};

const MOCK_HISTORY = [
  { id: '1', title: 'ריצה עם דניאל', date: 'אתמול' },
  { id: '2', title: 'כושר גופני עם נועה', date: 'לפני 3 ימים' },
  { id: '3', title: 'יוגה עם תומר', date: 'לפני שבוע' },
];

export default function Dashboard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.previewBadge}>
          <Text style={styles.previewBadgeText}>תצוגה מקדימה — נתוני דוגמה</Text>
        </View>

        <Text style={styles.title}>לוח הבקרה שלי</Text>

        <View style={styles.heroCard}>
          <ProgressRing
            size={168}
            strokeWidth={14}
            progress={MOCK_STATS.streakDays / MOCK_STATS.streakGoal}
            color={theme.colors.cyan}
            trackColor={theme.colors.surfaceHover}
          >
            <Zap color={theme.colors.cyan} size={22} strokeWidth={2} />
            <Text style={styles.heroValue}>{MOCK_STATS.streakDays}</Text>
            <Text style={styles.heroUnit}>ימים ברצף</Text>
          </ProgressRing>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ProgressRing
              size={84}
              strokeWidth={8}
              progress={MOCK_STATS.workouts / MOCK_STATS.workoutsGoal}
              color={theme.colors.magenta}
              trackColor={theme.colors.surfaceHover}
            >
              <Activity color={theme.colors.text} size={18} strokeWidth={2} />
              <Text style={styles.statValue}>{MOCK_STATS.workouts}</Text>
            </ProgressRing>
            <Text style={styles.statLabel}>אימונים החודש</Text>
          </View>

          <View style={styles.statCard}>
            <ProgressRing
              size={84}
              strokeWidth={8}
              progress={MOCK_STATS.partners / MOCK_STATS.partnersGoal}
              color={theme.colors.text}
              trackColor={theme.colors.surfaceHover}
            >
              <Users color={theme.colors.text} size={18} strokeWidth={2} />
              <Text style={styles.statValue}>{MOCK_STATS.partners}</Text>
            </ProgressRing>
            <Text style={styles.statLabel}>שותפים פעילים</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>היסטוריית אימונים</Text>
        {MOCK_HISTORY.map((item) => (
          <View key={item.id} style={styles.historyRow}>
            <View style={styles.historyIconWrap}>
              <Activity color={theme.colors.textSecondary} size={20} strokeWidth={2} />
            </View>
            <View style={styles.historyTextWrap}>
              <Text style={styles.historyTitle}>{item.title}</Text>
              <Text style={styles.historyDate}>{item.date}</Text>
            </View>
          </View>
        ))}

        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.colors.magenta} size={20} strokeWidth={2} />
          <Text style={styles.backButtonText}>חזרה</Text>
        </Pressable>
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
  title: {
    fontSize: 28,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    textAlign: 'right',
    marginBottom: theme.spacing.lg,
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  heroValue: {
    fontSize: 36,
    fontFamily: theme.typography.h1.fontFamily,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  heroUnit: {
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statValue: {
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.text,
    textAlign: 'right',
    marginBottom: theme.spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  historyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  historyTitle: {
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.text,
    textAlign: 'right',
  },
  historyDate: {
    fontSize: 12,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  backButton: {
    flexDirection: 'row',
    marginTop: theme.spacing.xl,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  backButtonText: {
    color: theme.colors.magenta,
    fontSize: 14,
    fontFamily: theme.typography.label.fontFamily,
  },
});
