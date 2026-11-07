import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@components/Button';
import { BackButton } from '@components/BackButton';
import { theme } from '@styles/theme';
import { visualRightText } from '@lib/rtl';
import {
  SUPPORT_MAX_CHARS,
  SUPPORT_TOPICS,
  supportErrorMessage,
  supportMessageProblem,
  supportStatusLabel,
  supportTopicLabel,
  type SupportTopic,
} from '@lib/support';
import { listMySupportRequests, sendSupportRequest, type SupportRequest } from '@lib/remoteSupport';
import { useAuth } from '@hooks/useAuth';

function dayText(iso: string): string {
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
}

// "Contact us": one message about anything in the app (not a chat). It reaches the owner (see the admin screen); the member
// sees a confirmation and the status of his earlier requests.
export const SupportScreen: React.FC = () => {
  const router = useRouter();
  const userId = useAuth((state) => state.user?.id ?? null);
  const [topic, setTopic] = useState<SupportTopic>('bug');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [mine, setMine] = useState<SupportRequest[]>([]);

  const loadMine = useCallback(async () => {
    if (!userId) return;
    const list = await listMySupportRequests(userId);
    if (list) setMine(list);
  }, [userId]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  const send = async () => {
    const problem = supportMessageProblem(message);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSending(true);
    try {
      await sendSupportRequest(topic, message);
      setSent(true);
      setMessage('');
      loadMine();
    } catch (err) {
      setError(supportErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <BackButton />
        <Text style={styles.title}>פנייה אלינו</Text>
        <Text style={styles.subtitle}>תקלה, שאלה, הצעה או משהו שמטריד אותך? כתוב לנו ונקרא את זה. אם צריך, נחזור אליך במייל של החשבון.</Text>

        {sent ? (
          <View style={styles.sentCard}>
            <Text style={styles.sentTitle}>הפנייה נשלחה, תודה!</Text>
            <Text style={styles.sentText}>קיבלנו אותה ונטפל בה בהקדם. אפשר לראות את הסטטוס שלה למטה.</Text>
            <Button label="שלח פנייה נוספת" variant="secondary" size="lg" onPress={() => setSent(false)} />
            <Button label="חזרה" size="lg" onPress={() => router.back()} />
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>על מה הפנייה?</Text>
            <View style={styles.chips}>
              {SUPPORT_TOPICS.map((entry) => {
                const selected = entry.key === topic;
                return (
                  <Pressable
                    key={entry.key}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setTopic(entry.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{entry.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>מה קרה?</Text>
            <View style={[styles.box, error ? styles.boxError : null]}>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={(text) => {
                  setMessage(text);
                  if (error) setError(null);
                }}
                placeholder="תאר במילים שלך מה קרה ובאיזה מסך"
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                maxLength={SUPPORT_MAX_CHARS}
                editable={!sending}
                accessibilityLabel="תוכן הפנייה"
              />
            </View>
            <Text style={styles.counter}>{`${message.length.toLocaleString('he-IL')}/${SUPPORT_MAX_CHARS.toLocaleString('he-IL')}`}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="שלח פנייה" size="lg" onPress={send} loading={sending} disabled={sending} />
            <Text style={styles.privacy}>אל תכתוב סיסמאות או פרטי אשראי. הפנייה נראית רק לנו.</Text>
          </>
        )}

        {mine.length > 0 ? (
          <View style={styles.history}>
            <Text style={styles.sectionLabel}>הפניות שלי</Text>
            {mine.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHead}>
                  <Text style={styles.requestStatus}>{supportStatusLabel(request.status)}</Text>
                  <Text style={styles.requestMeta}>{`${supportTopicLabel(request.topic)} · ${dayText(request.createdAt)}`}</Text>
                </View>
                <Text style={styles.requestMessage}>{request.message}</Text>
                {request.adminNote ? <Text style={styles.requestNote}>{`תשובה: ${request.adminNote}`}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  scrollContent: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.xl, gap: theme.spacing.md },
  title: { width: '100%', fontSize: 26, lineHeight: 36, fontWeight: 'normal', fontFamily: theme.typography.h2.fontFamily, color: theme.colors.text, ...visualRightText },
  subtitle: { width: '100%', fontSize: 14, lineHeight: 21, fontFamily: theme.typography.body.fontFamily, color: theme.colors.textSecondary, ...visualRightText },
  sectionLabel: { width: '100%', fontSize: 15, lineHeight: 22, fontFamily: theme.typography.labelBold.fontFamily, color: theme.colors.text, ...visualRightText },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: {
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: theme.colors.cyan, borderColor: theme.colors.cyan },
  chipText: { fontSize: 14, lineHeight: 20, fontFamily: theme.typography.label.fontFamily, color: theme.colors.text },
  chipTextSelected: { color: theme.colors.black },
  box: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing.md,
  },
  boxError: { borderColor: theme.colors.error },
  input: {
    minHeight: 160,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
    textAlignVertical: 'top',
    fontFamily: theme.typography.body.fontFamily,
  },
  counter: { width: '100%', fontSize: 12, lineHeight: 18, fontFamily: theme.typography.bodySmall.fontFamily, color: theme.colors.textTertiary, ...visualRightText },
  error: { width: '100%', fontSize: 13, lineHeight: 19, fontFamily: theme.typography.bodySmall.fontFamily, color: theme.colors.error, ...visualRightText },
  privacy: { width: '100%', fontSize: 12, lineHeight: 18, fontFamily: theme.typography.bodySmall.fontFamily, color: theme.colors.textTertiary, ...visualRightText },
  sentCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, gap: theme.spacing.md },
  sentTitle: { width: '100%', fontSize: 20, lineHeight: 28, fontFamily: theme.typography.h3.fontFamily, color: theme.colors.text, ...visualRightText },
  sentText: { width: '100%', fontSize: 14, lineHeight: 21, fontFamily: theme.typography.body.fontFamily, color: theme.colors.textSecondary, ...visualRightText },
  history: { gap: theme.spacing.sm, marginTop: theme.spacing.md },
  requestCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, gap: theme.spacing.xs },
  requestHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.sm },
  requestStatus: { fontSize: 13, lineHeight: 19, fontFamily: theme.typography.labelBold.fontFamily, color: theme.colors.cyan },
  requestMeta: { flexShrink: 1, fontSize: 12, lineHeight: 18, fontFamily: theme.typography.bodySmall.fontFamily, color: theme.colors.textTertiary },
  requestMessage: { width: '100%', fontSize: 14, lineHeight: 21, fontFamily: theme.typography.body.fontFamily, color: theme.colors.text, ...visualRightText },
  requestNote: { width: '100%', fontSize: 13, lineHeight: 19, fontFamily: theme.typography.bodySmall.fontFamily, color: theme.colors.textSecondary, ...visualRightText },
});
