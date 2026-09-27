import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
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
            <Text style={styles.statValue}>{MOCK_STATS.totalWorkouts}</Text>
            <Text style={styles.statLabel}>אימונים</Text>
          </View>
          <View style={[styles.statCard, styles.streakCard]}>
            <Text style={[styles.statValue, styles.streakValue]}>{MOCK_STATS.activeStreak} 🔥</Text>
            <Text style={styles.statLabel}>רצף פעיל</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{MOCK_STATS.partnersMatched}</Text>
            <Text style={styles.statLabel}>שותפים</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>היסטוריית אימונים</Text>
        {MOCK_HISTORY.map((item) => (
          <View key={item.id} style={styles.historyRow}>
            <Text style={styles.historyTitle}>{item.title}</Text>
            <Text style={styles.historyDate}>{item.date}</Text>
          </View>
        ))}

        <Pressable onPress={() => router.back()} style={styles.backButton}>
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
  },
  streakCard: {
    borderWidth: 1,
    borderColor: theme.colors.cyan,
  },
  statValue: {
    fontSize: 24,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
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
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  historyTitle: {
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.text,
  },
  historyDate: {
    fontSize: 12,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textTertiary,
  },
  backButton: {
    marginTop: theme.spacing.xl,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.magenta,
    fontSize: 14,
    fontFamily: theme.typography.label.fontFamily,
  },
});
