import { ChatMessage, Conversation, ConversationSeed } from '@hooks/useChatStore';
import { EXAMPLE_CONVERSATIONS, ExampleConversation, SeedWhen } from '@constants/chatExamples';
import { theme } from '@styles/theme';

const WEEKDAY_LETTERS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
const AVATAR_COLORS = [theme.colors.cyan, theme.colors.magenta, theme.colors.warning];

export type ChatFilter = 'all' | 'groups' | 'personal';

export interface ChatRow {
  id: string;
  name: string;
  isGroup: boolean;
  verified: boolean;
  memberCount?: number;
  preview: string;
  sentAt: string | null;
  unread: number;
  streak?: number;
  // Set for example conversations that haven't been opened yet.
  seed?: ConversationSeed;
}

export function avatarColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 997;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function whenToDate(when: SeedWhen, now: Date): Date {
  if ('minutesAgo' in when) return new Date(now.getTime() - when.minutesAgo * 60000);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - when.daysAgo, when.hour, when.minute);
}

function seedToConversation(example: ExampleConversation, now: Date): ConversationSeed {
  return {
    partnerId: example.id,
    partnerName: example.name,
    isGroup: example.isGroup,
    members: example.members,
    memberCount: example.memberCount,
    verified: example.verified,
    streak: example.streak,
    messages: example.messages.map((message, index) => ({
      id: `${example.id}-${index}`,
      senderId: message.fromMe ? 'me' : 'partner',
      kind: 'text',
      text: message.text,
      senderName: message.senderName,
      sentAt: whenToDate(message.when, now).toISOString(),
    })),
  };
}

export function getUnreadCount(conversation: Conversation): number {
  if (!conversation.lastReadAt) return 0;
  const readAt = new Date(conversation.lastReadAt).getTime();
  return conversation.messages.filter(
    (message) => message.senderId === 'partner' && new Date(message.sentAt).getTime() > readAt
  ).length;
}

function exampleUnread(example: ExampleConversation): number {
  return example.messages.filter((message) => message.unread).length;
}

// Unread messages across real chats plus example chats that haven't been
// opened yet (used for the Chat tab badge).
export function getTotalUnread(conversations: Record<string, Conversation>): number {
  const real = Object.values(conversations).reduce((sum, conversation) => sum + getUnreadCount(conversation), 0);
  const examples = EXAMPLE_CONVERSATIONS.filter((example) => !conversations[example.id]).reduce(
    (sum, example) => sum + exampleUnread(example),
    0
  );
  return real + examples;
}

function previewOf(message: ChatMessage | undefined, isGroup: boolean): string {
  if (!message) return 'התחילו שיחה';
  if (message.kind === 'invite') return 'הזמנה לאימון';
  if (message.senderId === 'me') return `אתה: ${message.text}`;
  return isGroup && message.senderName ? `${message.senderName}: ${message.text}` : message.text;
}

interface BuildRowsInput {
  conversations: Record<string, Conversation>;
  scheduledPartners: Map<string, string>; // partnerId -> name
  streaks: Map<string, number>; // partnerId -> real streak
  isVerified: (partnerId: string) => boolean;
  now: Date;
}

export function buildRows({ conversations, scheduledPartners, streaks, isVerified, now }: BuildRowsInput): ChatRow[] {
  const rows = new Map<string, ChatRow>();

  Object.values(conversations).forEach((conversation) => {
    const last = conversation.messages[conversation.messages.length - 1];
    const isGroup = Boolean(conversation.isGroup);
    rows.set(conversation.partnerId, {
      id: conversation.partnerId,
      name: conversation.partnerName,
      isGroup,
      verified: conversation.verified ?? (!isGroup && isVerified(conversation.partnerId)),
      memberCount: conversation.memberCount,
      preview: previewOf(last, isGroup),
      sentAt: last?.sentAt ?? null,
      unread: getUnreadCount(conversation),
      streak: streaks.get(conversation.partnerId) ?? conversation.streak,
    });
  });

  scheduledPartners.forEach((name, partnerId) => {
    if (rows.has(partnerId)) return;
    rows.set(partnerId, {
      id: partnerId,
      name,
      isGroup: false,
      verified: isVerified(partnerId),
      preview: 'התחילו שיחה',
      sentAt: null,
      unread: 0,
      streak: streaks.get(partnerId),
    });
  });

  EXAMPLE_CONVERSATIONS.forEach((example) => {
    if (rows.has(example.id)) return;
    const seed = seedToConversation(example, now);
    const last = seed.messages[seed.messages.length - 1];
    rows.set(example.id, {
      id: example.id,
      name: example.name,
      isGroup: Boolean(example.isGroup),
      verified: Boolean(example.verified),
      memberCount: example.memberCount,
      preview: previewOf(last, Boolean(example.isGroup)),
      sentAt: last.sentAt,
      unread: exampleUnread(example),
      streak: example.streak,
      seed,
    });
  });

  return Array.from(rows.values()).sort((a, b) => {
    if (!a.sentAt && !b.sentAt) return 0;
    if (!a.sentAt) return 1;
    if (!b.sentAt) return -1;
    return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
  });
}

export function formatListTime(iso: string, now: Date): string {
  const date = new Date(iso);
  const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((dayStart(now) - dayStart(date)) / 86400000);

  if (dayDiff <= 0) return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  if (dayDiff === 1) return 'אתמול';
  if (dayDiff < 7) return WEEKDAY_LETTERS[date.getDay()];
  return `${date.getDate()}.${date.getMonth() + 1}`;
}
