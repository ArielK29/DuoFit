import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, ArrowLeft, Users, Zap } from 'lucide-react-native';
import { theme } from '@styles/theme';

// Static placeholder data. This screen is a visual mockup only (per issue #2)
// — there is no backend yet (#15) and no completed check-ins to show real
// numbers for, so every value here is an example, not live data.
const MOCK_STATS = {
  totalWorkouts: 12,
  activeStreak: 4,
  partnersMatched: 3,
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

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Activity color={theme.colors.text} size={24} strokeWidth={2} />
            <Text style={styles.statValue}>{MOCK_STATS.totalWorkouts}</Text>
            <Text style={styles.statLabel}>אימונים</Text>
          </View>
          <View style={[styles.statCard, styles.streakCard]}>
            <Zap color={theme.colors.cyan} size={24} strokeWidth={2} />
            <Text style={[styles.statValue, styles.streakValue]}>{MOCK_STATS.activeStreak}</Text>
            <Text style={styles.statLabel}>רצף פעיל</Text>
          </View>
          <View style={styles.statCard}>
            <Users color={theme.colors.text} size={24} strokeWidth={2} />
            <Text style={styles.statValue}>{MOCK_STATS.partnersMatched}</Text>
            <Text style={styles.statLabel}>שותפים</Text>
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
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  streakCard: {
    borderWidth: 1,
    borderColor: theme.colors.cyan,
  },
  statValue: {
    fontSize: 24,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
  },
  streakValue: {
    color: theme.colors.cyan,
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
