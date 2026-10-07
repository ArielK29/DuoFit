import { supabase } from '@lib/supabase';
import type { ChatMessage, Conversation, WorkoutInvite } from '@hooks/useChatStore';

// Server side of 1:1 chat (tables and security rules: supabase/migrations/
// 20261007_chat_conversations_messages.sql). The conversation key used by the app is
// the OTHER member's user id, the same key the screens already use.

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  kind: 'text' | 'invite';
  body: string | null;
  invite: WorkoutInvite | null;
  created_at: string;
}

interface ConversationRow {
  id: string;
  user_a: string;
  user_b: string;
}

const MESSAGE_COLUMNS = 'id, conversation_id, sender_id, kind, body, invite, created_at';
const MESSAGE_LIMIT = 500;

// A pair is stored in a fixed order (user_a < user_b) so it has exactly one conversation.
export function orderPair(x: string, y: string): [string, string] {
  return x < y ? [x, y] : [y, x];
}

const conversationIds = new Map<string, string>(); // other user id -> conversation id
const partnerIds = new Map<string, string>(); // conversation id -> other user id

export function partnerIdForConversation(conversationId: string): string | undefined {
  return partnerIds.get(conversationId);
}

export function conversationIdForPartner(partnerId: string): string | undefined {
  return conversationIds.get(partnerId);
}

function remember(conversation: ConversationRow, myId: string) {
  const other = conversation.user_a === myId ? conversation.user_b : conversation.user_a;
  conversationIds.set(other, conversation.id);
  partnerIds.set(conversation.id, other);
  return other;
}

export function clearRemoteChatCache() {
  conversationIds.clear();
  partnerIds.clear();
}

export function toChatMessage(row: MessageRow, myId: string): ChatMessage {
  const base = { id: row.id, senderId: row.sender_id === myId ? ('me' as const) : ('partner' as const), sentAt: row.created_at };
  if (row.kind === 'invite' && row.invite) return { ...base, kind: 'invite', invite: row.invite };
  return { ...base, kind: 'text', text: row.body ?? '' };
}

// Finds (or creates) the conversation with another member.
export async function ensureRemoteConversation(myId: string, partnerId: string): Promise<string> {
  const cached = conversationIds.get(partnerId);
  if (cached) return cached;
  const [a, b] = orderPair(myId, partnerId);

  const find = async () => {
    const { data } = await supabase.from('conversations').select('id, user_a, user_b').eq('user_a', a).eq('user_b', b).maybeSingle();
    return data as ConversationRow | null;
  };

  let row = await find();
  if (!row) {
    const { data, error } = await supabase.from('conversations').insert({ user_a: a, user_b: b }).select('id, user_a, user_b').single();
    if (error) {
      // Both people opened the chat at the same moment: the other insert won, read it.
      row = await find();
      if (!row) throw error;
    } else {
      row = data as ConversationRow;
    }
  }
  remember(row, myId);
  return row.id;
}

// The message id is created on the phone, so the live copy that comes back through Realtime
// and the answer to the send request are recognised as the same message.
export async function sendRemoteText(conversationId: string, id: string, text: string): Promise<MessageRow> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ id, conversation_id: conversationId, kind: 'text', body: text })
    .select(MESSAGE_COLUMNS)
    .single();
  if (error) throw error;
  return data as MessageRow;
}

export async function sendRemoteInvite(conversationId: string, id: string, invite: Omit<WorkoutInvite, 'status'>): Promise<MessageRow> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ id, conversation_id: conversationId, kind: 'invite', invite: { ...invite, status: 'pending' } })
    .select(MESSAGE_COLUMNS)
    .single();
  if (error) throw error;
  return data as MessageRow;
}

// Only the OTHER member can answer, and only once (enforced by the database).
export async function answerRemoteInvite(messageId: string, invite: WorkoutInvite, accept: boolean): Promise<void> {
  const { data, error } = await supabase
    .from('messages')
    .update({ invite: { ...invite, status: accept ? 'accepted' : 'declined' } })
    .eq('id', messageId)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('invitation could not be answered');
}

export async function markRemoteRead(conversationId: string, myId: string): Promise<void> {
  await supabase
    .from('conversation_reads')
    // The database stamps the time itself (server clock).
    .upsert({ conversation_id: conversationId, user_id: myId, last_read_at: new Date().toISOString() }, { onConflict: 'conversation_id,user_id' });
}

// Loads every conversation of the signed-in member with its messages and read marker.
export async function fetchRemoteConversations(myId: string): Promise<Record<string, Conversation>> {
  const { data: convRows, error } = await supabase.from('conversations').select('id, user_a, user_b');
  if (error) throw error;
  const conversations = (convRows ?? []) as ConversationRow[];
  if (conversations.length === 0) return {};

  const ids = conversations.map((conversation) => conversation.id);
  const [messagesResult, readsResult] = await Promise.all([
    // The newest messages (the default API page is 1000 rows, so it is capped on purpose).
    supabase.from('messages').select(MESSAGE_COLUMNS).in('conversation_id', ids).order('created_at', { ascending: false }).limit(MESSAGE_LIMIT),
    supabase.from('conversation_reads').select('conversation_id, last_read_at').in('conversation_id', ids),
  ]);
  if (messagesResult.error) throw messagesResult.error;

  const others = conversations.map((conversation) => remember(conversation, myId));
  const { data: profileRows } = await supabase.from('profiles').select('id, display_name').in('id', others);
  const names = new Map<string, string>(((profileRows ?? []) as { id: string; display_name: string }[]).map((row) => [row.id, row.display_name]));
  const reads = new Map<string, string>(
    ((readsResult.data ?? []) as { conversation_id: string; last_read_at: string }[]).map((row) => [row.conversation_id, row.last_read_at])
  );

  const result: Record<string, Conversation> = {};
  for (const conversation of conversations) {
    const other = partnerIds.get(conversation.id)!;
    const messages = ((messagesResult.data ?? []) as MessageRow[])
      .filter((row) => row.conversation_id === conversation.id)
      .reverse()
      .map((row) => toChatMessage(row, myId));
    result[other] = {
      partnerId: other,
      partnerName: names.get(other) ?? 'חבר/ה',
      messages,
      // No read marker yet = never opened: every message from the partner counts as unread.
      lastReadAt: reads.get(conversation.id) ?? new Date(0).toISOString(),
    };
  }
  return result;
}

export interface RemoteChatHandlers {
  onInsert: (row: MessageRow) => void;
  onUpdate: (row: MessageRow) => void;
  // Called every time the live connection is (re)established: load what was missed meanwhile.
  onSubscribed?: () => void;
}

// Live delivery through Supabase Realtime. It respects the same row-level security, so a
// member only ever receives messages of their own conversations. Returns the unsubscribe function.
export function subscribeRemoteChat(myId: string, handlers: RemoteChatHandlers): () => void {
  const channel = supabase
    .channel(`chat-${myId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => handlers.onInsert(payload.new as MessageRow))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => handlers.onUpdate(payload.new as MessageRow))
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') handlers.onSubscribed?.();
    });
  return () => {
    supabase.removeChannel(channel);
  };
}
