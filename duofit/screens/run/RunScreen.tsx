import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Input } from '@components/Input';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { extractTextFromImage, isSupported as textReadingSupported } from 'expo-text-extractor';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { BackButton } from '@components/BackButton';
import { Button } from '@components/Button';
import { useRunStore } from '@hooks/useRunStore';
import { paceText, runDurationText } from '@lib/healthData';
import { addRunPoint, emptyRunProgress, type RunProgress } from '@lib/runTracker';
import { parseRunFromText } from '@lib/runOcr';
import { logError } from '@lib/analytics';
import { DISTANCE_CHIPS_KM, TIME_CHIPS_MIN, stepKm, stepMinutes, suggestMinutes } from '@lib/runPresets';
import { visualRightText } from '@lib/rtl';
import { newId } from '@lib/uuid';
import { theme } from '@styles/theme';

type Phase = 'idle' | 'running' | 'saved';

// A run shorter than this is a mis-tap, not a run.
const MIN_SAVED_KM = 0.05;
const KEEP_AWAKE_TAG = 'run';

// A tappable pill (a quick distance or time).
const Chip: React.FC<{ label: string; selected: boolean; onPress: () => void }> = ({ label, selected, onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    style={[styles.chip, selected && styles.chipSelected]}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
  </Pressable>
);

// "התחל ריצה": measures the distance with GPS while the screen stays on (the phone must not lock, or iOS stops the
// GPS), and a manual entry for a run done without the phone. Saved runs stay on this phone and count in Progress and Home.
export const RunScreen: React.FC = () => {
  const router = useRouter();
  const addRun = useRunStore((state) => state.addRun);
  const previousRuns = useRunStore((state) => state.runs);

  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<RunProgress>(emptyRunProgress());
  const [elapsed, setElapsed] = useState(0);
  const [summary, setSummary] = useState<{ km: number; durationSec: number; kcal?: number } | null>(null);
  // Quick entry: tap a distance, the time is suggested from the member's pace (and can be changed with a tap).
  const [manualKm, setManualKm] = useState<number | null>(null);
  const [manualMinutes, setManualMinutes] = useState<number | null>(null);
  const [minutesChosen, setMinutesChosen] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  // Calories of the run from a watch or another app (optional). Text, so the member can clear it.
  const [manualKcal, setManualKcal] = useState('');

  const [reading, setReading] = useState(false);
  const [photoNote, setPhotoNote] = useState<string | null>(null);

  // Read the distance and time from a screenshot or photo of the run (a watch, another running app). Everything happens
  // on the phone: the picture is never sent anywhere. The numbers only pre-fill the quick entry; the member checks and saves.
  const readFromPhoto = async () => {
    setPhotoNote(null);
    setManualError(null);
    try {
      // allowsEditing hands the reader a fresh upright copy (a camera photo carries a hidden "rotated" mark that the reader
      // ignores, which turns the text sideways), and lets the member crop to the numbers, which also reads better.
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, allowsEditing: true });
      if (picked.canceled || !picked.assets[0]) return;
      setReading(true);
      const lines = await extractTextFromImage(picked.assets[0].uri);
      const found = parseRunFromText(lines);
      if (found.km === undefined && found.minutes === undefined && found.kcal === undefined) {
        // Show a little of what was read, so a wrong guess can be told apart from "nothing was read" (and sent to us).
        const seen = lines.join(' ').replace(/\s+/g, ' ').trim().slice(0, 70);
        setPhotoNote(seen ? `לא מצאנו מרחק או זמן בתמונה. הטקסט שנקרא: "${seen}". בחר ידנית בכפתורים.` : 'לא נקרא שום טקסט בתמונה. נסה צילום מסך ברור יותר, או בחר ידנית בכפתורים.');
        return;
      }
      if (found.km !== undefined) setManualKm(found.km);
      if (found.minutes !== undefined) {
        setMinutesChosen(true);
        setManualMinutes(found.minutes);
      } else if (found.km !== undefined && !minutesChosen) {
        setManualMinutes(suggestMinutes(found.km, previousRuns));
      }
      if (found.kcal !== undefined) setManualKcal(String(found.kcal));
      const parts = [
        found.km !== undefined ? `${found.km} ק"מ` : null,
        found.minutes !== undefined ? `${found.minutes} דקות` : null,
        found.kcal !== undefined ? `${found.kcal} קלוריות` : null,
      ].filter(Boolean);
      setPhotoNote(`זיהינו: ${parts.join(' ו-')}. בדוק שזה נכון ושמור.`);
    } catch (err) {
      logError('run_photo_read_failed', { error: String((err as { message?: string })?.message ?? err) });
      setPhotoNote(`לא הצלחנו לקרוא את התמונה (${String((err as { message?: string })?.message ?? 'שגיאה').slice(0, 60)}). בחר ידנית בכפתורים.`);
    } finally {
      setReading(false);
    }
  };

  const chooseKm = (km: number) => {
    setManualKm(km);
    if (!minutesChosen) setManualMinutes(suggestMinutes(km, previousRuns));
  };
  const chooseMinutes = (minutes: number) => {
    setMinutesChosen(true);
    setManualMinutes(minutes);
  };

  const startedAt = useRef<number>(0);
  const progressRef = useRef<RunProgress>(emptyRunProgress());
  const watcher = useRef<Location.LocationSubscription | null>(null);

  const stopWatching = useCallback(() => {
    watcher.current?.remove();
    watcher.current = null;
    deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
  }, []);

  useEffect(() => stopWatching, [stopWatching]);

  useEffect(() => {
    if (phase !== 'running') return undefined;
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const start = async () => {
    setMessage(null);
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      setMessage('כדי למדוד הליכה או ריצה צריך לאשר גישה למיקום. אפשר לאשר ב: הגדרות ← FitFriend ← מיקום. אפשר גם להזין ידנית למטה.');
      return;
    }
    progressRef.current = emptyRunProgress();
    setProgress(progressRef.current);
    startedAt.current = Date.now();
    setElapsed(0);
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    try {
      watcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 3, timeInterval: 2000 },
        (position) => {
          progressRef.current = addRunPoint(progressRef.current, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestampMs: position.timestamp,
            accuracy: position.coords.accuracy,
          });
          setProgress(progressRef.current);
        }
      );
      setPhase('running');
    } catch {
      stopWatching();
      setMessage('לא הצלחנו להפעיל את ה-GPS. נסה שוב בחוץ, או הזן ידנית למטה.');
    }
  };

  const finish = () => {
    stopWatching();
    const km = Math.round((progressRef.current.distanceMeters / 1000) * 100) / 100;
    const durationSec = Math.round((Date.now() - startedAt.current) / 1000);
    if (km < MIN_SAVED_KM) {
      setPhase('idle');
      setMessage('האימון קצר מדי כדי לשמור אותו.');
      return;
    }
    addRun({ id: newId(), startedAt: new Date(startedAt.current).toISOString(), km, durationSec });
    setSummary({ km, durationSec });
    setPhase('saved');
  };

  const saveManual = () => {
    setManualError(null);
    const km = manualKm ?? 0;
    const minutes = manualMinutes ?? 0;
    if (!(km >= MIN_SAVED_KM && km <= 100)) {
      setManualError('בחר את המרחק');
      return;
    }
    if (!(minutes >= 1 && minutes <= 1000)) {
      setManualError('בחר את משך האימון');
      return;
    }
    const kcalText = manualKcal.trim();
    const kcal = kcalText === '' ? undefined : Number(kcalText);
    if (kcal !== undefined && !(Number.isInteger(kcal) && kcal >= 1 && kcal <= 5000)) {
      setManualError('הקלוריות צריכות להיות מספר שלם בין 1 ל-5000, או שאפשר להשאיר ריק');
      return;
    }
    const durationSec = Math.round(minutes * 60);
    const rounded = Math.round(km * 100) / 100;
    addRun({ id: newId(), startedAt: new Date(Date.now() - durationSec * 1000).toISOString(), km: rounded, durationSec, ...(kcal === undefined ? {} : { kcal }) });
    setSummary({ km: rounded, durationSec, kcal });
    setPhase('saved');
  };

  if (phase === 'saved' && summary) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>האימון נשמר</Text>
          <Text style={styles.bigValue}>{summary.km.toFixed(2)}</Text>
          <Text style={styles.unit}>ק"מ</Text>
          <Text style={styles.detail}>{`${runDurationText(summary.durationSec)} · ${paceText(summary.km, summary.durationSec)} לק"מ`}</Text>
          {summary.kcal !== undefined && <Text style={styles.detail}>{`${summary.kcal} קלוריות`}</Text>}
          <View style={styles.actions}>
            <Button label="חזרה להתקדמות" variant="primary" size="lg" onPress={() => router.back()} />
          </View>
        </View>
      </View>
    );
  }

  if (phase === 'running') {
    const km = progress.distanceMeters / 1000;
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.label}>המרחק</Text>
          <Text style={styles.bigValue} accessibilityLiveRegion="polite">
            {km.toFixed(2)}
          </Text>
          <Text style={styles.unit}>ק"מ</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{runDurationText(elapsed)}</Text>
              <Text style={styles.statLabel}>זמן</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{paceText(km, elapsed)}</Text>
              <Text style={styles.statLabel}>קצב לק"מ</Text>
            </View>
          </View>
          <Text style={styles.hint}>השאר את המסך דולק ואת האפליקציה פתוחה, אחרת ה-GPS נעצר.</Text>
          <View style={styles.actions}>
            <Button label="סיים" variant="primary" size="lg" onPress={finish} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <BackButton />
        <Text style={styles.title}>הליכה או ריצה</Text>
        <Text style={styles.body}>
          הקש "התחל" וצא להליכה או לריצה. האפליקציה מודדת מרחק, זמן וקצב עם GPS בזמן אמת. המידע נשמר בטלפון שלך בלבד.
        </Text>
        {message && <Text style={styles.error}>{message}</Text>}
        <View style={styles.block}>
          <Button label="התחל הליכה או ריצה" variant="primary" size="lg" onPress={start} />
        </View>

        <Text style={styles.sectionTitle}>סיימת הליכה או ריצה? שמור בכמה לחיצות</Text>

        {textReadingSupported && (
          <View style={styles.block}>
            <Button label="קרא מצילום של האימון" variant="secondary" size="lg" loading={reading} disabled={reading} onPress={readFromPhoto} />
            <Text style={styles.photoHint}>בחר צילום מסך של השעון, של ההליכון או של אפליקציית האימון. הקריאה נעשית בטלפון בלבד והתמונה לא נשלחת לשום מקום.</Text>
            {photoNote && <Text style={styles.photoNote}>{photoNote}</Text>}
          </View>
        )}

        <Text style={styles.fieldLabel}>{manualKm === null ? 'כמה הלכת או רצת?' : `${manualKm} ק"מ`}</Text>
        <View style={styles.chipsWrap}>
          {DISTANCE_CHIPS_KM.map((km) => (
            <Chip key={km} label={`${km} ק"מ`} selected={manualKm === km} onPress={() => chooseKm(km)} />
          ))}
        </View>
        <View style={styles.stepRow}>
          {[-10, -5, -1, -0.5, 0.5, 1, 5, 10].map((delta) => (
            <Chip key={delta} label={delta > 0 ? `+${delta}` : `${delta}`} selected={false} onPress={() => chooseKm(stepKm(manualKm, delta))} />
          ))}
        </View>

        <Text style={styles.fieldLabel}>{manualMinutes === null ? 'כמה זמן?' : `במשך ${manualMinutes} דקות`}</Text>
        <View style={styles.chipsWrap}>
          {TIME_CHIPS_MIN.map((minutes) => (
            <Chip key={minutes} label={`${minutes} דק'`} selected={manualMinutes === minutes} onPress={() => chooseMinutes(minutes)} />
          ))}
        </View>
        <View style={styles.stepRow}>
          {[-5, -1, 1, 5].map((delta) => (
            <Chip key={delta} label={delta > 0 ? `+${delta}` : `${delta}`} selected={false} onPress={() => chooseMinutes(stepMinutes(manualMinutes, delta))} />
          ))}
        </View>

        <Input
          label="קלוריות שנשרפו (לא חובה)"
          value={manualKcal}
          onChangeText={(text) => setManualKcal(text.replace(/[^0-9]/g, '').slice(0, 4))}
          keyboardType="number-pad"
          placeholder="למשל 126"
          helperText="אם השעון או אפליקציה אחרת הראו קלוריות, כתוב אותן. הן יחליפו את ההערכה של האפליקציה."
          maxLength={4}
        />
        {manualError && <Text style={styles.error}>{manualError}</Text>}
        <Button
          label={manualKm !== null && manualMinutes !== null ? `שמור · ${manualKm} ק"מ · ${manualMinutes} דק'` : 'שמור'}
          variant="primary"
          size="lg"
          onPress={saveManual}
        />
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
  scroll: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: 34,
    fontFamily: theme.typography.h1.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
    width: '100%',
    marginBottom: theme.spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    ...visualRightText,
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
    width: '100%',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  block: {
    marginBottom: theme.spacing.md,
  },
  photoHint: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textTertiary,
    ...visualRightText,
    width: '100%',
    marginTop: theme.spacing.sm,
  },
  photoNote: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.cyan,
    ...visualRightText,
    width: '100%',
    marginTop: theme.spacing.sm,
  },
  fieldLabel: {
    fontSize: 16,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
    width: '100%',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  chip: {
    minHeight: 48,
    minWidth: 56,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: theme.colors.cyan,
    borderColor: theme.colors.cyan,
  },
  chipText: {
    fontSize: 15,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
  },
  chipTextSelected: {
    color: theme.colors.black,
  },
  label: {
    fontSize: 16,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  bigValue: {
    fontSize: 96,
    // The tall display font is cut off at the top when the line is barely taller than the letters: give it room above and below.
    lineHeight: 136,
    paddingTop: 12,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.cyan,
  },
  unit: {
    fontSize: 22,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
  },
  detail: {
    fontSize: 18,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  stat: {
    alignItems: 'center',
    minWidth: 100,
  },
  statValue: {
    fontSize: 36,
    lineHeight: 52,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.magenta,
    ...visualRightText,
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  actions: {
    width: '100%',
    marginTop: theme.spacing.xl,
  },
});
