# DuoFit — Code Architecture

_Snapshot as of 2026-09-26, branch `feature/login` (uncommitted work included)._

## Stack

- **Framework:** Expo (React Native) + TypeScript, dark-mode-only, RTL (Hebrew)
- **State:** Zustand (`hooks/useAuth.ts`), persisted to `AsyncStorage`
- **Navigation:** Manual `useState`-based screen switching in `App.tsx` — **not** Expo Router, despite `duofit/AGENTS.md` recommending it (see gap #8 below)
- **Styling:** Plain `StyleSheet.create` per screen/component, driven by a shared `theme` object — no NativeWind/Tailwind despite the original README mentioning it
- **No backend yet** — all data is local/simulated (`setTimeout`, magic demo values)

## Folder structure (`duofit/`)

```
App.tsx                      # Root component: session restore + screen switch
types/navigation.ts          # Shared NavigateAction / OnNavigate discriminated union
screens/login/
  LoginScreen.tsx             # Phone number entry
  VerifyOTPScreen.tsx         # 6-digit OTP entry
  ProfileSetupScreen.tsx      # Name/bio/gender/fitness/activities/avatar → persists User
components/
  Button.tsx                  # Primary/secondary/danger variants, loading state
  Input.tsx                   # RTL text input with label/error/helper text
hooks/
  useAuth.ts                  # Zustand store: User type, isAuthenticated, setUser, logout, persisted via AsyncStorage
constants/
  colors.ts / spacing.ts / typography.ts   # Design tokens (source: ../01-DESIGN-TOKENS.json)
styles/
  theme.ts                    # Combines constants into one `theme` object screens import
```

Only the **login/onboarding** vertical slice exists today. `screens/discover/`, `screens/dashboard/`, `screens/chat/` (referenced in `CLAUDE.md`'s intended structure) don't exist yet — see gaps below.

## How a screen is built (the established pattern — follow this for new screens)

Every screen in `screens/login/` follows the same shape, and new screens (Discover, Chat, etc.) should too:

1. Local `useState` for form fields + `error: string | null` + `loading: boolean`
2. A `theme` import (never hardcoded colors/spacing)
3. RTL via `textAlign: 'right'` and plain `flexDirection: 'row'` (React Native's Yoga engine auto-mirrors `'row'` once `I18nManager.forceRTL(true)` is set — **do not** use `'row-reverse'`, that double-flips it; this was a real bug found and fixed during Issue #1's code review)
4. Validation + a Hebrew error message inline, shown via `Input`'s `error` prop or a manual `<Text>` for non-field errors
5. Navigation out via the typed `onNavigate` prop (`OnNavigate` from `types/navigation.ts`), never a raw string screen name
6. 48px minimum touch targets on all interactive elements (`02-COMPONENT-STATES.md`)

## Data flow (today)

```
App.tsx (owns: screen, phoneNumber, useAuth hydration check)
   │
   ├─ not hydrated yet → spinner
   ├─ hydrated + isAuthenticated → Discover placeholder
   └─ hydrated + !isAuthenticated → LoginScreen
        │ onNavigate({screen:'VerifyOTP', phoneNumber})
        ▼
      VerifyOTPScreen
        │ onNavigate({screen:'Profile', phoneNumber})
        ▼
      ProfileSetupScreen
        │ builds full User object → useAuth.getState().setUser(user)
        │ onNavigate({screen:'Discover'})
        ▼
      Discover (placeholder only — real screen is issue #5)
```

`useAuth`'s zustand `persist` middleware writes the `User` + `isAuthenticated` to `AsyncStorage` automatically on every `setUser` call — this is what makes session-restore-on-launch work.

## What is explicitly simulated / not real yet

- OTP send + verify: `setTimeout`, magic success code `123456`, magic network-failure trigger (phone `0500000000` / OTP `000000`) — tracked in **#15**
- Avatar picking works (`expo-image-picker`) but the picked URI is stored as-is and will likely go stale/break after app restart — tracked in **#16**
- No real geolocation, matching, chat, or scheduling logic anywhere — those screens don't exist yet (#5, #6, #3, #7, #4, #2)

## Known architectural gap

**#8 — Navigation is not Expo Router.** `duofit/AGENTS.md` (Expo's own project convention file) explicitly says routes should live in `src/app/` via Expo Router. This app was deliberately built with manual `useState` screen-switching instead, early in the project, before this was reconsidered. It works fine for a 4-screen login flow but will get harder to maintain once Discover/Chat/Dashboard/Checkout are added (deep linking, back-button behavior, and tab/stack nesting all need Expo Router or an equivalent to work properly on real devices). This is flagged as **priority-high tech-debt** and is best tackled *before* the next screens (#5 onward) are built, not after — retrofitting navigation under 8+ screens is much more expensive than migrating now under 4.
