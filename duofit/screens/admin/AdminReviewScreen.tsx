import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from '@components/Button';
import { theme } from '@styles/theme';
import { visualRightText } from '@lib/rtl';
import { gestureById, ageOn } from '@lib/identity';
import { decideCheck, listPendingChecks, videoUrl, type PendingCheck } from '@lib/remoteIdentity';
import { useAuth } from '@hooks/useAuth';

// Reasons the reviewer can pick; the text is shown to the member so he knows what to fix.
const REJECT_REASONS = [
  'הסרטון לא ברור. צלם באור טוב ובמבט ישר למצלמה',
  'התנועה שביקשנו לא מופיעה בסרטון',
  'הפנים בסרטון לא תואמות לתמונת הפרופיל',
  'תמונת הפרופיל לא מציגה פנים ברורות',
  'לא נשמע המספר שביקשנו בסרטון',
  'לא הצלחנו לאמת שהגיל מעל 18',
];

// Only for admins (the server also returns nothing to anybody else): look at who is waiting, approve or reject.
export const AdminReviewScreen: React.FC = () => {
  const router = useRouter();
  const isAdmin = useAuth((state) => state.user?.isAdmin ?? false);
  const [items, setItems] = useState<PendingCheck[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await listPendingChecks();
    setFailed(list === null);
    setItems(list ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>אין לך הרשאה למסך הזה</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="חזרה" style={styles.back}>
          <Text style={styles.backText}>חזרה</Text>
        </Pressable>
        <Text style={styles.title}>בדיקות אימות</Text>
        <Text style={styles.subtitle}>לכל חבר חדש: האם תמונת הפרופיל והסרטון הם אותו אדם, התנועה תואמת, והוא נראה בגיר.</Text>

        {loading ? <ActivityIndicator color={theme.colors.cyan} style={styles.spinner} /> : null}
        {failed ? <Text style={styles.empty}>לא הצלחנו לטעון. נסה שוב</Text> : null}
        {!loading && !failed && items && items.length === 0 ? <Text style={styles.empty}>אין בקשות שממתינות 🎉</Text> : null}

        {(items ?? []).map((item) => (
          <CheckCard
            key={item.userId}
            item={item}
            onDone={() => setItems((prev) => (prev ?? []).filter((x) => x.userId !== item.userId))}
          />
        ))}
        {!loading ? <Button label="רענן" variant="secondary" onPress={load} /> : null}
      </ScrollView>
    </View>
  );
};

const CheckCard: React.FC<{ item: PendingCheck; onDone: () => void }> = ({ item, onDone }) => {
  const [video, setVideo] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  // The admin must open the video before approving.
  const [watched, setWatched] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!item.videoPath) {
      setMissing(true);
      return;
    }
    videoUrl(item.videoPath).then((url) => {
      if (!alive) return;
      if (url) setVideo(url);
      else setMissing(true);
    });
    return () => {
      alive = false;
    };
  }, [item.videoPath]);

  const watch = () => {
    if (!video) return;
    setWatched(true);
    Linking.openURL(video);
  };

  const gesture = gestureById(item.gesture);
  const [y, m, d] = item.birthDate.split('-').map(Number);
  const age = ageOn(new Date(y, m - 1, d), new Date());

  const decide = async (status: 'approved' | 'rejected', reason?: string) => {
    setBusy(true);
    setError(null);
    const ok = await decideCheck(item, status, reason);
    setBusy(false);
    if (ok) onDone();
    else setError('לא הצלחנו לשמור את ההחלטה. נסה שוב');
  };

  return (
    <View style={styles.card}>
      <Text style={styles.name}>
        {item.name || 'ללא שם'}, בן/בת {age}
      </Text>
      <Text style={styles.meta}>
        התנועה שהתבקשה: {gesture ? `${gesture.emoji} ${gesture.label}` : item.gesture}
      </Text>
      <Text style={styles.meta}>המספר שהיה צריך להישמע בסרטון: {item.code}</Text>
      <View style={styles.photos}>
        <View style={styles.photoBox}>
          <Text style={styles.photoLabel}>תמונת פרופיל</Text>
          {item.avatarUrl ? <Image source={{ uri: item.avatarUrl }} style={styles.photo} contentFit="cover" /> : <View style={[styles.photo, styles.noPhoto]} />}
        </View>
        <View style={styles.photoBox}>
          <Text style={styles.photoLabel}>סרטון</Text>
          <View style={[styles.photo, styles.noPhoto]}>
            {video ? (
              <Button label={watched ? 'צפה שוב' : 'צפה בסרטון'} variant="secondary" size="sm" onPress={watch} />
            ) : missing ? (
              <Text style={styles.meta}>אין קובץ</Text>
            ) : (
              <ActivityIndicator color={theme.colors.cyan} />
            )}
          </View>
        </View>
      </View>

      {rejecting ? (
        <View style={styles.reasons}>
          <Text style={styles.photoLabel}>בחר סיבה (המשתמש יראה אותה):</Text>
          {REJECT_REASONS.map((reason) => (
            <Pressable key={reason} style={styles.reasonChip} disabled={busy} onPress={() => decide('rejected', reason)} accessibilityRole="button">
              <Text style={styles.reasonText}>{reason}</Text>
            </Pressable>
          ))}
          <Button label="ביטול" variant="secondary" onPress={() => setRejecting(false)} disabled={busy} />
        </View>
      ) : (
        <View style={styles.actions}>
          <View style={styles.actionButton}>
            <Button label="אשר" onPress={() => decide('approved')} loading={busy} disabled={busy || missing || !watched} />
          </View>
          <View style={styles.actionButton}>
            <Button label="דחה" variant="danger" onPress={() => setRejecting(true)} disabled={busy} />
          </View>
        </View>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: theme.spacing.lg },
  scrollContent: { paddingVertical: theme.spacing.xl, gap: theme.spacing.md },
  back: { minHeight: 48, justifyContent: 'center' },
  backText: { color: theme.colors.cyan, fontSize: 15, fontFamily: theme.typography.label.fontFamily, ...visualRightText, width: '100%' },
  title: { width: '100%', fontSize: 26, fontWeight: 'normal', fontFamily: theme.typography.h2.fontFamily, color: theme.colors.text, ...visualRightText },
  subtitle: { width: '100%', fontSize: 13, lineHeight: 19, fontFamily: theme.typography.bodySmall.fontFamily, color: theme.colors.textSecondary, ...visualRightText },
  spinner: { marginVertical: theme.spacing.xl },
  empty: { color: theme.colors.textSecondary, textAlign: 'center', marginVertical: theme.spacing.xl, fontSize: 15, fontFamily: theme.typography.body.fontFamily },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, gap: theme.spacing.sm },
  name: { width: '100%', fontSize: 17, fontFamily: theme.typography.labelBold.fontFamily, color: theme.colors.text, ...visualRightText },
  meta: { width: '100%', fontSize: 13, fontFamily: theme.typography.label.fontFamily, color: theme.colors.textSecondary, ...visualRightText },
  photos: { flexDirection: 'row', gap: theme.spacing.md },
  photoBox: { flex: 1, gap: theme.spacing.xs },
  photoLabel: { width: '100%', fontSize: 12, fontFamily: theme.typography.label.fontFamily, color: theme.colors.textTertiary, ...visualRightText },
  photo: { width: '100%', aspectRatio: 1, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.bg },
  noPhoto: { justifyContent: 'center', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: theme.spacing.sm },
  actionButton: { flex: 1 },
  reasons: { gap: theme.spacing.sm },
  reasonChip: { borderWidth: 1, borderColor: theme.colors.surfaceHover, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, minHeight: 48, justifyContent: 'center' },
  reasonText: { color: theme.colors.text, fontSize: 14, fontFamily: theme.typography.label.fontFamily, ...visualRightText, width: '100%' },
  error: { color: theme.colors.error, textAlign: 'center', fontSize: 13, fontFamily: theme.typography.bodySmall.fontFamily },
});
