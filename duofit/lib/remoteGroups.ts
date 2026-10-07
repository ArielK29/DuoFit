import { supabase } from '@lib/supabase';

// Server side of the community groups and their chat (tables and rules:
// supabase/migrations/20261007_groups.sql). The database decides who may read what; the app only asks.

export interface RemoteGroup {
  id: string;
  name: string;
  activity: string;
  memberCount: number;
}

export interface GroupMessageRow {
  id: string;
  group_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

interface GroupMessageWithSender extends GroupMessageRow {
  sender: { display_name: string } | null;
}

export const GROUP_ACTIVITIES = ['כוח', 'ריצה', 'קליסטניקס', 'כדורסל', 'יוגה'];
const FALLBACK_NAME = 'חבר/ה';
const MESSAGE_LIMIT = 100;

// Group chats live in the chat list under this key (the same key shape the demo groups use).
export const GROUP_PREFIX = 'group-';
export const toGroupKey = (groupId: string) => `${GROUP_PREFIX}${groupId}`;
export const isGroupKey = (key: string) => key.startsWith(GROUP_PREFIX);
export const groupIdFromKey = (key: string) => key.slice(GROUP_PREFIX.length);

export async function fetchGroups(): Promise<RemoteGroup[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, activity, member_count')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((row: { id: string; name: string; activity: string; member_count: number }) => ({
    id: row.id,
    name: row.name,
    activity: row.activity,
    memberCount: row.member_count,
  }));
}

export async function fetchMyGroupIds(me: string): Promise<string[]> {
  const { data, error } = await supabase.from('group_members').select('group_id').eq('user_id', me);
  if (error) throw error;
  return (data ?? []).map((row: { group_id: string }) => row.group_id);
}

export async function createGroup(name: string, activity: string): Promise<string> {
  const { data, error } = await supabase.from('groups').insert({ name: name.trim(), activity }).select('id').single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function joinGroup(groupId: string): Promise<void> {
  const { error } = await supabase.from('group_members').insert({ group_id: groupId });
  if (error && error.code !== '23505') throw error; // already a member is fine
}

export async function leaveGroup(groupId: string, me: string): Promise<void> {
  const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', me);
  if (error) throw error;
}

export interface GroupMessageView {
  row: GroupMessageRow;
  senderName: string;
}

export async function fetchGroupMessages(groupId: string): Promise<GroupMessageView[]> {
  const { data, error } = await supabase
    .from('group_messages')
    .select('id, group_id, sender_id, body, created_at, sender:profiles!group_messages_sender_id_fkey(display_name)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(MESSAGE_LIMIT);
  if (error) throw error;
  return ((data ?? []) as unknown as GroupMessageWithSender[])
    .reverse()
    .map((item) => ({ row: item, senderName: item.sender?.display_name ?? FALLBACK_NAME }));
}

export async function sendGroupMessage(id: string, groupId: string, body: string): Promise<GroupMessageRow> {
  const { data, error } = await supabase
    .from('group_messages')
    .insert({ id, group_id: groupId, body })
    .select('id, group_id, sender_id, body, created_at')
    .single();
  if (error) throw error;
  return data as GroupMessageRow;
}

export async function reportGroupMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('content_reports')
    .insert({ group_message_id: messageId, reason: 'inappropriate' });
  if (error && error.code !== '23505') throw error;
}

export async function fetchMemberName(userId: string): Promise<string> {
  const { data } = await supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle();
  return (data as { display_name: string } | null)?.display_name ?? FALLBACK_NAME;
}

// New group messages for the groups the member belongs to (the database only sends the allowed rows).
export function subscribeGroupMessages(
  me: string,
  handlers: { onInsert: (row: GroupMessageRow) => void; onSubscribed: () => void }
): () => void {
  const channel = supabase
    .channel(`groups-${me}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, (payload) =>
      handlers.onInsert(payload.new as GroupMessageRow)
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') handlers.onSubscribed();
    });
  return () => {
    supabase.removeChannel(channel);
  };
}
