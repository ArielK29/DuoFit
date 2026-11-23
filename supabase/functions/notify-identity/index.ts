// Sends the reviewers ONE e-mail when identity checks are waiting ("בדיקת זהות חדשה"), so they know to open the review screen.
//
// How it is called: a database trigger (supabase/migrations/20261123_identity_review_alert.sql) calls this function right after a
// check becomes pending. The function trusts nothing in the call: it ignores the body and only looks at alerts that were never
// mailed. A stranger who calls it can at most trigger the mail for a real waiting check.
//
// The mail contains only the number of waiting checks. No names, no e-mail addresses, no video, no file link.
//
// Secrets (set by the owner in the Supabase dashboard, Edge Functions, Secrets; never in the repo):
//   RESEND_API_KEY           the key of the Resend account (the same one notify-support uses)
//   IDENTITY_NOTIFY_EMAILS   reviewer addresses, comma separated (falls back to SUPPORT_NOTIFY_EMAIL)
// With the free Resend sender (onboarding@resend.dev) mails can go ONLY to the address of the Resend account. To mail several
// reviewers, verify a sender domain in Resend first (a DNS step the owner does).
// Until the secrets exist the function answers { configured: false } and changes nothing; the next call after they are set sends.
import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_RECIPIENTS = 5;

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function clean(value: string | undefined): string {
  // Trimmed: a pasted secret often carries a space or a line break at its end.
  return (value ?? '').trim().replace(/^["']|["']$/g, '');
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return reply(405, { error: 'method not allowed' });

  const apiKey = clean(Deno.env.get('RESEND_API_KEY'));
  const list = clean(Deno.env.get('IDENTITY_NOTIFY_EMAILS')) || clean(Deno.env.get('SUPPORT_NOTIFY_EMAIL'));
  const recipients = list
    .split(',')
    .map((address) => address.trim())
    .filter((address) => address.includes('@'))
    .slice(0, MAX_RECIPIENTS);
  if (!apiKey || recipients.length === 0) return reply(200, { configured: false, sent: 0 });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Claim every alert that was not mailed, so two calls at the same moment never send twice.
  const { data: claimed, error } = await admin
    .from('identity_alerts')
    .update({ notified_at: new Date().toISOString() })
    .is('notified_at', null)
    .select('user_id');
  if (error) return reply(500, { error: 'could not read alerts' });
  if (!claimed || claimed.length === 0) return reply(200, { configured: true, sent: 0 });

  const { count } = await admin.from('identity_checks').select('user_id', { count: 'exact', head: true }).eq('status', 'pending');
  const waiting = count ?? claimed.length;

  const subject = `בדיקת זהות חדשה מחכה ב-FitFriend (${waiting} ממתינות)`;
  const text = [
    `יש ${waiting} בדיקות זהות שממתינות לאישור ב-FitFriend.`,
    '',
    'לטיפול: באפליקציה, החשבון שלי ← בדיקות אימות (מנהל). המטרה: תשובה תוך 24 שעות.',
  ].join('\n');
  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">
<h2 style="margin:0 0 8px">בדיקת זהות חדשה מחכה</h2>
<p style="margin:0">יש <b>${waiting}</b> בדיקות זהות שממתינות לאישור.</p>
<p style="margin:12px 0 0;color:#555">לטיפול: באפליקציה, החשבון שלי ← בדיקות אימות (מנהל). המטרה: תשובה תוך 24 שעות.</p>
</div>`;

  let ok = false;
  let failure: { status: number; name: string } | null = null;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'FitFriend <onboarding@resend.dev>', to: recipients, subject, text, html }),
    });
    ok = response.ok;
    if (!ok) {
      // The provider's answer goes to the function log only (it can contain an address); the caller learns the status and the error name.
      const answer = await response.text().catch(() => '');
      console.error('resend_failed', response.status, answer.slice(0, 300));
      failure = { status: response.status, name: (() => { try { return String(JSON.parse(answer).name ?? ''); } catch { return ''; } })() };
    }
  } catch (err) {
    console.error('resend_request_error', String(err));
    failure = { status: 0, name: 'request_error' };
  }

  if (!ok) {
    // Not sent: release the claim so the next call tries again.
    await admin
      .from('identity_alerts')
      .update({ notified_at: null })
      .in('user_id', claimed.map((row) => row.user_id as string));
    return reply(200, { configured: true, sent: 0, ...(failure ? { failure } : {}) });
  }
  return reply(200, { configured: true, sent: 1, waiting });
});
