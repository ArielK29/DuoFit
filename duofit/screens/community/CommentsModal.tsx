import React, { useEffect, useState } from 'react';
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
import { useFeedStore } from '@hooks/useFeedStore';
import { useAuth } from '@hooks/useAuth';
import { DEMO_DATA } from '@lib/demo';
import { askChoice } from '@lib/askChoice';
import { theme } from '@styles/theme';
import { visualRightText } from '@lib/rtl';

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
  const demoComments = useCommunityStore((state) => state.comments[postId] ?? EMPTY);
  const addDemoComment = useCommunityStore((state) => state.addComment);
  const remoteComments = useFeedStore((state) => state.comments[postId]);
  const feed = useFeedStore.getState();
  const myId = useAuth((state) => state.user?.id);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!DEMO_DATA) useFeedStore.getState().loadComments(postId);
  }, [postId]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    if (DEMO_DATA) {
      addDemoComment(postId, text);
      setDraft('');
      return;
    }
    setSending(true);
    const saved = await feed.addComment(postId, text);
    setSending(false);
    if (saved) setDraft('');
  };

  const comments = DEMO_DATA
    ? demoComments.map((item) => ({ id: item.id, text: item.text, author: 'אתה', userId: myId ?? '' }))
    : (remoteComments ?? []).map((item) => ({
        id: item.id,
        text: item.body,
        author: item.userId === myId ? 'אתה' : item.authorName,
        userId: item.userId,
      }));

  // Own comments can be deleted; other people's comments can be reported or their writer blocked.
  const openMenu = (comment: { id: string; author: string; userId: string }) => {
    if (DEMO_DATA) return;
    if (comment.userId === myId) {
      askChoice('מחיקת תגובה', 'למחוק את התגובה שלך?', [
        { label: 'מחק', destructive: true, onPress: () => feed.deleteComment(postId, comment.id) },
      ]);
      return;
    }
    askChoice('דיווח או חסימה', `התגובה של ${comment.author}.`, [
      { label: 'דווח והסתר', destructive: true, onPress: () => feed.report({ commentId: comment.id }, 'inappropriate') },
      { label: `חסום את ${comment.author}`, destructive: true, onPress: () => feed.block(comment.userId) },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="סגור" />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{`תגובות לפוסט של ${authorName}`}</Text>
        <Text style={styles.hint}>
          {DEMO_DATA
            ? 'תגובות הקהילה בפוסטים לדוגמה הן לא אמיתיות. כאן מופיעות התגובות שלך.'
            : 'לחיצה על תגובה: מחיקה, דיווח או חסימה'}
        </Text>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {comments.length === 0 ? (
            <Text style={styles.empty}>{DEMO_DATA ? 'עוד אין תגובות ממך. היה הראשון להגיב' : 'עוד אין תגובות. היה הראשון להגיב'}</Text>
          ) : (
            comments.map((comment) => (
              <Pressable key={comment.id} style={styles.comment} onPress={() => openMenu(comment)}>
                <Text style={styles.commentAuthor}>{comment.author}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
              </Pressable>
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
            maxLength={DEMO_DATA ? 200 : 300}
            onSubmitEditing={send}
          />
          <Pressable
            style={[styles.sendButton, !draft.trim() && styles.sendDisabled]}
            onPress={send}
            disabled={!draft.trim() || sending}
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
    ...visualRightText,
  },
  hint: {
    width: '100%',
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
    ...visualRightText,
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
    ...visualRightText,
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
    ...visualRightText,
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
    ...visualRightText,
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
