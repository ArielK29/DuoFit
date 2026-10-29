import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { theme } from '@styles/theme';
import { visualRightText } from '@lib/rtl';
import { pickImage } from '@lib/pickImage';
import { recordVerificationVideo, discardLocalFile, MAX_VIDEO_SECONDS, type VideoResult } from '@lib/takeVerificationVideo';
import { submitIdentityCheck } from '@lib/remoteIdentity';
import { trackEvent, logError } from '@lib/analytics';
import { MIN_AGE, formatBirthDate, isAdult, parseBirthDate, pickChallengeCode, pickGesture } from '@lib/identity';
import { useAuth, isVerified } from '@hooks/useAuth';

// The gate every member passes before using the app: an adult (18+) and a real person (a short live video with a random gesture).
// A reviewer compares the short video with the profile photo; only the profile photo and a "verified" badge are ever shown to others.
export const VerifyIdentityScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuth((state) => state.user);
  const saveProfile = useAuth((state) => state.saveProfile);
  const refreshVerification = useAuth((state) => state.refreshVerification);
  const signOut = useAuth((state) => state.signOut);

  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [gesture] = useState(() => pickGesture());
  const [code] = useState(() => pickChallengeCode());
  const [video, setVideo] = useState<Exclude<VideoResult, 'denied' | null> | undefined>(undefined);
  const [newAvatar, setNewAvatar] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraDenied, setCameraDenied] = useState(false);

  const status = user?.verification ?? 'none';
  const waiting = status === 'pending';
  const verified = isVerified(user);

  // Waiting for the decision: look again every 20 seconds. When approved, the app opens by itself.
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => {
      refreshVerification();
    }, 20000);
    return () => clearInterval(timer);
  }, [waiting, refreshVerification]);

  useEffect(() => {
    if (verified) router.replace('/discover');
  }, [verified, router]);

  const avatarUri = newAvatar ?? user?.avatar;

  const choosePhoto = async () => {
    setError(null);
    try {
      const uri = await pickImage('avatar', { square: true });
      if (uri) {
        discardLocalFile(newAvatar);
        setNewAvatar(uri);
      }
    } catch (err) {
      logError('verify_avatar_picker_failed', { error: String(err) });
      setError('לא הצלחנו לפתוח את גלריית התמונות');
    }
  };

  const record = async () => {
    setError(null);
    setCameraDenied(false);
    try {
      const result = await recordVerificationVideo();
      if (result === 'denied') {
        setCameraDenied(true);
        return;
      }
      if (result) {
        discardLocalFile(video?.uri);
        setVideo(result);
      }
    } catch (err) {
      logError('verify_video_failed', { error: String(err) });
      setError('לא הצלחנו לפתוח את המצלמה. נסה שוב');
    }
  };

  const submit = async () => {
    setError(null);
    if (!user) return;
    const birth = parseBirthDate(day, month, year);
    if (!birth) {
      setError('הזן תאריך לידה תקין: יום, חודש ושנה');
      return;
    }
    if (!isAdult(birth)) {
      setError(`האפליקציה מיועדת לבני ${MIN_AGE} ומעלה בלבד`);
      return;
    }
    if (!avatarUri) {
      setError('הוסף תמונת פרופיל עם הפנים שלך');
      return;
    }
    if (!video) {
      setError('הקלט סרטון קצר לפי ההוראות שעל המסך');
      return;
    }

    setBusy(true);
    try {
      if (newAvatar) {
        const saved = await saveProfile({ localAvatarUri: newAvatar });
        if (!saved) {
          setBusy(false);
          setError('לא הצלחנו לשמור את תמונת הפרופיל. נסה שוב');
          return;
        }
      }
      await submitIdentityCheck({
        userId: user.id,
        birthDate: formatBirthDate(birth),
        gesture: gesture.id,
        code,
        localVideoUri: video.uri,
        contentType: video.contentType,
        extension: video.extension,
      });
      trackEvent('identity_submitted');
      discardLocalFile(video.uri);
      setVideo(undefined);
      await refreshVerification();
    } catch (err) {
      logError('identity_submit_failed', { error: String(err) });
      const message = String((err as { message?: string })?.message ?? '');
      setError(message.includes('under_18') ? `האפליקציה מיועדת לבני ${MIN_AGE} ומעלה בלבד` : 'לא הצלחנו לשלוח. בדוק את החיבור ונסה שוב');
    } finally {
      setBusy(false);
    }
  };

  if (waiting) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.bigEmoji}>🕒</Text>
          <Text style={styles.centerTitle}>הבקשה שלך בבדיקה</Text>
          <Text style={styles.centerText}>
            כדי שכולם באפליקציה יוכלו לסמוך זה על זה, אנחנו בודקים כל חבר חדש. זה בדרך כלל לוקח עד יום, והאפליקציה תיפתח לבד כשתאושר.
          </Text>
          <View style={styles.buttons}>
            <Button label="בדוק עכשיו" variant="secondary" onPress={() => refreshVerification()} />
            <Button label="התנתקות" variant="secondary" onPress={() => signOut()} />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>עוד צעד אחד ואפשר להתחיל</Text>
        <Text style={styles.subtitle}>
          כדי שכולם יוכלו לסמוך זה על זה, כל חבר מאשר שהוא בגיר ושהוא אדם אמיתי. בלי השלב הזה לא ניתן להמשיך לשותפים ולשאר האפליקציה.
        </Text>

        {status === 'rejected' && (
          <View style={styles.rejectedCard}>
            <Text style={styles.rejectedTitle}>הבקשה הקודמת לא אושרה</Text>
            {user?.verificationRejectReason ? <Text style={styles.rejectedText}>{user.verificationRejectReason}</Text> : null}
            <Text style={styles.rejectedText}>אפשר לנסות שוב עם סרטון ברור ותמונת פרופיל עם הפנים שלך.</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>1. תאריך לידה</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Input placeholder="יום" value={day} onChangeText={setDay} keyboardType="number-pad" maxLength={2} disabled={busy} />
          </View>
          <View style={styles.dateField}>
            <Input placeholder="חודש" value={month} onChangeText={setMonth} keyboardType="number-pad" maxLength={2} disabled={busy} />
          </View>
          <View style={styles.dateFieldWide}>
            <Input placeholder="שנה" value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} disabled={busy} />
          </View>
        </View>
        <Text style={styles.helper}>האפליקציה מיועדת לבני {MIN_AGE} ומעלה. תאריך הלידה לא מוצג לאף אחד.</Text>

        <Text style={styles.sectionLabel}>2. תמונת פרופיל עם הפנים שלך</Text>
        <View style={styles.photoRow}>
          <Pressable style={styles.avatarWrapper} onPress={choosePhoto} disabled={busy} accessibilityLabel="בחר תמונת פרופיל">
            {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.photo} contentFit="cover" /> : <Text style={styles.photoPlaceholder}>📷</Text>}
          </Pressable>
          <Text style={styles.helperBeside}>זו התמונה שאחרים יראו. כדי שיהיה קל לזהות אותך בפגישה, בחר תמונה ברורה עם הפנים.</Text>
        </View>

        <Text style={styles.sectionLabel}>3. סרטון קצר מהמצלמה</Text>
        <View style={styles.gestureCard}>
          <Text style={styles.gestureEmoji}>{gesture.emoji}</Text>
          <Text style={styles.gestureText}>
            הקלט {MAX_VIDEO_SECONDS} שניות: הסתכל למצלמה, הפנה את הראש לאט ימינה ואז שמאלה, ואז עשה: {gesture.label}
          </Text>
          <Text style={styles.codeLabel}>ותגיד בקול את המספר:</Text>
          <Text style={styles.code}>{code}</Text>
        </View>
        {video ? <Text style={styles.videoReady}>✓ הסרטון נשמר ומוכן לשליחה</Text> : null}
        <Button label={video ? 'הקלט מחדש' : 'פתח מצלמה'} variant="secondary" onPress={record} disabled={busy} />
        {cameraDenied ? (
          <Text style={styles.errorText}>אין הרשאה למצלמה או למיקרופון. אפשר לאשר אותן בהגדרות הטלפון, תחת FitFriend.</Text>
        ) : null}
        <Text style={styles.helper}>
          הסרטון (כולל הקול) מוצג רק לצוות הבדיקה, לא לחברים אחרים, ונמחק מיד אחרי ההחלטה. אחרים יראו רק את תמונת הפרופיל ותג "מאומת".
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.buttons}>
          <Button label="שלח לבדיקה" onPress={submit} loading={busy} disabled={busy} />
          <Button label="התנתקות" variant="secondary" onPress={() => signOut()} disabled={busy} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: theme.spacing.lg },
  scrollContent: { paddingVertical: theme.spacing.xl },
  title: {
    width: '100%',
    fontSize: 26,
    fontWeight: 'normal',
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    width: '100%',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    ...visualRightText,
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    width: '100%',
    fontSize: 15,
    fontWeight: 'normal',
    fontFamily: theme.typography.labelBold.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  helper: {
    width: '100%',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
    ...visualRightText,
    marginTop: theme.spacing.sm,
  },
  helperBeside: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
    ...visualRightText,
  },
  dateRow: { flexDirection: 'row', gap: theme.spacing.sm },
  // minWidth 0 so the text boxes shrink to their share of the row instead of keeping their default width
  dateField: { flex: 1, minWidth: 0 },
  dateFieldWide: { flex: 1.5, minWidth: 0 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
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
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { fontSize: 32 },
  gestureCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.cyan,
  },
  gestureEmoji: { fontSize: 56 },
  gestureText: {
    fontSize: 16,
    fontFamily: theme.typography.labelBold.fontFamily,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  codeLabel: {
    fontSize: 14,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  code: {
    fontSize: 40,
    letterSpacing: 8,
    fontFamily: theme.typography.labelBold.fontFamily,
    color: theme.colors.cyan,
    textAlign: 'center',
  },
  videoReady: {
    color: theme.colors.cyan,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: theme.typography.labelBold.fontFamily,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
  },
  buttons: { gap: theme.spacing.sm, marginTop: theme.spacing.xl },
  rejectedCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    gap: theme.spacing.xs,
  },
  rejectedTitle: {
    fontSize: 15,
    fontFamily: theme.typography.labelBold.fontFamily,
    color: theme.colors.error,
    ...visualRightText,
    width: '100%',
  },
  rejectedText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    ...visualRightText,
    width: '100%',
  },
  bigEmoji: { fontSize: 64, textAlign: 'center', marginTop: theme.spacing.xl },
  centerTitle: {
    fontSize: 24,
    fontFamily: theme.typography.h2.fontFamily,
    fontWeight: 'normal',
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  centerText: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
