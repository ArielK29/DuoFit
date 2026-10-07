// Deletes the signed-in member's account and everything that belongs to it.
// Apple requires an in-app way to delete an account (App Store guideline 5.1.1(v)).
//
// How it stays safe:
//  - the caller must send their own valid session token (the user id comes from that token, never from the request body);
//  - the service role key is only used here, on the server (Supabase provides it to the function; it is never in the app);
//  - the request must explicitly say { "confirm": true }.
//
// What it removes: the profile picture files in storage, then the auth user. The database does the rest by
// cascading: profile, conversations and their messages, read markers, weight log, goals and plank record,
// community posts, comments, likes, blocks and reports.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply(405, { error: 'method not allowed' });

  const authorization = req.headers.get('Authorization') ?? '';
  if (!authorization.toLowerCase().startsWith('bearer ')) return reply(401, { error: 'not signed in' });

  let confirmed = false;
  try {
    confirmed = (await req.json())?.confirm === true;
  } catch {
    confirmed = false;
  }
  if (!confirmed) return reply(400, { error: 'confirmation required' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Who is calling: validated by the auth server from the caller's own token.
  const caller = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data, error } = await caller.auth.getUser();
  if (error || !data.user) return reply(401, { error: 'not signed in' });
  const userId = data.user.id;

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // 1. The member's picture files: profile pictures and community post pictures (storage files are not
  //    removed by the database cascade). A member can have at most 500 posts, so one page of 1000 is enough.
  for (const bucket of ['avatars', 'post-images']) {
    const { data: files, error: listError } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
    if (listError) return reply(500, { error: 'could not list files' });
    if (files && files.length > 0) {
      const { error: removeError } = await admin.storage.from(bucket).remove(files.map((file) => `${userId}/${file.name}`));
      if (removeError) return reply(500, { error: 'could not remove files' });
    }
  }

  // 2. The account itself; the database cascades to all of the member's rows.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) return reply(500, { error: 'could not delete the account' });

  return reply(200, { ok: true });
});
