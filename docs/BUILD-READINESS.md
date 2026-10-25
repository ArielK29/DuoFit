# FitFriend: first build readiness (B14, B15), 2026-10-20

Everything that can be checked without an Apple account is checked. The build itself, the Apple login for certificates and every EAS action need the owner's approval each time.

## Verified today
| Check | Result |
|---|---|
| JavaScript bundle for **Android** (`npx expo export --platform android`) | Compiles, Hermes bytecode 8.3 MB |
| JavaScript bundle for **iOS** (`npx expo export --platform ios`) | Compiles, Hermes bytecode 8.1 MB |
| `npx expo-doctor` | 21 of 21 checks pass |
| Config (`app.json` + `app.config.js`) | Bundle id and package `com.arielk29.fitfriend`, version 1.0.0, Hebrew only, camera and microphone blocked, ATS arbitrary loads off, EAS project id `e2d60da9-...` (project `ariel_korman/duofit`) |
| Unit tests, types, lint, CI | 100 tests; CI runs on every pull request |
| Snyk | Code 0 issues; dependencies 4 findings, all build and lint tooling (`docs/RELEASE-READINESS.md`) |

## What a first build needs (in this order)
1. **Apple Developer Program membership active** (paid, owner). Without it EAS cannot create the signing certificate or the App Store Connect record.
2. **EAS environment variables** for `preview` and `production` (owner approves; Claude lists, the owner or Claude with approval sets them; public values only):
   - `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `EXPO_PUBLIC_POSTHOG_API_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`
   - `GOOGLE_MAPS_ANDROID_API_KEY` (Android only, sensitive; see `docs/MAPS-SETUP.md`)
   - **Never** `EXPO_PUBLIC_DEMO_DATA` in any environment.
3. **`eas build --platform ios --profile preview`** (internal distribution). EAS asks for the Apple login (Apple Account, password, two-factor code typed by the owner) to create certificates and a provisioning profile. The free Expo plan includes 15 iOS and 15 Android builds; the queue can take long at peak times.
4. **TestFlight:** upload the build to App Store Connect, add the owner as an internal tester, install on the iPhone.
5. Only then the `production` profile (`autoIncrement` is on) and submission.

`eas.json` profiles are already in place (`development`, `preview`, `production`).

## Crash reporting (B14)
- **JavaScript errors:** captured automatically by PostHog (unhandled exceptions, and unhandled promise rejections in release builds), and the member sees a Hebrew error screen (`ErrorFallback`).
- **Native crashes** (a crash below JavaScript) are **not** captured by PostHog today.
- **Recommendation for version 1: add nothing.** TestFlight and App Store Connect collect crash reports and tester feedback for free, and Xcode Organizer shows them after release. A crash service (for example Sentry) is a small later change (one package and one config), and would need a data-safety line and a privacy text update, so it should not be added casually.
- Open decision: only if testers report crashes that App Store Connect does not explain.

## What still cannot be checked without a build
Permission dialogs in Hebrew, right-to-left from the very first launch on an English-language phone, the map on a real Android phone, local notifications, and the privacy manifest warnings in App Store Connect (`docs/APPLE-REVIEW-AUDIT.md`).
