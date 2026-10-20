// Links that come back from Supabase e-mails (password reset), and the check of the new password. Pure: no React, no network.
import { MIN_PASSWORD_LENGTH } from './authErrors.ts';

export type AuthLink =
  | { kind: 'session'; accessToken: string; refreshToken: string; type: string | null }
  | { kind: 'code'; code: string }
  | { kind: 'error'; code: string | null; expired: boolean }
  | { kind: 'none' };

const NONE: AuthLink = { kind: 'none' };

// Supabase puts the result in the fragment (#access_token=...) or in the query (?code=...), and errors in either.
// Order of importance: an error, then tokens, then a one-time code. Incomplete or unrelated links are "none".
export function parseAuthLink(url: string | null | undefined): AuthLink {
  if (typeof url !== 'string' || !url.trim()) return NONE;
  const text = url.trim();
  const hashAt = text.indexOf('#');
  const hash = hashAt >= 0 ? text.slice(hashAt + 1) : '';
  const beforeHash = hashAt >= 0 ? text.slice(0, hashAt) : text;
  const queryAt = beforeHash.indexOf('?');
  const query = queryAt >= 0 ? beforeHash.slice(queryAt + 1) : '';
  const fromHash = new URLSearchParams(hash);
  const fromQuery = new URLSearchParams(query);
  const pick = (key: string): string | null => fromHash.get(key) || fromQuery.get(key) || null;

  if (pick('error')) {
    const code = pick('error_code');
    const description = pick('error_description') ?? '';
    return { kind: 'error', code, expired: code === 'otp_expired' || /expired/i.test(description) };
  }
  const accessToken = pick('access_token');
  const refreshToken = pick('refresh_token');
  if (accessToken && refreshToken) return { kind: 'session', accessToken, refreshToken, type: pick('type') };
  const code = pick('code');
  if (code) return { kind: 'code', code };
  return NONE;
}

// What the member reads when the link cannot be used. Empty for a usable link.
export function recoveryLinkMessage(link: AuthLink): string {
  if (link.kind === 'session' || link.kind === 'code') return '';
  if (link.kind === 'error' && link.expired) return 'הקישור פג תוקף. בקש קישור חדש לאיפוס הסיסמה.';
  return 'הקישור לא תקין. בקש קישור חדש לאיפוס הסיסמה.';
}

// Same idea for the sign-up confirmation link. Empty for a usable link.
export function confirmationLinkMessage(link: AuthLink): string {
  if (link.kind === 'session' || link.kind === 'code') return '';
  if (link.kind === 'error' && link.expired) return 'הקישור פג תוקף. התחבר, ואם האימייל עוד לא אומת תוכל לבקש קישור חדש.';
  return 'הקישור לא תקין. אם כבר אימתת את האימייל, התחבר. אחרת התחבר ותוכל לבקש קישור חדש.';
}

// The buttons under a bad e-mail link. A member who is already signed in cannot open the sign-in or
// forgot-password screens (they are closed to signed-in members), so for them the only exit is the app.
export function invalidLinkExits(
  signedIn: boolean,
  flow: 'reset' | 'confirm'
): { label: string; href: '/' | '/forgot-password' | '/login' }[] {
  if (signedIn) return [{ label: 'חזרה לאפליקציה', href: '/' }];
  if (flow === 'reset') {
    return [
      { label: 'בקש קישור חדש', href: '/forgot-password' },
      { label: 'חזרה להתחברות', href: '/login' },
    ];
  }
  return [{ label: 'להתחברות', href: '/login' }];
}

// The new password and its confirmation. Returns a Hebrew message, or null when both are fine.
export function validateNewPassword(password: string, confirm: string): string | null {
  if (!password) return 'הזן סיסמה חדשה';
  if (!password.trim()) return 'הסיסמה לא יכולה להכיל רק רווחים';
  if (password.length < MIN_PASSWORD_LENGTH) return `הסיסמה צריכה להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים`;
  if (password !== confirm) return 'הסיסמאות לא זהות';
  return null;
}
// The shape of a link for the developer log, with every value removed (the tokens in it are secrets): where it points, whether it
// has a fragment or a query, and the names of what is in them. Only `type` and `error_code` values are shown.
export function describeAuthLink(url: string | null | undefined): string {
  if (typeof url !== 'string' || !url.trim()) return 'no link';
  const text = url.trim();
  const hashAt = text.indexOf('#');
  const beforeHash = hashAt >= 0 ? text.slice(0, hashAt) : text;
  const queryAt = beforeHash.indexOf('?');
  const target = queryAt >= 0 ? beforeHash.slice(0, queryAt) : beforeHash;
  const show = (params: URLSearchParams): string =>
    [...params.keys()].map((key) => (key === 'type' || key === 'error_code' ? `${key}=${params.get(key)}` : key)).join(',');
  const parts = [target];
  parts.push(hashAt >= 0 ? `hash[${show(new URLSearchParams(text.slice(hashAt + 1)))}]` : 'no fragment');
  if (queryAt >= 0) parts.push(`query[${show(new URLSearchParams(beforeHash.slice(queryAt + 1)))}]`);
  return parts.join(' ');
}
