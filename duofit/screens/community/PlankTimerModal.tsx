import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Play, Square, Trophy } from 'lucide-react-native';
import { useCommunityStore } from '@hooks/useCommunityStore';
import { formatDuration, getPlankSeconds } from '@lib/plank';
import { theme } from '@styles/theme';

interface PlankTimerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PlankTimerModal: React.FC<PlankTimerModalProps> = ({ visible, onClose }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    {visible && <PlankTimerContent onClose={onClose} />}
  </Modal>
);

interface Result {
  seconds: number;
  isNewBest: boolean;
}

const TICK_MS = 200;

const PlankTimerContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const best = useCommunityStore((state) => state.plankBestSeconds);
  const recordPlank = useCommunityStore((state) => state.recordPlank);

  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setElapsedMs(new Date().getTime() - startedAt.current);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [running]);

  const start = () => {
    startedAt.current = new Date().getTime();
    setElapsedMs(0);
    setResult(null);
    setRunning(true);
  };

  const stop = () => {
    const seconds = Math.floor((new Date().getTime() - startedAt.current) / 1000);
    setRunning(false);
    setElapsedMs(seconds * 1000);
    if (seconds < 1) return;
    setResult({ seconds, isNewBest: recordPlank(seconds) });
  };

  const shownSeconds = Math.floor(elapsedMs / 1000);

  return (
    <View style={styles.root}>
      <Pressable style={styles.backdrop} onPress={running ? undefined : onClose} accessibilityLabel="סגור" />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>אתגר הפלאנק</Text>
        <Text style={styles.subtitle}>
          {best === null ? 'עוד לא מדדת — הניסיון הראשון שלך נשמר כשיא' : `השיא שלך: ${formatDuration(best)}`}
        </Text>

        <Text style={styles.timer}>{formatDuration(shownSeconds)}</Text>

        {result && (
          <View style={styles.resultBox}>
            <Trophy color={result.isNewBest ? theme.colors.warning : theme.colors.textSecondary} size={18} strokeWidth={2} />
            <Text style={styles.resultText}>
              {result.isNewBest
                ? `שיא חדש! ${formatDuration(result.seconds)}`
                : `${formatDuration(result.seconds)} — השיא שלך נשאר ${formatDuration(getPlankSeconds(best))}`}
            </Text>
          </View>
        )}

        {running ? (
          <Pressable style={[styles.mainButton, styles.stopButton]} onPress={stop} accessibilityLabel="עצור">
            <Square color={theme.colors.black} size={20} strokeWidth={2.5} fill={theme.colors.black} />
            <Text style={styles.mainButtonText}>סיימתי</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.mainButton} onPress={start} accessibilityLabel="התחל">
            <Play color={theme.colors.black} size={20} strokeWidth={2.5} fill={theme.colors.black} />
            <Text style={styles.mainButtonText}>{result ? 'נסה שוב' : 'התחל'}</Text>
          </Pressable>
        )}

        {!running && (
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>סגור</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl * 1.5,
    borderTopRightRadius: theme.borderRadius.xl * 1.5,
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 22,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  timer: {
    fontSize: 72,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
    marginVertical: theme.spacing.xl,
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  resultText: {
    flexShrink: 1,
    fontSize: 14,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    alignSelf: 'stretch',
    minHeight: 56,
    backgroundColor: theme.colors.magenta,
    borderRadius: theme.borderRadius.full,
  },
  stopButton: {
    backgroundColor: theme.colors.cyan,
  },
  mainButtonText: {
    fontSize: 17,
    fontFamily: theme.typography.button.fontFamily,
    color: theme.colors.black,
  },
  closeButton: {
    minHeight: 48,
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  closeText: {
    fontSize: 15,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
});
