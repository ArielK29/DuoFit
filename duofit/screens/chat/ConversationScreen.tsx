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
import { ArrowLeft, Send } from 'lucide-react-native';
import { useChatStore, AUTO_REPLY_DELAY_MS } from '@hooks/useChatStore';
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={theme.colors.magenta} size={22} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerName}>{partnerName}</Text>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.messagesList}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[styles.bubble, message.senderId === 'me' ? styles.bubbleMine : styles.bubblePartner]}
          >
            <Text style={[styles.bubbleText, message.senderId === 'me' && styles.bubbleTextMine]}>
              {message.text}
            </Text>
          </View>
        ))}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerName: {
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
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
  bubbleText: {
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.text,
    textAlign: 'right',
  },
  bubbleTextMine: {
    color: theme.colors.black,
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
