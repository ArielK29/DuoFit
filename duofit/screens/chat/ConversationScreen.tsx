import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, CalendarPlus, Calendar, Clock, MapPin, Check, X } from 'lucide-react-native';
import { useChatStore, AUTO_REPLY_DELAY_MS, ChatMessage } from '@hooks/useChatStore';
import { notifyInviteAnswered } from '@lib/notifications';
import { theme } from '@styles/theme';

export function ConversationScreen() {
  const router = useRouter();
  const { partnerId = '', partnerName = '' } = useLocalSearchParams<
    '/conversation',
    { partnerId: string; partnerName: string }
  >();
  const conversation = useChatStore((state) => state.conversations[partnerId]);
  const ensureConversation = useChatStore((state) => state.ensureConversation);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const respondToInvite = useChatStore((state) => state.respondToInvite);

  const [inputText, setInputText] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    ensureConversation(partnerId, partnerName);
  }, [partnerId, partnerName, ensureConversation]);

  const messages = conversation?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, isPartnerTyping]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    sendMessage(partnerId, partnerName, text);
    setInputText('');
    setIsPartnerTyping(true);
    setTimeout(() => setIsPartnerTyping(false), AUTO_REPLY_DELAY_MS);
  };

  const handleRespondToInvite = (messageId: string, accept: boolean) => {
    respondToInvite(partnerId, messageId, accept);
    notifyInviteAnswered(partnerName, accept);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()} accessibilityLabel="חזרה">
          <ArrowLeft color={theme.colors.magenta} size={22} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerName}>{partnerName}</Text>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.push({ pathname: '/invite-to-workout', params: { partnerId, partnerName } })}
          accessibilityLabel="הזמן לאימון"
        >
          <CalendarPlus color={theme.colors.cyan} size={22} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.messagesList}>
        {messages.map((message) =>
          message.kind === 'invite' ? (
            <InviteCard key={message.id} message={message} onRespond={handleRespondToInvite} />
          ) : (
            <View
              key={message.id}
              style={[styles.bubble, message.senderId === 'me' ? styles.bubbleMine : styles.bubblePartner]}
            >
              <Text style={[styles.bubbleText, message.senderId === 'me' && styles.bubbleTextMine]}>
                {message.text}
              </Text>
            </View>
          )
        )}
        {isPartnerTyping && (
          <View style={[styles.bubble, styles.bubblePartner]}>
            <Text style={styles.bubbleText}>מקליד/ה...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="הודעה..."
          placeholderTextColor={theme.colors.textTertiary}
          onSubmitEditing={handleSend}
        />
        <Pressable style={styles.sendButton} onPress={handleSend} accessibilityLabel="שלח">
          <Send color={theme.colors.black} size={18} strokeWidth={2} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

interface InviteCardProps {
  message: Extract<ChatMessage, { kind: 'invite' }>;
  onRespond: (messageId: string, accept: boolean) => void;
}

function InviteCard({ message, onRespond }: InviteCardProps) {
  const { invite } = message;
  const scheduledDate = new Date(invite.scheduledAt);

  return (
    <View style={[styles.inviteCard, message.senderId === 'me' ? styles.bubbleMineAlign : styles.bubblePartnerAlign]}>
      <Text style={styles.inviteTitle}>הזמנה לאימון</Text>
      <View style={styles.inviteRow}>
        <Calendar color={theme.colors.textSecondary} size={14} strokeWidth={2} />
        <Text style={styles.inviteText}>{scheduledDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}</Text>
      </View>
      <View style={styles.inviteRow}>
        <Clock color={theme.colors.textSecondary} size={14} strokeWidth={2} />
        <Text style={styles.inviteText}>{scheduledDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      <View style={styles.inviteRow}>
        <MapPin color={theme.colors.textSecondary} size={14} strokeWidth={2} />
        <Text style={styles.inviteText}>{invite.location}</Text>
      </View>

      {invite.status === 'pending' ? (
        <View style={styles.inviteActions}>
          <Pressable style={[styles.inviteButton, styles.inviteDecline]} onPress={() => onRespond(message.id, false)}>
            <X color={theme.colors.textSecondary} size={16} strokeWidth={2} />
            <Text style={styles.inviteButtonText}>דחה</Text>
          </Pressable>
          <Pressable style={[styles.inviteButton, styles.inviteAccept]} onPress={() => onRespond(message.id, true)}>
            <Check color={theme.colors.black} size={16} strokeWidth={2} />
            <Text style={[styles.inviteButtonText, styles.inviteAcceptText]}>אשר</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={[styles.inviteStatus, invite.status === 'accepted' ? styles.inviteAccepted : styles.inviteDeclined]}>
          {invite.status === 'accepted' ? 'ההזמנה אושרה' : 'ההזמנה נדחתה'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  iconButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerName: {
    flex: 1,
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
    textAlign: 'center',
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.magenta,
  },
  bubblePartner: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
  },
  bubbleMineAlign: {
    alignSelf: 'flex-end',
  },
  bubblePartnerAlign: {
    alignSelf: 'flex-start',
  },
  bubbleText: {
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.text,
    textAlign: 'right',
  },
  bubbleTextMine: {
    color: theme.colors.black,
  },
  inviteCard: {
    width: '78%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  inviteTitle: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.cyan,
    textAlign: 'right',
    marginBottom: theme.spacing.xs,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  inviteText: {
    fontSize: 13,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  inviteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    minHeight: 48, // Touch target minimum
    borderRadius: theme.borderRadius.md,
  },
  inviteDecline: {
    backgroundColor: theme.colors.surfaceHover,
  },
  inviteAccept: {
    backgroundColor: theme.colors.cyan,
  },
  inviteButtonText: {
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  inviteAcceptText: {
    color: theme.colors.black,
  },
  inviteStatus: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  inviteAccepted: {
    color: theme.colors.cyan,
  },
  inviteDeclined: {
    color: theme.colors.textTertiary,
  },
  composer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceHover,
  },
  input: {
    flex: 1,
    minHeight: 48,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    color: theme.colors.text,
    fontSize: 14,
    textAlign: 'right',
    fontFamily: theme.typography.body.fontFamily,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
