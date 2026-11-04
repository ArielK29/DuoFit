import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, I18nManager } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { trackEvent } from '@lib/analytics';
import { theme } from '@styles/theme';
import { visualRightText } from '@lib/rtl';
import { useAuth, FitnessLevel, Gender } from '@hooks/useAuth';
import { checkText } from '@lib/contentFilter';
import { MAX_ACTIVITIES, PROFILE_ACTIVITIES, PROFILE_STEPS, stepProblem, toggleActivity } from '@lib/onboarding';

I18nManager.forceRTL(true);

const FITNESS_LEVELS: { value: FitnessLevel; label: string; hint: string }[] = [
  { value: 'Beginner', label: 'מתחיל', hint: 'רק מתחיל או חוזר לפעילות' },
  { value: 'Intermediate', label: 'בינוני', hint: 'מתאמן באופן קבוע' },
  { value: 'Advanced', label: 'מתקדם', hint: 'מתאמן הרבה ובעצימות גבוהה' },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'M', label: 'זכר' },
  { value: 'F', label: 'נקבה' },
  { value: 'Other', label: 'אחר' },
];

const TITLES = {
  gender: { title: 'מה המגדר שלך?', subtitle: 'כך נוכל להציע לך שותפים מתאימים' },
  activities: { title: 'באילו ספורטים אתה מחפש שותף?', subtitle: `אפשר לבחור עד ${MAX_ACTIVITIES}` },
  level: { title: 'מה הרמה שלך?', subtitle: 'נתאים לך שותפים ברמה דומה' },
} as const;

// The steps after sign-up. Each step asks one thing, and nothing is asked twice in the whole sign-up: the name was given at
// sign-up, the face photo is taken in the identity check at the end.
export const ProfileSetupScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuth((state) => state.user);
  const saveProfile = useAuth((state) => state.saveProfile);
  const signOut = useAuth((state) => state.signOut);
  const loading = useAuth((state) => state.isLoading);
  const storeError = useAuth((state) => state.error);

  const [stepIndex, setStepIndex] = useState(0);
  const [gender, setGender] = useState<Gender | null>(user?.gender ?? null);
  const [activities, setActivities] = useState<string[]>(user?.favoriteActivities ?? []);
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel | null>(user?.fitnessLevel ?? null);
  const [bio, setBio] = useState(user?.bio ?? '');
  const [localError, setError] = useState<string | null>(null);
  const error = localError ?? storeError;

  const step = PROFILE_STEPS[stepIndex];
  const isLast = stepIndex === PROFILE_STEPS.length - 1;

  const next = async () => {
    setError(null);
    const problem = stepProblem(step, { gender, activities, fitnessLevel });
    if (problem) {
      setError(problem);
      return;
    }
    if (!isLast) {
      setStepIndex(stepIndex + 1);
      return;
    }
    const verdict = checkText(bio);
    if (!verdict.ok) {
      setError(verdict.message);
      return;
    }
    const ok = await saveProfile({ bio, gender: gender ?? undefined, fitnessLevel: fitnessLevel ?? undefined, favoriteActivities: activities });
    if (ok) {
      trackEvent('profile_completed');
      router.replace('/');
    }
  };

  const back = () => {
    setError(null);
    setStepIndex(Math.max(0, stepIndex - 1));
  };

  const heading = TITLES[step];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          {stepIndex > 0 ? (
            <Pressable onPress={back} style={styles.backButton} accessibilityRole="button" accessibilityLabel="חזרה לשלב הקודם">
              <ArrowLeft color={theme.colors.magenta} size={20} strokeWidth={2} />
              <Text style={styles.backText}>חזרה</Text>
            </Pressable>
          ) : (
            <View />
          )}
          <Text style={styles.progress}>{`שלב ${stepIndex + 1} מתוך ${PROFILE_STEPS.length}`}</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{heading.title}</Text>
          <Text style={styles.subtitle}>{heading.subtitle}</Text>
        </View>

        {step === 'gender' && (
          <View style={styles.optionsColumn}>
            {GENDERS.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.bigOption, gender === option.value && styles.bigOptionActive]}
                onPress={() => {
                  setGender(option.value);
                  setError(null);
                }}
                disabled={loading}
                accessibilityRole="radio"
                aria-checked={gender === option.value}
              >
                <Text style={[styles.bigOptionText, gender === option.value && styles.bigOptionTextActive]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {step === 'activities' && (
          <>
            <View style={styles.activitiesGrid}>
              {PROFILE_ACTIVITIES.map((activity) => {
                const selected = activities.includes(activity);
                return (
                  <Pressable
                    key={activity}
                    style={[styles.activityChip, selected && styles.activityChipActive]}
                    onPress={() => {
                      setActivities(toggleActivity(activities, activity));
                      setError(null);
                    }}
                    disabled={loading}
                    accessibilityRole="checkbox"
                    aria-checked={selected}
                  >
                    <Text style={[styles.activityChipText, selected && styles.activityChipTextActive]}>{activity}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.counter}>{`${activities.length} מתוך ${MAX_ACTIVITIES} נבחרו`}</Text>
          </>
        )}

        {step === 'level' && (
          <>
            <View style={styles.optionsColumn}>
              {FITNESS_LEVELS.map((level) => (
                <Pressable
                  key={level.value}
                  style={[styles.bigOption, fitnessLevel === level.value && styles.bigOptionActive]}
                  onPress={() => {
                    setFitnessLevel(level.value);
                    setError(null);
                  }}
                  disabled={loading}
                  accessibilityRole="radio"
                  aria-checked={fitnessLevel === level.value}
                >
                  <Text style={[styles.bigOptionText, fitnessLevel === level.value && styles.bigOptionTextActive]}>{level.label}</Text>
                  <Text style={[styles.bigOptionHint, fitnessLevel === level.value && styles.bigOptionTextActive]}>{level.hint}</Text>
                </Pressable>
              ))}
            </View>
            <Input
              label="קצת עליי (אופציונלי)"
              placeholder="ספר לנו על עצמך..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              disabled={loading}
            />
          </>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonContainer}>
          <Button
            label={loading ? 'שומר...' : isLast ? 'סיום' : 'המשך'}
            variant="primary"
            size="lg"
            loading={loading}
            disabled={loading}
            onPress={next}
          />
        </View>

        <Pressable onPress={() => signOut()} style={styles.switchAccount} accessibilityRole="button">
          <Text style={styles.switchAccountText}>{`התחבר עם חשבון אחר (${user?.email ?? ''})`}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing.lg,
  },
  scrollContent: {
    paddingVertical: theme.spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minHeight: 48,
  },
  backText: {
    color: theme.colors.magenta,
    fontSize: 15,
    fontFamily: theme.typography.label.fontFamily,
  },
  progress: {
    color: theme.colors.textTertiary,
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    width: '100%',
    fontSize: 28,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    width: '100%',
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    ...visualRightText,
  },
  optionsColumn: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  bigOption: {
    minHeight: 64,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    gap: 2,
  },
  bigOptionActive: {
    backgroundColor: theme.colors.magenta,
    borderColor: theme.colors.magenta,
  },
  bigOptionText: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    ...visualRightText,
    width: '100%',
  },
  bigOptionHint: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontFamily: theme.typography.bodySmall.fontFamily,
    ...visualRightText,
    width: '100%',
  },
  bigOptionTextActive: {
    color: theme.colors.black,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  activityChip: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    minHeight: 48,
    justifyContent: 'center',
  },
  activityChipActive: {
    backgroundColor: theme.colors.cyan,
    borderColor: theme.colors.cyan,
  },
  activityChipText: {
    color: theme.colors.text,
    fontSize: 15,
    fontFamily: theme.typography.label.fontFamily,
  },
  activityChipTextActive: {
    color: theme.colors.black,
    fontFamily: theme.typography.labelBold.fontFamily,
  },
  counter: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontFamily: theme.typography.label.fontFamily,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
  },
  buttonContainer: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  switchAccount: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchAccountText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontFamily: theme.typography.label.fontFamily,
  },
});

export default ProfileSetupScreen;
