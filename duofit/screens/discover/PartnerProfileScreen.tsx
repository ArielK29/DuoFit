import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, BadgeCheck, MapPin, ShieldCheck, Star } from 'lucide-react-native';
import { Button } from '@components/Button';
import { useChatStore } from '@hooks/useChatStore';
import { Partner, findPartnerById } from '@hooks/usePartnerMatching';
import { getActivityStyle } from '@lib/activityStyles';
import { theme } from '@styles/theme';
import { visualRightText } from '@lib/rtl';

const WEEKDAY_LETTERS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
const LEVEL_LABELS: Record<Partner['fitnessLevel'], string> = {
  Beginner: 'מתחיל',
  Intermediate: 'בינוני',
  Advanced: 'מתקדם',
};

export function PartnerProfileScreen() {
  const router = useRouter();
  const { partnerId = '', distanceKm = '' } = useLocalSearchParams<
    '/partner-profile',
    { partnerId: string; distanceKm: string }
  >();
  const ensureConversation = useChatStore((state) => state.ensureConversation);
  const partner = findPartnerById(partnerId);

  if (!partner) {
    return (
      <View style={styles.container}>
        <Text style={styles.missingText}>השותף/ה לא נמצא/ה</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button">
          <ArrowLeft color={theme.colors.magenta} size={20} strokeWidth={2} />
          <Text style={styles.backButtonText}>חזרה</Text>
        </Pressable>
      </View>
    );
  }

  const invite = () =>
    router.push({
      pathname: '/schedule-workout',
      params: { partnerId: partner.id, partnerName: partner.name, activity: partner.activities[0] ?? 'אימון משותף' },
    });

  const message = () => {
    ensureConversation(partner.id, partner.name);
    router.push({ pathname: '/conversation', params: { partnerId: partner.id, partnerName: partner.name } });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="חזרה">
          <ArrowLeft color={theme.colors.magenta} size={20} strokeWidth={2} />
          <Text style={styles.backButtonText}>חזרה</Text>
        </Pressable>

        <LinearGradient
          colors={[theme.colors.magenta, theme.colors.cyan]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.initial}>{partner.name[0]}</Text>
        </LinearGradient>

        <View style={styles.nameRow}>
          <Text style={styles.name}>{`${partner.name}, ${partner.age}`}</Text>
          {partner.verified && <BadgeCheck color={theme.colors.cyan} size={24} strokeWidth={2} />}
        </View>
        {!!distanceKm && (
          <View style={styles.distanceRow}>
            <MapPin color={theme.colors.textSecondary} size={16} strokeWidth={2} />
            <Text style={styles.distanceText}>{`${distanceKm} ק"מ ממך`}</Text>
          </View>
        )}
        <View style={styles.ratingPill}>
          <Star color={theme.colors.warning} size={14} strokeWidth={2} fill={theme.colors.warning} />
          <Text style={styles.ratingText}>{`${partner.rating.toFixed(1)} · ${partner.sessions} אימונים משותפים`}</Text>
        </View>
        <Text style={styles.exampleNote}>תצוגה מקדימה: דירוג ואימות לדוגמה</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>קצת עליי</Text>
          <Text style={styles.cardText}>{partner.bio}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{`זמינות · ${partner.availableFrom}–${partner.availableTo}`}</Text>
          <View style={styles.daysRow}>
            {WEEKDAY_LETTERS.map((letter, index) => {
              const available = partner.availableDays.includes(index);
              return (
                <View key={letter} style={[styles.dayChip, available && styles.dayChipActive]}>
                  <Text style={[styles.dayText, available && styles.dayTextActive]}>{letter}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>רמת כושר</Text>
          <Text style={styles.cardText}>{LEVEL_LABELS[partner.fitnessLevel]}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>פעילויות מועדפות</Text>
          <View style={styles.tagsRow}>
            {partner.activities.map((activity) => {
              const { icon: ActivityIcon, color } = getActivityStyle(activity);
              return (
                <View key={activity} style={styles.tag}>
                  <ActivityIcon color={color} size={16} strokeWidth={2} />
                  <Text style={styles.tagText}>{activity}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {partner.verified && (
          <View style={styles.verifiedBanner}>
            <ShieldCheck color={theme.colors.cyan} size={20} strokeWidth={2} />
            <Text style={styles.verifiedText}>{'טלפון ות״ז מאומתים (לדוגמה)'}</Text>
          </View>
        )}

        <View style={styles.ctaWrapper}>
          <Button label="הזמן לאימון" variant="primary" size="lg" onPress={invite} />
          <Button label="שלח הודעה" variant="secondary" size="lg" onPress={message} />
        </View>
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
    alignItems: 'center',
  },
  missingText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontFamily: theme.typography.body.fontFamily,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
  backButton: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    minHeight: 48,
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  backButtonText: {
    color: theme.colors.magenta,
    fontSize: 15,
    fontFamily: theme.typography.label.fontFamily,
  },
  hero: {
    width: '100%',
    height: 190,
    borderRadius: theme.borderRadius.xl * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  distanceText: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
  },
  initial: {
    fontSize: 88,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  name: {
    fontSize: 28,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  ratingText: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
  },
  exampleNote: {
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.xl * 1.5,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  cardLabel: {
    width: '100%',
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
    ...visualRightText,
    marginBottom: theme.spacing.sm,
  },
  cardText: {
    width: '100%',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
  },
  daysRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  dayChip: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.md,
  },
  dayChipActive: {
    backgroundColor: theme.colors.cyan,
  },
  dayText: {
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
  },
  dayTextActive: {
    color: theme.colors.black,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minHeight: 40,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
  },
  tagText: {
    fontSize: 14,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.text,
  },
  verifiedBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  verifiedText: {
    flex: 1,
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.cyan,
    ...visualRightText,
  },
  ctaWrapper: {
    width: '100%',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
});
