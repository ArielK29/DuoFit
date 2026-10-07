import { supabase } from '@lib/supabase';

// Server side of the community (tables and security rules: supabase/migrations/20261007_community_posts.sql).
// The database decides what each member may see (blocked members, reported posts), the app only asks.

export interface RemotePost {
  id: string;
  userId: string;
  authorName: string;
  avatarUrl: string | null;
  activity: string;
  body: string;
  imageUrl: string | null;
  createdAt: string; // ISO
  likes: number;
  comments: number;
  liked: boolean;
}

export interface RemoteComment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  body: string;
  createdAt: string; // ISO
}

export type ReportReason = 'spam' | 'abuse' | 'inappropriate' | 'other';

const FEED_PAGE = 50;
const POST_IMAGES = 'post-images';

interface PostRow {
  id: string;
  user_id: string;
  activity: string;
  body: string;
  image_path: string | null;
  created_at: string;
  author: { display_name: string; avatar_url: string | null } | null;
  likes: { count: number }[];
  comment_count: { count: number }[];
}

interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author: { display_name: string } | null;
}

const FALLBACK_NAME = 'חבר/ה בקהילה';

function imageUrl(path: string | null): string | null {
  return path ? supabase.storage.from(POST_IMAGES).getPublicUrl(path).data.publicUrl : null;
}

export async function fetchFeed(me: string): Promise<RemotePost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, user_id, activity, body, image_path, created_at, author:profiles!posts_user_id_fkey(display_name, avatar_url), likes:post_likes(count), comment_count:comments(count)'
    )
    .order('created_at', { ascending: false })
    .limit(FEED_PAGE);
  if (error) throw error;
  const rows = (data ?? []) as unknown as PostRow[];
  if (rows.length === 0) return [];

  const mine = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', me)
    .in(
      'post_id',
      rows.map((row) => row.id)
    );
  if (mine.error) throw mine.error;
  const likedIds = new Set((mine.data ?? []).map((row: { post_id: string }) => row.post_id));

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    authorName: row.author?.display_name ?? FALLBACK_NAME,
    avatarUrl: row.author?.avatar_url ?? null,
    activity: row.activity,
    body: row.body,
    imageUrl: imageUrl(row.image_path),
    createdAt: row.created_at,
    likes: row.likes?.[0]?.count ?? 0,
    comments: row.comment_count?.[0]?.count ?? 0,
    liked: likedIds.has(row.id),
  }));
}

async function uploadPostImage(me: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const bytes = await response.arrayBuffer();
  const path = `${me}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from(POST_IMAGES).upload(path, bytes, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}

export async function createPost(
  me: string,
  id: string,
  input: { body: string; activity: string; localImageUri?: string }
): Promise<void> {
  const imagePath = input.localImageUri ? await uploadPostImage(me, input.localImageUri) : null;
  const { error } = await supabase
    .from('posts')
    .insert({ id, activity: input.activity, body: input.body, image_path: imagePath });
  if (error) {
    // The post was not saved: do not leave its picture behind.
    if (imagePath) await supabase.storage.from(POST_IMAGES).remove([imagePath]).catch(() => {});
    throw error;
  }
}

export async function deletePost(id: string): Promise<void> {
  const { data } = await supabase.from('posts').select('image_path').eq('id', id).maybeSingle();
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
  const path = (data as { image_path: string | null } | null)?.image_path;
  if (path) await supabase.storage.from(POST_IMAGES).remove([path]).catch(() => {});
}

export async function setLike(postId: string, liked: boolean, me: string): Promise<void> {
  const { error } = liked
    ? await supabase.from('post_likes').insert({ post_id: postId })
    : await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', me);
  // Liking twice (two phones) is the same as liking once.
  if (error && error.code !== '23505') throw error;
}

export async function fetchComments(postId: string): Promise<RemoteComment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('id, post_id, user_id, body, created_at, author:profiles!comments_user_id_fkey(display_name)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as unknown as CommentRow[]).map((row) => ({
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    authorName: row.author?.display_name ?? FALLBACK_NAME,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function addComment(id: string, postId: string, body: string): Promise<void> {
  const { error } = await supabase.from('comments').insert({ id, post_id: postId, body });
  if (error) throw error;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}

export async function reportContent(target: { postId?: string; commentId?: string }, reason: ReportReason): Promise<void> {
  const { error } = await supabase
    .from('content_reports')
    .insert({ post_id: target.postId ?? null, comment_id: target.commentId ?? null, reason });
  // Reporting the same thing twice is fine.
  if (error && error.code !== '23505') throw error;
}

export async function blockMember(blockedId: string): Promise<void> {
  const { error } = await supabase.from('user_blocks').insert({ blocked_id: blockedId });
  if (error && error.code !== '23505') throw error;
}

export async function unblockMember(blockedId: string, me: string): Promise<void> {
  const { error } = await supabase.from('user_blocks').delete().eq('blocker_id', me).eq('blocked_id', blockedId);
  if (error) throw error;
}

export interface BlockedMember {
  id: string;
  name: string;
}

export async function fetchBlocked(me: string): Promise<BlockedMember[]> {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id, member:profiles!user_blocks_blocked_id_fkey(display_name)')
    .eq('blocker_id', me);
  if (error) throw error;
  return ((data ?? []) as unknown as { blocked_id: string; member: { display_name: string } | null }[]).map((row) => ({
    id: row.blocked_id,
    name: row.member?.display_name ?? FALLBACK_NAME,
  }));
}
