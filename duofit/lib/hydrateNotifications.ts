import { useAuth } from '@hooks/useAuth';
import { RemoteNotificationRow, fetchNotifications } from '@lib/remoteNotifications';
import {
  useNotificationStore,
  AppNotification,
  flushPendingNotificationWrites,
  lastNotificationClearAt,
} from '@hooks/useNotificationStore';

const FALLBACK_NAME = 'חבר/ה';

// Turns a server row into the shape the in-app list shows (Hebrew text comes from the kind and the
// other member's name; the row only holds a short snapshot such as "כוח · פארק").
export function toAppNotification(row: RemoteNotificationRow): Omit<AppNotification, 'id'> & { remoteId: string } {
  const actor = row.actor?.display_name ?? FALLBACK_NAME;
  const body = row.body ?? '';
  const chat = row.actor_id ? { href: '/conversation', params: { partnerId: row.actor_id, partnerName: actor } } : {};
  const base = { remoteId: row.id, createdAt: row.created_at, read: row.read_at !== null, dedupeKey: `srv-${row.id}` };
  switch (row.kind) {
    case 'invite_received':
      return { ...base, kind: 'invite', title: actor, body: `הזמנה לאימון · ${body}`, ...chat };
    case 'invite_accepted':
      return { ...base, kind: 'invite', title: `${actor} אישר/ה את ההזמנה`, body, href: '/dashboard' };
    case 'invite_declined':
      return { ...base, kind: 'invite', title: `${actor} דחה/תה את ההזמנה`, body, ...chat };
    case 'workout_cancelled':
      return { ...base, kind: 'workout_cancelled', title: 'האימון בוטל', body: `${actor} ביטל/ה · ${body}`, href: '/dashboard' };
    default:
      return { ...base, kind: 'comment', title: `${actor} הגיב/ה על הפוסט שלך`, body, href: '/community' };
  }
}

let loading = false;
let again = false;

// Loads the member's saved notifications and merges them into the in-app list (the server decides
// what is read). Asking again while a load is running repeats it once afterwards.
export async function hydrateNotifications(): Promise<void> {
  const me = useAuth.getState().user?.id;
  if (!me) return;
  if (loading) {
    again = true;
    return;
  }
  loading = true;
  try {
    const startedAt = Date.now();
    await flushPendingNotificationWrites().catch(() => {});
    const rows = await fetchNotifications();
    if (useAuth.getState().user?.id !== me) return; // signed out while loading
    if (lastNotificationClearAt() >= startedAt) return; // the member cleared the list meanwhile: do not bring it back
    useNotificationStore.getState().mergeRemote(rows.map(toAppNotification));
  } catch {
    // Offline: keep what is on the phone.
  } finally {
    loading = false;
    if (again) {
      again = false;
      hydrateNotifications();
    }
  }
}
