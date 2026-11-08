// Sends the owner an e-mail for every new support request ("פנייה אלינו"), so he knows to open the admin list in the app.
//
// How it is called: a database trigger (supabase/migrations/20261107_support_notify_email.sql) calls this function right after
// a request is inserted. The function needs no caller identity because it does not trust the call for anything: it ignores the
// body and only looks at the requests that were never notified (at most 10, from the last 3 days) and mails them to the address
// in its own secret. A stranger who calls it can at most trigger a mail for a real request that was already waiting.
//
// Secrets (set by the owner in the Supabase dashboard, Edge Functions, Secrets; never in the repo):
//   RESEND_API_KEY        the key of the free Resend account
//   SUPPORT_NOTIFY_EMAIL  where the mails go (with the free Resend sender this must be the e-mail of the Resend account)
// Until both exist the function answers { configured: false } and changes nothing, so nothing is lost: the next call after
// they are set sends everything that is still waiting.
import { createClient } from 'npm:@supabase/supabase-js@2';

const TOPICS: Record<string, string> = {
  bug: 'תקלה באפליקציה',
  account: 'החשבון שלי',
  safety: 'בטיחות ודיווח',
  suggestion: 'הצעה לשיפור',
  other: 'משהו אחר',
};

const MAX_PER_CALL = 10;
const LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000;

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface Row {
  id: string;
  user_id: string;
  topic: string;
  message: string;
  app_version: string | null;
  created_at: string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return reply(405, { error: 'method not allowed' });

  // Trimmed: a pasted secret often carries a space or a line break at its end.
  const apiKey = (Deno.env.get('RESEND_API_KEY') ?? '').trim().replace(/^["']|["']$/g, '');
  const to = (Deno.env.get('SUPPORT_NOTIFY_EMAIL') ?? '').trim().replace(/^["']|["']$/g, '');
  if (!apiKey || !to) return reply(200, { configured: false, sent: 0 });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const since = new Date(Date.now() - LOOKBACK_MS).toISOString();
  const { data: waiting, error } = await admin
    .from('support_requests')
    .select('id')
    .is('notified_at', null)
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(MAX_PER_CALL);
  if (error) return reply(500, { error: 'could not read requests' });

  let sent = 0;
  let failure: { status: number; name: string } | null = null;
  for (const { id } of waiting ?? []) {
    // Claim the request first, so two calls at the same moment never send the same mail twice.
    const { data: claimed } = await admin
      .from('support_requests')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', id)
      .is('notified_at', null)
      .select('id, user_id, topic, message, app_version, created_at')
      .maybeSingle();
    if (!claimed) continue;
    const row = claimed as Row;

    const [{ data: profile }, { data: userData }] = await Promise.all([
      admin.from('profiles').select('display_name').eq('id', row.user_id).maybeSingle(),
      admin.auth.admin.getUserById(row.user_id),
    ]);
    const name = (profile?.display_name as string | null) || 'משתמש ללא שם';
    const email = userData?.user?.email ?? '';
    const topic = TOPICS[row.topic] ?? TOPICS.other;
    const when = new Date(row.created_at).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });

    const text = [
      `פנייה חדשה ב-FitFriend: ${topic}`,
      '',
      `מאת: ${name}${email ? ` (${email})` : ''}`,
      `נשלחה: ${when}`,
      row.app_version ? `גרסה: ${row.app_version}` : '',
      '',
      row.message,
      '',
      'לטיפול: באפליקציה, החשבון שלי ← פניות מהמשתמשים (מנהל).',
    ]
      .filter((line, index, all) => line !== '' || all[index - 1] !== '')
      .join('\n');

    const html = `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">
<h2 style="margin:0 0 8px">פנייה חדשה: ${escapeHtml(topic)}</h2>
<p style="margin:0;color:#555">מאת: ${escapeHtml(name)}${email ? ` (${escapeHtml(email)})` : ''}<br>נשלחה: ${escapeHtml(when)}${row.app_version ? `<br>גרסה: ${escapeHtml(row.app_version)}` : ''}</p>
<blockquote style="margin:16px 0;padding:12px 16px;background:#f4f4f4;border-radius:8px;white-space:pre-wrap">${escapeHtml(row.message)}</blockquote>
<p style="margin:0;color:#555">לטיפול: באפליקציה, החשבון שלי ← פניות מהמשתמשים (מנהל).</p>
</div>`;

    let ok = false;
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'FitFriend <onboarding@resend.dev>',
          to: [to],
          subject: `פנייה חדשה ב-FitFriend: ${topic}`,
          text,
          html,
        }),
      });
      ok = response.ok;
      if (!ok) {
        // The provider's answer goes to the function log (never to the caller: it can contain the address); the caller only learns the status and the error name.
        const answer = await response.text().catch(() => '');
        console.error('resend_failed', response.status, answer.slice(0, 300));
        failure = { status: response.status, name: (() => { try { return String(JSON.parse(answer).name ?? ''); } catch { return ''; } })() };
      }
    } catch (error) {
      ok = false;
      console.error('resend_request_error', String(error));
      failure = { status: 0, name: 'request_error' };
    }
    if (ok) {
      sent += 1;
    } else {
      // Not sent: release the claim so the next call tries again.
      await admin.from('support_requests').update({ notified_at: null }).eq('id', row.id);
    }
  }

  return reply(200, { configured: true, sent, ...(failure ? { failure } : {}) });
});
