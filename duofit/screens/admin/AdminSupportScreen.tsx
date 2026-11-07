import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { Button } from '@components/Button';
import { BackButton } from '@components/BackButton';
import { theme } from '@styles/theme';
import { visualRightText } from '@lib/rtl';
import { supportStatusLabel, supportTopicLabel, type SupportStatus } from '@lib/support';
import { listSupportRequestsForAdmin, updateSupportRequest, type SupportRequest } from '@lib/remoteSupport';
import { useAuth } from '@hooks/useAuth';

function whenText(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })} · ${date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
}

// Only for admins (the server also returns nothing to anybody else): the requests members sent from "contact us".
// Open ones first; mark a request in progress or done, and an optional answer note the member sees next to it.
export const AdminSupportScreen: React.FC = () => {
  const isAdmin = useAuth((state) => state.user?.isAdmin ?? false);
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [items, setItems] = useState<SupportRequest[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await listSupportRequestsForAdmin(onlyOpen);
    setFailed(list === null);
    setItems(list ?? []);
    setLoading(false);
  }, [onlyOpen]);

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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <BackButton />
        <Text style={styles.title}>פניות מהמשתמשים</Text>
        <View style={styles.filters}>
          {[
            { open: true, label: 'פתוחות' },
            { open: false, label: 'הכול' },
          ].map((filter) => (
            <Pressable
              key={filter.label}
              style={[styles.filter, onlyOpen === filter.open && styles.filterSelected]}
              onPress={() => setOnlyOpen(filter.open)}
              accessibilityRole="button"
              accessibilityState={{ selected: onlyOpen === filter.open }}
            >
              <Text style={[styles.filterText, onlyOpen === filter.open && styles.filterTextSelected]}>{filter.label}</Text>
            </Pressable>
          ))}
        </View>

        {loading ? <ActivityIndicator color={theme.colors.cyan} style={styles.spinner} /> : null}
        {failed ? <Text style={styles.empty}>לא הצלחנו לטעון. נסה שוב</Text> : null}
        {!loading && !failed && items && items.length === 0 ? <Text style={styles.empty}>אין פניות 🎉</Text> : null}

        {(items ?? []).map((item) => (
          <RequestCard
            key={item.id}
            item={item}
            onChanged={(status, note) =>
              setItems((prev) => {
                const next = (prev ?? []).map((x) => (x.id === item.id ? { ...x, status, adminNote: note } : x));
                return onlyOpen ? next.filter((x) => x.status !== 'done') : next;
              })
            }
          />
        ))}
        {!loading ? <Button label="רענן" variant="secondary" onPress={load} /> : null}
      </ScrollView>
    </View>
  );
};

const RequestCard: React.FC<{ item: SupportRequest; onChanged: (status: SupportStatus, note: string | null) => void }> = ({ item, onChanged }) => {
  const [note, setNote] = useState(item.adminNote ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (status: SupportStatus) => {
    setBusy(true);
    setError(null);
    const trimmed = note.trim() || null;
    const ok = await updateSupportRequest(item.id, status, trimmed);
    setBusy(false);
    if (ok) onChanged(status, trimmed);
    else setError('לא הצלחנו לשמור. נסה שוב');
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={[styles.status, item.status === 'new' && styles.statusNew]}>{supportStatusLabel(item.status)}</Text>
        <Text style={styles.meta}>{`${supportTopicLabel(item.topic)} · ${whenText(item.createdAt)}`}</Text>
      </View>
      <Text style={styles.name}>{item.name || 'משתמש ללא שם'}</Text>
      {item.appVersion ? <Text style={styles.meta}>{`גרסה ${item.appVersion}`}</Text> : null}
      <Text style={styles.message} selectable>
        {item.message}
      </Text>
      <TextInput
        style={styles.noteInput}
        value={note}
        onChangeText={setNote}
        placeholder="הערה או תשובה (המשתמש רואה אותה)"
        placeholderTextColor={theme.colors.textTertiary}
        multiline
        maxLength={2000}
        editable={!busy}
        accessibilityLabel="הערה לפנייה"
      />
      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <Button label="בטיפול" variant="secondary" onPress={() => save('in_progress')} disabled={busy} />
        </View>
        <View style={styles.actionButton}>
          <Button label="טופלה" onPress={() => save('done')} loading={busy} disabled={busy} />
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: theme.spacing.lg },
  scrollContent: { paddingVertical: theme.spacing.xl, gap: theme.spacing.md },
  title: { width: '100%', fontSize: 26, lineHeight: 36, fontWeight: 'normal', fontFamily: theme.typography.h2.fontFamily, color: theme.colors.text, ...visualRightText },
  filters: { flexDirection: 'row', gap: theme.spacing.sm },
  filter: { minHeight: 48, paddingHorizontal: theme.spacing.lg, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.surfaceHover, justifyContent: 'center' },
  filterSelected: { backgroundColor: theme.colors.cyan, borderColor: theme.colors.cyan },
  filterText: { fontSize: 14, lineHeight: 20, fontFamily: theme.typography.label.fontFamily, color: theme.colors.text },
  filterTextSelected: { color: theme.colors.black },
  spinner: { marginVertical: theme.spacing.xl },
  empty: { color: theme.colors.textSecondary, textAlign: 'center', marginVertical: theme.spacing.xl, fontSize: 15, lineHeight: 22, fontFamily: theme.typography.body.fontFamily },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, gap: theme.spacing.sm },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.sm },
  status: { fontSize: 13, lineHeight: 19, fontFamily: theme.typography.labelBold.fontFamily, color: theme.colors.textSecondary },
  statusNew: { color: theme.colors.magenta },
  meta: { flexShrink: 1, fontSize: 12, lineHeight: 18, fontFamily: theme.typography.bodySmall.fontFamily, color: theme.colors.textTertiary },
  name: { width: '100%', fontSize: 17, lineHeight: 24, fontFamily: theme.typography.labelBold.fontFamily, color: theme.colors.text, ...visualRightText },
  message: { width: '100%', fontSize: 15, lineHeight: 23, fontFamily: theme.typography.body.fontFamily, color: theme.colors.text, ...visualRightText },
  noteInput: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'right',
    textAlignVertical: 'top',
    fontFamily: theme.typography.body.fontFamily,
  },
  actions: { flexDirection: 'row', gap: theme.spacing.sm },
  actionButton: { flex: 1 },
  error: { color: theme.colors.error, textAlign: 'center', fontSize: 13, lineHeight: 19, fontFamily: theme.typography.bodySmall.fontFamily },
});
