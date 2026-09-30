import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Send } from 'lucide-react-native';
import { useCommunityStore } from '@hooks/useCommunityStore';
import { theme } from '@styles/theme';

interface CommentsModalProps {
  postId: string | null;
  authorName: string;
  onClose: () => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ postId, authorName, onClose }) => (
  <Modal visible={postId !== null} transparent animationType="slide" onRequestClose={onClose}>
    {postId !== null && <CommentsContent postId={postId} authorName={authorName} onClose={onClose} />}
  </Modal>
);

const EMPTY: never[] = [];

const CommentsContent: React.FC<{ postId: string; authorName: string; onClose: () => void }> = ({
  postId,
  authorName,
  onClose,
}) => {
  const comments = useCommunityStore((state) => state.comments[postId] ?? EMPTY);
  const addComment = useCommunityStore((state) => state.addComment);
  const [draft, setDraft] = useState('');

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    addComment(postId, text);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="סגור" />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{`תגובות לפוסט של ${authorName}`}</Text>
        <Text style={styles.hint}>תגובות הקהילה בפוסטים לדוגמה הן לא אמיתיות. כאן מופיעות התגובות שלך.</Text>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {comments.length === 0 ? (
            <Text style={styles.empty}>עוד אין תגובות ממך. היה הראשון להגיב</Text>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <Text style={styles.commentAuthor}>אתה</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="כתוב תגובה..."
            placeholderTextColor={theme.colors.textTertiary}
            maxLength={200}
            onSubmitEditing={send}
          />
          <Pressable
            style={[styles.sendButton, !draft.trim() && styles.sendDisabled]}
            onPress={send}
            disabled={!draft.trim()}
            accessibilityLabel="שלח תגובה"
          >
            <Send color={theme.colors.black} size={20} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    maxHeight: '80%',
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl * 1.5,
    borderTopRightRadius: theme.borderRadius.xl * 1.5,
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    marginBottom: theme.spacing.lg,
  },
  title: {
    width: '100%',
    fontSize: 20,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
  },
  hint: {
    width: '100%',
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  empty: {
    width: '100%',
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    paddingVertical: theme.spacing.lg,
  },
  comment: {
    alignItems: 'flex-end',
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  commentAuthor: {
    fontSize: 12,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.cyan,
  },
  commentText: {
    width: '100%',
    fontSize: 15,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 48,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    fontSize: 15,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.magenta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: {
    backgroundColor: theme.colors.surfaceHover,
  },
});
