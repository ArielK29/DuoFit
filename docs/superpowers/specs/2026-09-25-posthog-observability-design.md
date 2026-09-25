# PostHog Observability: Error Tracking + Logs — Design

**Date:** 2026-09-25 · **Status:** Approved for implementation

## Problem

DuoFit has basic PostHog product analytics (PR #23: signup funnel events) but no visibility into crashes or non-fatal failures. If the app breaks for a real user, nobody finds out until they complain. Full Session Replay was also requested, but PostHog's React Native session replay requires the `@posthog/react-native-plugin` native module, which cannot run in Expo Go — this app is tested exclusively via Expo Go on a physical device, so adopting it now would force a switch to a Development Build (EAS Build / `expo run:android`), a significant workflow change. Session Replay is explicitly deferred to a follow-up issue for when the project is ready for that switch (e.g. approaching a production release).

## Scope

**In scope**, both confirmed JS-only and Expo Go compatible per current PostHog docs (`posthog.com/docs/error-tracking/installation/react-native`, `posthog.com/docs/logs/installation/react-native`):
1. **Error Tracking** — automatic capture of unhandled JS exceptions, plus a root-level React error boundary so a component crash shows a friendly Hebrew fallback screen instead of a white screen / app crash.
2. **Logs** — a thin structured-logging wrapper around `posthog.logger.*`, replacing the app's one existing `console.warn` and added to existing failure-handling code paths that don't already report anywhere.

**Out of scope:** Session Replay (native plugin required, deferred — tracked in a new follow-up issue), native crash capture (same native-plugin requirement), source map upload / CI pipeline (only needed for readable stack traces on top of already-working error capture — can follow later without blocking this).

## Design

### 1. Error Tracking

`duofit/lib/analytics.tsx`: add `errorTracking: { autocapture: true }` to the `PostHog` client constructor options alongside the existing `host`. This is the documented client-side opt-in for automatic unhandled-exception capture — no new dependencies needed (`posthog-react-native`'s existing peer deps already cover this).

`duofit/src/app/_layout.tsx`: wrap the existing `<Stack>` (inside `AnalyticsProvider`, which already wraps everything) in `PostHogErrorBoundary` from `posthog-react-native`, with a new fallback component:

```
duofit/components/ErrorFallback.tsx
```
A small, dark-mode, RTL, Hebrew screen: a short apologetic message ("משהו השתבש" — Something went wrong) plus a "נסה שוב" (Try Again) button that calls the error boundary's reset callback (`PostHogErrorBoundary`'s `fallback` render prop receives `{ error, componentStack }`; check the current API for a reset function — if the SDK's boundary doesn't expose one directly, reset via forcing a remount, e.g. a `key` bump on the boundary held in local state at the `_layout.tsx` level). Follows this app's existing component conventions: `theme` import, no hardcoded colors, `theme.typography` fonts, 48px touch target on the button.

### 2. Logs

`duofit/lib/analytics.tsx`: add two thin exports:
```ts
export function logWarn(message: string, properties?: Record<string, unknown>): void
export function logError(message: string, properties?: Record<string, unknown>): void
```
Each delegates to `posthogClient?.logger.warn(...)` / `.error(...)` (optional-chained, consistent with the existing `trackEvent` no-op-when-uninitialized pattern). No `logInfo`/`logDebug` for now — YAGNI, add when there's an actual call site that needs them.

**Call sites to update** (replace/add, don't restructure surrounding logic):
- `duofit/lib/analytics.tsx`'s own missing-API-key `console.warn` → `logWarn` (but this one is a bootstrapping edge case — keep the `console.warn` too, since if PostHog itself failed to init, `logWarn` would also silently no-op and the developer would see nothing at all in that specific case; this is the one call site that legitimately needs both).
- `duofit/screens/login/ProfileSetupScreen.tsx`'s `pickAvatar` catch block (currently sets a UI error string but doesn't report anywhere) → add `logError('avatar_picker_failed', { error: String(err) })` alongside the existing UI error handling.

That's the full initial call-site list — small and proportionate to the app's current size, per the approved "Minimal Observability" approach. Future screens should follow the same pattern (report real failures via `logError`/`logWarn`, not verbose breadcrumb logging).

## Testing

Manual verification via Expo Go (per this project's established pattern — no automated test infra exists):
1. Force a render-time exception (temporarily, for the test only) to confirm `PostHogErrorBoundary` shows the Hebrew fallback screen instead of a white screen/crash, and "נסה שוב" recovers the app.
2. Confirm an unhandled exception (e.g. a temporary thrown error in an event handler) appears in PostHog's Error Tracking product page.
3. Trigger the avatar-picker failure path (deny photo permission) and confirm a `logError` entry appears in PostHog's Logs product page.
4. Confirm no regression to the existing signup funnel events (PR #23) — full signup flow still fires `signup_started` → `profile_completed`.

## Risks

- PostHog's project-level "Enable exception autocapture" setting (mentioned in docs as supporting remote config override) wasn't found as a directly toggleable field via the MCP tools inspected (`error-tracking-settings-get` only exposes rate limits) — proceeding on the assumption it's enabled by default for a fresh project as the docs imply; if events don't appear in testing, check `app.posthog.com/settings/project-error-tracking` manually as a fallback debugging step.
- `PostHogErrorBoundary`'s exact reset-callback API should be confirmed against current `posthog-react-native` type definitions during implementation, not assumed from this spec — the fallback-remount approach described above is a safe manual alternative if no built-in reset exists.
