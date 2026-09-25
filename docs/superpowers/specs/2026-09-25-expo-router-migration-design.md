# Expo Router Migration — Design

**Issue:** #8 · **Date:** 2026-09-25 · **Status:** Approved for implementation

## Problem

`AGENTS.md` (Expo's own project convention file) mandates Expo Router with routes under `src/app/`. The app currently uses manual `useState` screen-switching in `App.tsx` with an `onNavigate` prop drilled through every screen and a hand-rolled discriminated union (`types/navigation.ts`) for type safety. This works for today's 4 screens but won't scale to tab navigation, deep links, or correct hardware back-button behavior once Discover/Chat/Dashboard (#5, #3, #2) are built.

## Scope

In scope: migrate the existing 4 screens (Login, VerifyOTP, ProfileSetup, Discover-placeholder) to Expo Router, replacing the manual navigation system. Structure the auth flow as a route group so it's easy to add a tab group for Discover/Chat/Dashboard later, without building the tab navigator itself now (no real screens exist yet for those tabs — that's #5/#3/#2's job).

Out of scope: building real Discover/Chat/Dashboard screens, adding a tab navigator (deferred until those screens exist), any visual/design changes.

## Approach

Single approach (no meaningful alternatives for a 4-screen app at this SDK version): Expo Router SDK 57's `Stack.Protected` with a `guard` prop, per current Expo docs — this is the officially recommended auth-gating pattern for this SDK, replacing the older `Redirect`-component approach.

## Design

**File structure** (routes live in `src/app/`, per `AGENTS.md`):
```
src/app/
  _layout.tsx        # Font loading + session hydration + Stack.Protected auth gate
  login.tsx           # Thin wrapper: <LoginScreen />
  verify-otp.tsx      # Thin wrapper: <VerifyOTPScreen />, reads phoneNumber via useLocalSearchParams
  profile-setup.tsx   # Thin wrapper: <ProfileSetupScreen />, reads phoneNumber via useLocalSearchParams
  discover.tsx        # Existing placeholder JSX moved here as-is (including the dev-only logout button)
```

**`_layout.tsx`** carries over `App.tsx`'s existing logic verbatim (font loading via `useFonts`, zustand-persist hydration wait, splash-screen wiring, shared `LoadingScreen`), then renders:
```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Protected guard={!isAuthenticated}>
    <Stack.Screen name="login" />
    <Stack.Screen name="verify-otp" />
    <Stack.Screen name="profile-setup" />
  </Stack.Protected>
  <Stack.Protected guard={isAuthenticated}>
    <Stack.Screen name="discover" />
  </Stack.Protected>
</Stack>
```
An `index.tsx` redirect route decides the initial screen (`<Redirect href="/discover" />` or `<Redirect href="/login" />` based on `isAuthenticated`) so there's always a valid entry route regardless of auth state.

**Screen components** (`screens/login/*.tsx`): remove the `onNavigate`/`OnNavigate` prop entirely. Replace with:
- `LoginScreen`: on success, `router.push({ pathname: '/verify-otp', params: { phoneNumber } })`
- `VerifyOTPScreen`: reads `phoneNumber` via `useLocalSearchParams<{ phoneNumber: string }>()` instead of a prop; on success, `router.push({ pathname: '/profile-setup', params: { phoneNumber } })`
- `ProfileSetupScreen`: reads `phoneNumber` the same way; on submit, `router.replace('/discover')` (replace, not push — no going back to the signup form after landing)

**Deleted:** `types/navigation.ts` (the discriminated union), and `App.tsx` itself (fully replaced by `src/app/_layout.tsx` + `src/app/index.tsx`). `index.js`'s `registerRootComponent(App)` reverts to `"main": "expo-router/entry"` in `package.json` (undoing the earlier deliberate removal — this issue is exactly why that removal was flagged as temporary).

**Config:** `app.json` gets the `expo-router` plugin back in `plugins`, plus `"scheme": "duofit"` (already present). `tsconfig.json` paths may need a `baseUrl`/`typedRoutes` adjustment — verify against current Expo docs during implementation, don't assume from the pre-existing config that was removed months ago.

## Testing

Manual device testing via Expo Go, same as prior rounds: full signup flow, hardware back-button behavior on each screen (this is the main new thing Expo Router should fix — verify Android back button doesn't exit the app unexpectedly or skip a step), and confirm an authenticated user relaunching the app lands directly on Discover (session restore, same requirement as before, now via `Stack.Protected` + the `index.tsx` redirect instead of manual state).

## Risks

- `Stack.Protected` is a relatively new API (introduced within the last few SDK cycles) — implementation must fetch current docs rather than trust training data, per `AGENTS.md`'s own explicit rule.
- RTL rendering with Expo Router's native stack must be re-verified — it's a different navigation primitive than the plain `View`-based screens used before.
