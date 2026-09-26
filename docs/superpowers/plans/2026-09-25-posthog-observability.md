# PostHog Observability (Error Tracking + Logs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automatic JS exception capture with a Hebrew/RTL fallback UI, plus a thin structured-logging wrapper, to the existing PostHog integration in the DuoFit Expo app.

**Architecture:** Extend the existing `lib/analytics.tsx` module (already exports `posthogClient`, `trackEvent`, `AnalyticsProvider` from the prior PostHog analytics work) with error-tracking config and two logging helpers. Wrap the app's existing navigator in `PostHogErrorBoundary` at the root layout, with a new small fallback component matching this app's existing dark/RTL/Hebrew UI conventions. Wire the one existing unreported failure path (avatar picker) into the new logging helper.

**Tech Stack:** `posthog-react-native@4.77.1` (already installed, no new dependencies needed — error tracking and logs are both pure-JS features of the already-installed package). Expo SDK 57, Expo Router, TypeScript, React Native `StyleSheet`.

**Spec:** `docs/superpowers/specs/2026-09-25-posthog-observability-design.md`

## Global Constraints

- No new npm packages — `posthog-react-native`'s existing installation already covers everything in this plan (confirmed: `errorTracking` config, `PostHogErrorBoundary` component, and `posthog.logger.*` are all part of the base package, not the native `@posthog/react-native-plugin` add-on).
- Session Replay is explicitly out of scope (tracked separately in issue #25) — do not add `enableSessionReplay`, `@posthog/react-native-plugin`, or any session-replay config in this plan.
- All new/changed UI must follow this app's existing conventions: import `theme` from `@styles/theme`, no hardcoded hex colors, `theme.typography.*.fontFamily` for text, plain `flexDirection: 'row'` never `'row-reverse'` for RTL (Yoga auto-mirrors `'row'` once `I18nManager.forceRTL(true)` is set — this app already calls that), 48px minimum touch target on interactive elements, Hebrew UI text.
- No automated test framework exists in this repo (confirmed: no Jest config, no test files). Verification in this plan is `npx tsc --noEmit` (run from `duofit/`) plus manual on-device verification via Expo Go, matching this project's established pattern from all prior PRs.
- This app is tested exclusively via Expo Go on a physical device — nothing in this plan may require a native rebuild or Development Build.

---

### Task 1: Add error tracking config and logging helpers to `lib/analytics.tsx`

**Files:**
- Modify: `duofit/lib/analytics.tsx`

**Interfaces:**
- Consumes: nothing new (uses the existing `posthogClient` constant already defined in this file).
- Produces: `logWarn(message: string, properties?: Record<string, unknown>): void` and `logError(message: string, properties?: Record<string, unknown>): void`, exported from `@lib/analytics` — Task 4 imports and calls `logError`.

- [ ] **Step 1: Add `errorTracking: { autocapture: true }` to the PostHog client constructor**

Open `duofit/lib/analytics.tsx`. Find this block (around line 24-26):
```tsx
export const posthogClient = POSTHOG_API_KEY
  ? new PostHog(POSTHOG_API_KEY, { host: POSTHOG_HOST })
  : null;
```
Replace it with:
```tsx
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
```

- [ ] **Step 2: Add `logWarn` and `logError` helper functions**

In the same file, immediately after the existing `trackEvent` function (which ends around line 41 with `}`), add:
```tsx
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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd duofit && npx tsc --noEmit`
Expected: no output, exit code 0. (`posthogClient.logger` is typed as `CaptureLogger` from `@posthog/core`, whose `warn`/`error` methods both accept `(body: string, attributes?: LogAttributes)` — confirmed against the installed package's type declarations, not assumed.)

- [ ] **Step 4: Commit**

```bash
git add duofit/lib/analytics.tsx
git commit -m "feat: add error tracking autocapture and log helpers"
```

---

### Task 2: Create the Hebrew/RTL error fallback component

**Files:**
- Create: `duofit/components/ErrorFallback.tsx`

**Interfaces:**
- Consumes: `theme` from `@styles/theme` (existing module — exposes `theme.colors.{bg,text,textSecondary,magenta,black}`, `theme.spacing.{sm,md,lg,xl}`, `theme.borderRadius.md`, `theme.typography.{h2,body,button}.fontFamily`; confirm exact property names by reading `duofit/styles/theme.ts` before writing this task if any name below doesn't match).
- Produces: a default-exported React component `ErrorFallback` with props `{ error: unknown; componentStack: string; resetError: () => void }` — this exact shape matches `PostHogErrorBoundaryFallbackProps` from `posthog-react-native` (confirmed via the installed package's `PostHogErrorBoundary.d.ts`), so Task 3 can pass this component directly as the boundary's `fallback` prop without an adapter.

- [ ] **Step 1: Read the theme module to confirm exact property names**

Run: `cat duofit/styles/theme.ts` (or open it in the editor). Confirm the exact paths for background color, text color, secondary text color, an accent color for the retry button, spacing scale, border radius, and typography font families. Use those exact names in Step 2 below — do not guess.

- [ ] **Step 2: Write the component**

Create `duofit/components/ErrorFallback.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { Button } from '@components/Button';
import { theme } from '@styles/theme';

I18nManager.forceRTL(true);

export interface ErrorFallbackProps {
  error: unknown;
  componentStack: string;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ resetError }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>משהו השתבש</Text>
      <Text style={styles.subtitle}>
        קרתה שגיאה לא צפויה. אפשר לנסות שוב, ואם זה ממשיך לקרות נשמח שתדווח לנו.
      </Text>
      <View style={styles.buttonWrapper}>
        <Button label="נסה שוב" variant="primary" size="lg" onPress={resetError} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  title: {
    fontSize: 24,
    color: theme.colors.text,
    fontFamily: theme.typography.h2.fontFamily,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.body.fontFamily,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  buttonWrapper: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
  },
});

export default ErrorFallback;
```
This reuses the existing `Button` component (`@components/Button`, already used across every screen in this app) rather than a bespoke pressable, so the retry button automatically gets the app's standard 48px touch target and styling for free. If Step 1 found different property names than used above (e.g. `theme.spacing.xl` doesn't exist), substitute the real names here before saving.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd duofit && npx tsc --noEmit`
Expected: no output, exit code 0.

- [ ] **Step 4: Commit**

```bash
git add duofit/components/ErrorFallback.tsx
git commit -m "feat: add Hebrew/RTL error fallback component"
```

---

### Task 3: Wire `PostHogErrorBoundary` into the root layout

**Files:**
- Modify: `duofit/src/app/_layout.tsx`

**Interfaces:**
- Consumes: `ErrorFallback` (default export, `{ error, componentStack, resetError }` props) from Task 2 at `@components/ErrorFallback`; `PostHogErrorBoundary` from `posthog-react-native` (confirmed exported alongside `PostHogProvider`, `useFonts`, etc. — same package already imported in this file's sibling `lib/analytics.tsx`).
- Produces: nothing new consumed elsewhere — this is the outermost wiring point.

- [ ] **Step 1: Add the import**

In `duofit/src/app/_layout.tsx`, find the existing import line (near the top):
```tsx
import { Stack } from 'expo-router';
```
Add a new import directly after it:
```tsx
import { PostHogErrorBoundary } from 'posthog-react-native';
import { ErrorFallback } from '@components/ErrorFallback';
```

- [ ] **Step 2: Wrap the `<Stack>` in the error boundary**

Find the current return statement (the `<AnalyticsProvider>...</AnalyticsProvider>` block wrapping `<Stack>` with its two `<Stack.Protected>` children). Wrap the `<Stack>...</Stack>` element (but stay *inside* `<AnalyticsProvider>`, so the boundary can still report to the already-initialized PostHog client) in `<PostHogErrorBoundary>`:
```tsx
return (
  <AnalyticsProvider>
    <PostHogErrorBoundary fallback={ErrorFallback}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }}>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="login" />
          <Stack.Screen name="verify-otp" />
          <Stack.Screen name="profile-setup" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="discover" />
        </Stack.Protected>
      </Stack>
    </PostHogErrorBoundary>
  </AnalyticsProvider>
);
```
(Keep the exact `<Stack>` internals — `screenOptions`, both `<Stack.Protected>` blocks, and their `<Stack.Screen>` children — unchanged; only the new `<PostHogErrorBoundary>` wrapper is added around the whole `<Stack>`.)

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd duofit && npx tsc --noEmit`
Expected: no output, exit code 0.

- [ ] **Step 4: Manual verification — trigger a real render error**

This step temporarily breaks something on purpose to prove the boundary works, then reverts it — do not commit the temporary breakage.

1. Open `duofit/src/app/discover.tsx`. Temporarily add this line inside the component's returned JSX, as the very first child (e.g. right after the opening `<View>` tag): `{(() => { throw new Error('TEST: forced render error'); })()}`
2. Start the dev server if not already running: `cd duofit && npx expo start --tunnel -c` (fresh restart with cleared cache — do not reuse an already-running server, per this project's established gotcha where env/code changes silently don't apply to a stale Metro process).
3. On the physical device, navigate to (or land on, e.g. via session restore) the Discover screen.
4. Confirm the Hebrew fallback screen appears ("משהו השתבש" + "נסה שוב" button) instead of a white screen or app crash.
5. Tap "נסה שוב" and confirm the app recovers (re-renders `discover.tsx` — it will throw again immediately since the test line is still there, which is fine, this step only verifies the *first* catch-and-render worked; don't loop on this expecting it to stop).
6. Remove the temporary `throw new Error(...)` line from `discover.tsx` before proceeding. Run `git diff duofit/src/app/discover.tsx` and confirm it shows no changes (file is back to its committed state).

- [ ] **Step 5: Commit**

```bash
git add duofit/src/app/_layout.tsx
git commit -m "feat: wrap app in PostHogErrorBoundary with Hebrew fallback"
```

---

### Task 4: Report the avatar-picker failure via `logError`

**Files:**
- Modify: `duofit/screens/login/ProfileSetupScreen.tsx`

**Interfaces:**
- Consumes: `logError(message: string, properties?: Record<string, unknown>): void` from `@lib/analytics` (Task 1).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Add the import**

In `duofit/screens/login/ProfileSetupScreen.tsx`, find the existing import block near the top (it already imports `useAuth, User` from `@hooks/useAuth`). Add a new import line:
```tsx
import { logError } from '@lib/analytics';
```

- [ ] **Step 2: Update the `pickAvatar` catch block**

Find this exact block (currently around line 81-83):
```tsx
    } catch {
      setError('לא הצלחנו לפתוח את גלריית התמונות');
    }
```
Replace it with:
```tsx
    } catch (err) {
      logError('avatar_picker_failed', { error: String(err) });
      setError('לא הצלחנו לפתוח את גלריית התמונות');
    }
```
(The only change is capturing the error into `err` instead of discarding it, and reporting it via `logError` before setting the same user-facing message as before — the UI behavior for the end user is unchanged.)

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd duofit && npx tsc --noEmit`
Expected: no output, exit code 0.

- [ ] **Step 4: Manual verification — trigger the real failure path**

1. Ensure the dev server from Task 3 Step 4 is still running (or restart fresh if needed).
2. On the physical device, go to Settings → Apps → Expo Go → Permissions → Photos (or equivalent on the test device's Android version) and revoke photo library access, OR simply deny the permission prompt when asked in the next step.
3. In the app, navigate to the Profile Setup screen and tap the avatar picker.
4. Deny the permission request when prompted.
5. Confirm the existing Hebrew error message ("לא הצלחנו לפתוח את גלריית התמונות") still appears in the UI (unchanged behavior).
6. Wait ~15 seconds, then check PostHog's Logs product (`eu.posthog.com` → the DuoFit project → Logs) for an entry with body `avatar_picker_failed`. If a full dev-server restart happened since `.env.local` was last loaded, note this project's established gotcha: `EXPO_PUBLIC_*` env vars only get inlined at Metro startup, so a stale already-running server won't have the key — restart with `npx expo start --tunnel -c` if the log doesn't appear after a reasonable wait.

- [ ] **Step 5: Commit**

```bash
git add duofit/screens/login/ProfileSetupScreen.tsx
git commit -m "feat: report avatar picker failures to PostHog logs"
```

---

## Final Verification (after all 4 tasks)

- [ ] Run `cd duofit && npx tsc --noEmit` one final time — must be clean.
- [ ] Full manual regression per the design spec's Testing section: complete a full signup flow (phone → OTP `123456` → profile) end to end, confirm the existing analytics events (`signup_started`, `otp_sent`, `otp_verified`, `profile_completed`) still fire correctly in PostHog (no regression from this plan's changes to `_layout.tsx` / `analytics.tsx`).
- [ ] Confirm the unhandled-exception autocapture (Task 1) produced an entry in PostHog's Error Tracking product from the Task 3 Step 4 forced-error test (separately from the error *boundary* catching it in the UI — both should have fired: the boundary shows the fallback, and `errorTracking.autocapture` reports the exception to PostHog).
