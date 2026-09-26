import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  I18nManager,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { trackEvent, logError } from '@lib/analytics';
import { theme } from '@styles/theme';
import { useAuth, User } from '@hooks/useAuth';

I18nManager.forceRTL(true);

type FitnessLevel = 'Beginner' | 'Intermediate' | 'Advanced';
type Gender = 'M' | 'F' | 'Other';

const FITNESS_LEVELS: { value: FitnessLevel; label: string }[] = [
  { value: 'Beginner', label: 'מתחיל' },
  { value: 'Intermediate', label: 'בינוני' },
  { value: 'Advanced', label: 'מתקדם' },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'M', label: 'זכר' },
  { value: 'F', label: 'נקבה' },
  { value: 'Other', label: 'אחר' },
];

const ACTIVITIES = [
  'ריצה', 'כושר גופני', 'יוגה', 'רכיבה על אופניים', 'שחייה', 'כדורגל',
];

export const ProfileSetupScreen: React.FC = () => {
  const router = useRouter();
  const { phoneNumber = '' } = useLocalSearchParams<'/profile-setup', { phoneNumber: string }>();
  const setUser = useAuth((state) => state.setUser);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel | null>(null);
  const [activities, setActivities] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleActivity = (activity: string) => {
    setActivities((prev) =>
      prev.includes(activity)
        ? prev.filter((a) => a !== activity)
        : [...prev, activity]
    );
  };

  const pickAvatar = async () => {
    setError(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('נדרשת הרשאת גישה לתמונות כדי לבחור תמונת פרופיל');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        // expo-image-picker's uri points to a transient OS cache location that
        // isn't guaranteed to survive app restarts or cache eviction — copy it
        // into the app's document directory before persisting it via useAuth.
        const picked = new File(result.assets[0].uri);
        const destination = new File(Paths.document, `avatar-${Date.now()}${picked.extension}`);
        await picked.copy(destination);

        // Drop the previous copy so re-picking a few times before submitting
        // doesn't leave orphaned files behind in the document directory.
        if (avatar) {
          try {
            new File(avatar).delete();
          } catch {
            // Best-effort cleanup — a missing/already-deleted file isn't fatal.
          }
        }

        setAvatar(destination.uri);
      }
    } catch (err) {
      logError('avatar_picker_failed', { error: String(err) });
      setError('לא הצלחנו לפתוח את גלריית התמונות');
    }
  };

  const handleSubmit = () => {
    setError(null);

    if (!phoneNumber) {
      // Defensive guard, not a user-facing validation: the user never types a
      // phone number on this screen, so this should never happen now that
      // this route always receives it as a param from the OTP-verification
      // step. If it's ever missing, don't persist a User with no identity —
      // bounce back to Login instead.
      router.replace('/login');
      return;
    }

    if (!name.trim()) {
      setError('הזן שם מלא');
      return;
    }
    if (!gender) {
      setError('בחר מגדר');
      return;
    }
    if (!fitnessLevel) {
      setError('בחר רמת כושר');
      return;
    }
    if (activities.length === 0) {
      setError('בחר לפחות פעילות אחת');
      return;
    }

    setLoading(true);

    // Simulate API call — persistence happens locally via useAuth (zustand + AsyncStorage).
    // Real backend sync is tracked separately (out of scope here).
    setTimeout(() => {
      setLoading(false);

      const user: User = {
        id: `local-${Date.now()}`,
        phoneNumber,
        name: name.trim(),
        bio: bio.trim() || undefined,
        avatar,
        gender,
        fitnessLevel,
        favoriteActivities: activities,
        createdAt: new Date().toISOString(),
      };

      setUser(user);
      trackEvent('profile_completed');

      router.replace('/discover');
    }, 1000);
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
    header: {
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: 28,
      fontWeight: 'normal',
      fontFamily: theme.typography.h2.fontFamily,
      color: theme.colors.text,
      textAlign: 'right',
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: theme.typography.bodySmall.fontFamily,
      color: theme.colors.textSecondary,
      textAlign: 'right',
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: 'normal',
      fontFamily: theme.typography.label.fontFamily,
      color: theme.colors.text,
      textAlign: 'right',
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    avatarWrapper: {
      width: 96,
      height: 96,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.surfaceHover,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarPlaceholder: {
      fontSize: 32,
    },
    avatarHint: {
      color: theme.colors.textTertiary,
      fontSize: 12,
      fontFamily: theme.typography.label.fontFamily,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    genderRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    levelRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    levelChip: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.surfaceHover,
      alignItems: 'center',
      minHeight: 48,
      justifyContent: 'center',
    },
    levelChipActive: {
      backgroundColor: theme.colors.magenta,
      borderColor: theme.colors.magenta,
    },
    levelChipText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: 'normal',
      fontFamily: theme.typography.label.fontFamily,
    },
    levelChipTextActive: {
      color: theme.colors.black,
      fontWeight: 'normal',
      fontFamily: theme.typography.labelBold.fontFamily,
    },
    activitiesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
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
      fontSize: 14,
      fontFamily: theme.typography.label.fontFamily,
    },
    activityChipTextActive: {
      color: theme.colors.black,
      fontWeight: 'normal',
      fontFamily: theme.typography.labelBold.fontFamily,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginVertical: theme.spacing.md,
      fontSize: 14,
      fontFamily: theme.typography.bodySmall.fontFamily,
    },
    buttonContainer: {
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.xl,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>בואו נכיר אותך</Text>
          <Text style={styles.subtitle}>מלא את הפרופיל שלך כדי למצוא שותפים מתאימים</Text>
        </View>

        <View style={styles.avatarSection}>
          <Pressable style={styles.avatarWrapper} onPress={pickAvatar} disabled={loading}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text style={styles.avatarPlaceholder}>📷</Text>
            )}
          </Pressable>
          <Text style={styles.avatarHint}>הוסף תמונת פרופיל (אופציונלי)</Text>
        </View>

        <Input
          label="שם מלא"
          placeholder="הזן את שמך"
          value={name}
          onChangeText={setName}
          disabled={loading}
        />

        <Input
          label="קצת עליי (אופציונלי)"
          placeholder="ספר לנו על עצמך..."
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
          disabled={loading}
        />

        <Text style={styles.sectionLabel}>מגדר</Text>
        <View style={styles.genderRow}>
          {GENDERS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.levelChip,
                gender === option.value && styles.levelChipActive,
              ]}
              onPress={() => setGender(option.value)}
              disabled={loading}
            >
              <Text
                style={[
                  styles.levelChipText,
                  gender === option.value && styles.levelChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>רמת כושר</Text>
        <View style={styles.levelRow}>
          {FITNESS_LEVELS.map((level) => (
            <Pressable
              key={level.value}
              style={[
                styles.levelChip,
                fitnessLevel === level.value && styles.levelChipActive,
              ]}
              onPress={() => setFitnessLevel(level.value)}
              disabled={loading}
            >
              <Text
                style={[
                  styles.levelChipText,
                  fitnessLevel === level.value && styles.levelChipTextActive,
                ]}
              >
                {level.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>פעילויות מועדפות</Text>
        <View style={styles.activitiesGrid}>
          {ACTIVITIES.map((activity) => (
            <Pressable
              key={activity}
              style={[
                styles.activityChip,
                activities.includes(activity) && styles.activityChipActive,
              ]}
              onPress={() => toggleActivity(activity)}
              disabled={loading}
            >
              <Text
                style={[
                  styles.activityChipText,
                  activities.includes(activity) && styles.activityChipTextActive,
                ]}
              >
                {activity}
              </Text>
            </Pressable>
          ))}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonContainer}>
          <Button
            label={loading ? 'שומר...' : 'המשך'}
            variant="primary"
            size="lg"
            loading={loading}
            disabled={loading}
            onPress={handleSubmit}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileSetupScreen;
