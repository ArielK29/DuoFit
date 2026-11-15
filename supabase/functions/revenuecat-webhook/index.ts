// Receives RevenueCat webhook events and records the member's paid tier in public.subscriptions.
//
// How it stays safe:
//  - only RevenueCat may call it: the request must carry the shared secret in the Authorization header
//    (the secret is a function secret, REVENUECAT_WEBHOOK_SECRET, set by the owner in the Supabase dashboard; never in the repo);
//  - the service role key is only used here, on the server (Supabase provides it to the function; it is never in the app);
//  - the member id comes from the verified RevenueCat event (the app logs in to RevenueCat with the Supabase user id), and
//    the pure mapEvent() refuses anything that is not a real uuid or a known product;
//  - nothing about the member is logged.
// The database function public.apply_subscription_event() orders writes by event time, so late or repeated events are harmless.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { mapEvent } from './mapEvent.ts';

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// Compares two strings without stopping at the first difference.
function sameSecret(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return reply(405, { error: 'method not allowed' });

  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') ?? '';
  const sent = req.headers.get('Authorization') ?? '';
  // Accept the secret alone or as "Bearer <secret>". An unset secret never matches anything.
  const token = sent.toLowerCase().startsWith('bearer ') ? sent.slice(7) : sent;
  if (secret.length < 16 || !sameSecret(token, secret)) return reply(401, { error: 'unauthorized' });

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return reply(400, { error: 'bad json' });
  }

  const row = mapEvent((payload as { event?: unknown } | null)?.event, Date.now());
  if (!row) return reply(200, { ignored: true }); // a test event, a pause, an unknown product: nothing to record, nothing to retry

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.rpc('apply_subscription_event', {
    p_user: row.userId,
    p_tier: row.tier,
    p_product: row.productId,
    p_status: row.status,
    p_expires_at: new Date(row.expiresAtMs).toISOString(),
    p_event_ms: row.eventMs,
  });
  if (error) {
    // 23503: the member no longer exists (account deleted). Nothing to keep, and a retry would never succeed.
    if (error.code === '23503') return reply(200, { ignored: true });
    return reply(500, { error: 'could not record' }); // RevenueCat retries a 5xx
  }
  return reply(200, { applied: data === true });
});
