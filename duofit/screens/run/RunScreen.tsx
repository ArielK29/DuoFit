import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { BackButton } from '@components/BackButton';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useRunStore } from '@hooks/useRunStore';
import { paceText, runDurationText } from '@lib/healthData';
import { addRunPoint, emptyRunProgress, type RunProgress } from '@lib/runTracker';
import { visualRightText } from '@lib/rtl';
import { newId } from '@lib/uuid';
import { theme } from '@styles/theme';

type Phase = 'idle' | 'running' | 'saved';

// A run shorter than this is a mis-tap, not a run.
const MIN_SAVED_KM = 0.05;
const KEEP_AWAKE_TAG = 'run';

// "התחל ריצה": measures the distance with GPS while the screen stays on (the phone must not lock, or iOS stops the
// GPS), and a manual entry for a run done without the phone. Saved runs stay on this phone and count in Progress and Home.
export const RunScreen: React.FC = () => {
  const router = useRouter();
  const addRun = useRunStore((state) => state.addRun);

  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<RunProgress>(emptyRunProgress());
  const [elapsed, setElapsed] = useState(0);
  const [summary, setSummary] = useState<{ km: number; durationSec: number } | null>(null);
  const [manualKm, setManualKm] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

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
      setMessage('כדי למדוד ריצה צריך לאשר גישה למיקום. אפשר לאשר ב: הגדרות ← FitFriend ← מיקום. אפשר גם להזין ריצה ידנית למטה.');
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
      setMessage('לא הצלחנו להפעיל את ה-GPS. נסה שוב בחוץ, או הזן את הריצה ידנית למטה.');
    }
  };

  const finish = () => {
    stopWatching();
    const km = Math.round((progressRef.current.distanceMeters / 1000) * 100) / 100;
    const durationSec = Math.round((Date.now() - startedAt.current) / 1000);
    if (km < MIN_SAVED_KM) {
      setPhase('idle');
      setMessage('הריצה קצרה מדי כדי לשמור אותה.');
      return;
    }
    addRun({ id: newId(), startedAt: new Date(startedAt.current).toISOString(), km, durationSec });
    setSummary({ km, durationSec });
    setPhase('saved');
  };

  const saveManual = () => {
    setManualError(null);
    const km = Number(manualKm.replace(',', '.'));
    const minutes = Number(manualMinutes.replace(',', '.'));
    if (!(km >= MIN_SAVED_KM && km <= 100)) {
      setManualError('הזן מרחק בקילומטרים, למשל 5 או 3.5');
      return;
    }
    if (!(minutes >= 1 && minutes <= 1000)) {
      setManualError('הזן את משך הריצה בדקות, למשל 30');
      return;
    }
    const durationSec = Math.round(minutes * 60);
    const rounded = Math.round(km * 100) / 100;
    addRun({ id: newId(), startedAt: new Date(Date.now() - durationSec * 1000).toISOString(), km: rounded, durationSec });
    setSummary({ km: rounded, durationSec });
    setPhase('saved');
  };

  if (phase === 'saved' && summary) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>הריצה נשמרה</Text>
          <Text style={styles.bigValue}>{summary.km.toFixed(2)}</Text>
          <Text style={styles.unit}>ק"מ</Text>
          <Text style={styles.detail}>{`${runDurationText(summary.durationSec)} · ${paceText(summary.km, summary.durationSec)} לק"מ`}</Text>
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
            <Button label="סיים ריצה" variant="primary" size="lg" onPress={finish} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <BackButton />
        <Text style={styles.title}>ריצה</Text>
        <Text style={styles.body}>
          הקש "התחל" ורוץ. האפליקציה מודדת מרחק, זמן וקצב עם GPS בזמן אמת. המידע נשמר בטלפון שלך בלבד.
        </Text>
        {message && <Text style={styles.error}>{message}</Text>}
        <View style={styles.block}>
          <Button label="התחל ריצה" variant="primary" size="lg" onPress={start} />
        </View>

        <Text style={styles.sectionTitle}>רצת בלי הטלפון? הזן ידנית</Text>
        <Input label="מרחק (ק״מ)" value={manualKm} onChangeText={setManualKm} keyboardType="decimal-pad" placeholder="5" />
        <Input label="משך (דקות)" value={manualMinutes} onChangeText={setManualMinutes} keyboardType="number-pad" placeholder="30" />
        {manualError && <Text style={styles.error}>{manualError}</Text>}
        <Button label="שמור ריצה" variant="secondary" size="lg" onPress={saveManual} />
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
  label: {
    fontSize: 16,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  bigValue: {
    fontSize: 96,
    lineHeight: 104,
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
