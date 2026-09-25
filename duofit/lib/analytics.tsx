import React from 'react';
import PostHog, { PostHogProvider } from 'posthog-react-native';

// PostHog project API key and ingestion host, injected at build time via
// EXPO_PUBLIC_* env vars (see .env.local / .env.example). This is a public,
// client-side write-only key — safe to ship in the app bundle — but it still
// lives in an env var rather than being hardcoded here, per good practice.
const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

if (!POSTHOG_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[analytics] EXPO_PUBLIC_POSTHOG_API_KEY is not set — analytics events will be no-ops. ' +
      'Add it to duofit/.env.local (see .env.example).'
  );
}

// Single shared client instance. Created manually (rather than letting
// PostHogProvider create its own internally) so this same instance can be
// reused both by <AnalyticsProvider> in the root layout (for lifecycle
// handling/autocapture) and by trackEvent() below, so screens never need to
// import `posthog-react-native` directly.
export const posthogClient = POSTHOG_API_KEY
  ? new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      // Automatically capture unhandled JS exceptions and send them to
      // PostHog's Error Tracking product. This is a pure-JS feature of the
      // base posthog-react-native package — no native module required, safe
      // in Expo Go. (Native crash capture, which DOES require the
      // @posthog/react-native-plugin add-on, is not enabled here.)
      errorTracking: { autocapture: true },
    })
  : null;

/**
 * Capture a PostHog analytics event. Safe to call even if PostHog failed to
 * initialize (e.g. missing API key) — it's a no-op in that case instead of
 * throwing.
 *
 * `properties` is intentionally typed as a plain `Record<string, unknown>`
 * (rather than PostHog's stricter JSON-only property type) so call sites
 * don't need to import PostHog's types just to pass event metadata; it's
 * narrowed at this single boundary instead.
 */
export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  posthogClient?.capture(name, properties as any);
}

/**
 * Log a non-fatal warning to PostHog's Logs product. Safe to call even if
 * PostHog failed to initialize — no-op in that case, same pattern as
 * `trackEvent`.
 */
export function logWarn(message: string, properties?: Record<string, unknown>): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  posthogClient?.logger.warn(message, properties as any);
}

/**
 * Log a handled error (something failed, but the app recovered — e.g. a
 * caught exception in a try/catch) to PostHog's Logs product. For
 * *unhandled* exceptions, rely on the automatic `errorTracking.autocapture`
 * configured above instead — this function is for failures the app already
 * caught and is deliberately continuing past.
 */
export function logError(message: string, properties?: Record<string, unknown>): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  posthogClient?.logger.error(message, properties as any);
}

/**
 * Wraps the app in PostHog's context provider. Falls back to rendering
 * children unwrapped when PostHog couldn't be initialized (e.g. missing API
 * key in local dev), so a missing env var degrades to "no analytics" instead
 * of a crash.
 *
 * `autocapture={false}`: PostHog's default autocapture relies on
 * `@react-navigation/native` for screen tracking, which this app doesn't
 * depend on directly (Expo Router doesn't hoist it into the tree here), so
 * autocapture silently does nothing anyway. Disabling it explicitly makes
 * "manual events only, via trackEvent()" an intentional, documented choice
 * rather than an accidental no-op — flip this on (and audit route params
 * like phoneNumber for PII first) if screen-level autocapture is wanted later.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  if (!posthogClient) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider client={posthogClient} autocapture={false}>
      {children}
    </PostHogProvider>
  );
}
