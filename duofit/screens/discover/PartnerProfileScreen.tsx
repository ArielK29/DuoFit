import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Dumbbell } from 'lucide-react-native';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { findPartnerById } from '@hooks/usePartnerMatching';
import { theme } from '@styles/theme';

export function PartnerProfileScreen() {
  const router = useRouter();
  const { partnerId = '', distanceKm = '' } = useLocalSearchParams<
    '/partner-profile',
    { partnerId: string; distanceKm: string }
  >();
  const partner = findPartnerById(partnerId);

  if (!partner) {
    return (
      <View style={styles.container}>
        <Text style={styles.missingText}>השותף/ה לא נמצא/ה</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.colors.magenta} size={20} strokeWidth={2} />
          <Text style={styles.backButtonText}>חזרה</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.colors.magenta} size={20} strokeWidth={2} />
          <Text style={styles.backButtonText}>חזרה</Text>
        </Pressable>

        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{partner.name[0]}</Text>
        </View>
        <Text style={styles.name}>
          {partner.name}, {partner.age}
        </Text>
        {!!distanceKm && (
          <View style={styles.distanceRow}>
            <MapPin color={theme.colors.textTertiary} size={16} strokeWidth={2} />
            <Text style={styles.distanceText}>{distanceKm} ק"מ ממך</Text>
          </View>
        )}

        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>קצת עליי</Text>
          <Text style={styles.bio}>{partner.bio}</Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>רמת כושר</Text>
          <Text style={styles.bio}>{partner.fitnessLevel}</Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>פעילויות מועדפות</Text>
          <View style={styles.tagsRow}>
            {partner.activities.map((activity) => (
              <View key={activity} style={styles.tag}>
                <Dumbbell color={theme.colors.cyan} size={16} strokeWidth={2} />
                <Text style={styles.tagText}>{activity}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={styles.ctaWrapper}>
          <Button label="מעניין אותי" variant="primary" size="lg" onPress={() => router.back()} />
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
    marginBottom: theme.spacing.lg,
  },
  backButtonText: {
    color: theme.colors.magenta,
    fontSize: 14,
    fontFamily: theme.typography.label.fontFamily,
  },
  avatarCircle: {
    width: 112,
    height: 112,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatarInitial: {
    fontSize: 40,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.cyan,
  },
  name: {
    fontSize: 24,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  distanceText: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textTertiary,
  },
  section: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    width: '100%',
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.sm,
  },
  bio: {
    width: '100%',
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
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
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  tagText: {
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.text,
  },
  ctaWrapper: {
    width: '100%',
    marginTop: theme.spacing.lg,
  },
});
