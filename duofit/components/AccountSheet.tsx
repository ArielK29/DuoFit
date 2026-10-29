import React, { useEffect, useState } from 'react';
import { View, Text, Alert, Platform, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { File } from 'expo-file-system';
import { useRouter } from 'expo-router';
import { BottomSheet } from '@components/BottomSheet';
import { Button } from '@components/Button';
import { useAccountSheet } from '@hooks/useAccountSheet';
import { useAuth } from '@hooks/useAuth';
import { useFeedStore } from '@hooks/useFeedStore';
import { logError } from '@lib/analytics';
import { DEMO_DATA } from '@lib/demo';
import { pickImage } from '@lib/pickImage';
import { visualRightText } from '@lib/rtl';
import { theme } from '@styles/theme';

// "My account": who is signed in, and the real sign-out.
export const AccountSheet: React.FC = () => {
  const router = useRouter();
  const visible = useAccountSheet((state) => state.visible);
  const close = useAccountSheet((state) => state.close);
  const user = useAuth((state) => state.user);
  const signOut = useAuth((state) => state.signOut);
  const deleteAccount = useAuth((state) => state.deleteAccount);
  const saveProfile = useAuth((state) => state.saveProfile);
  const refreshVerification = useAuth((state) => state.refreshVerification);
  const setAuthError = useAuth((state) => state.setError);
  const isLoading = useAuth((state) => state.isLoading);
  const error = useAuth((state) => state.error);
  const blocked = useFeedStore((state) => state.blocked);
  const unblock = useFeedStore((state) => state.unblock);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // The list of blocked members is loaded with the community feed; make sure it is there.
  useEffect(() => {
    if (visible && !DEMO_DATA && !useFeedStore.getState().loaded) useFeedStore.getState().load();
  }, [visible]);

  // The terms and privacy text stays one tap from the account sheet, as the stores require.
  const openTerms = () => {
    close();
    router.push('/terms');
  };

  const openAdminReview = () => {
    close();
    router.push('/admin-review');
  };

  const handleSignOut = async () => {
    close();
    await signOut();
  };

  // Replace the profile photo of a signed-in member: pick a square crop, upload it, save it.
  // The badge belongs to the face that was checked, so a new photo means a new check: ask first.
  const startChangePhoto = () => {
    const title = 'להחליף תמונת פרופיל?';
    const message = 'תמונה חדשה מחייבת אימות מחדש עם סלפי, ועד שיאשרו אותה לא תוכל להשתמש באפליקציה.';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${title}

${message}`)) changePhoto();
      return;
    }
    Alert.alert(title, message, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'המשך', onPress: changePhoto },
    ]);
  };

  const changePhoto = async () => {
    setPhotoError(null);
    let uri: string | null = null;
    try {
      uri = await pickImage('avatar', { square: true });
      if (!uri) return;
      setPhotoBusy(true);
      const saved = await saveProfile({ localAvatarUri: uri });
      if (!saved) {
        setAuthError(null); // the message below is shown instead of the store's one
        setPhotoError('לא הצלחנו לשמור את התמונה. נסה שוב');
      } else {
        // A new profile photo needs a new identity check (the server sets the member back to the gate); pick that up now.
        await refreshVerification();
        close();
      }
    } catch (err) {
      logError('avatar_change_failed', { error: String(err) });
      setPhotoError('לא הצלחנו לפתוח את גלריית התמונות');
    } finally {
      setPhotoBusy(false);
      // The upload has its own copy; drop the temporary one from the document folder.
      if (uri && Platform.OS !== 'web') {
        try {
          new File(uri).delete();
        } catch {
          // Best-effort cleanup: a missing file is not fatal.
        }
      }
    }
  };

  const runDelete = async () => {
    const deleted = await deleteAccount();
    if (deleted) close();
  };

  // Two steps on purpose: deleting is permanent.
  const confirmDelete = () => {
    const title = 'למחוק את החשבון?';
    const message =
      'המחיקה סופית ואי אפשר לשחזר אותה. יימחקו הפרופיל, התמונה, ההתקדמות וכל השיחות שלך, גם אצל השותפים.';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) runDelete();
      return;
    }
    Alert.alert(title, message, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק לצמיתות', style: 'destructive', onPress: runDelete },
    ]);
  };

  return (
    <BottomSheet visible={visible} title="החשבון שלי" onClose={close}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <Text style={styles.avatarInitial}>{user?.name?.[0] ?? '?'}</Text>
          )}
        </View>
        <View style={styles.text}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>
      {!DEMO_DATA && (
        <View style={styles.photoWrap}>
          <Button
            label="החלף תמונת פרופיל"
            variant="secondary"
            size="lg"
            loading={photoBusy}
            disabled={photoBusy || isLoading}
            onPress={startChangePhoto}
          />
          {!!photoError && <Text style={styles.error}>{photoError}</Text>}
        </View>
      )}
      <Text style={styles.note}>הנתונים שלך שמורים בחשבון הזה. כשתתנתק, הנתונים המקומיים במכשיר יימחקו.</Text>
      <View style={styles.buttons}>
        {user?.isAdmin && <Button label="בדיקות אימות (מנהל)" variant="secondary" size="lg" onPress={openAdminReview} />}
        <Button label="תנאי שימוש ופרטיות" variant="secondary" size="lg" onPress={openTerms} />
        <Button label="התנתק" variant="secondary" size="lg" onPress={handleSignOut} />
      </View>
      {!DEMO_DATA && blocked.length > 0 && (
        <View style={styles.blockedWrap}>
          <Text style={styles.blockedTitle}>חברים חסומים</Text>
          {blocked.map((member) => (
            <View key={member.id} style={styles.blockedRow}>
              <Button label="בטל חסימה" variant="secondary" size="md" onPress={() => unblock(member.id)} />
              <Text style={styles.blockedName}>{member.name}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.deleteWrap}>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Button label="מחק את החשבון שלי" variant="danger" size="lg" loading={isLoading} disabled={isLoading} onPress={confirmDelete} />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  buttons: {
    gap: theme.spacing.sm,
  },
  photoWrap: {
    marginBottom: theme.spacing.lg,
  },
  blockedWrap: {
    marginTop: theme.spacing.xl,
  },
  blockedTitle: {
    width: '100%',
    fontSize: 16,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    ...visualRightText,
  },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  blockedName: {
    flex: 1,
    fontSize: 15,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    ...visualRightText,
  },
  deleteWrap: {
    marginTop: theme.spacing.xl,
  },
  error: {
    color: theme.colors.error,
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 26,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
  },
  text: {
    flex: 1,
    alignItems: 'flex-end',
  },
  name: {
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
  },
  email: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
  },
  note: {
    width: '100%',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.lg,
    ...visualRightText,
  },
});
