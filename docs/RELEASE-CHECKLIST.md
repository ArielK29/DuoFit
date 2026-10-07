# DuoFit – Release checklist (App Store / Google Play)

What is already prepared in the repo (issue #12) and what the owner must do himself.

## Already done in the repo
- `duofit/app.json`: iOS `bundleIdentifier` and Android `package` = `com.arielk29.duofit` (cannot be changed after the first upload to the stores).
- `ITSAppUsesNonExemptEncryption = false` (the app uses only standard HTTPS), so Apple does not ask the export-compliance question on every build.
- `expo-location` plugin with a Hebrew permission text, and the `expo-notifications` plugin.
- `duofit/eas.json`: the `development`, `preview` and `production` profiles each use the EAS environment with the same name (for the `EXPO_PUBLIC_*` variables).
- In-app account deletion (Apple guideline 5.1.1(v)) – done in stage 4 of #65.

## Owner actions (Claude cannot do these)
1. **Apple Developer account** (~99$/year) – https://developer.apple.com/programs/
2. **Google Play Console account** (one-time ~25$) – https://play.google.com/console
3. **Expo account + login**: `npx eas-cli login`, then `npx eas-cli init` inside `duofit/` (creates the `projectId` in `app.json`).
4. **EAS environment variables** (Expo dashboard → Project → Environment variables). Create them for `preview` and `production`, visibility "Sensitive" or "Plain text" (they are public by design):
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `EXPO_PUBLIC_POSTHOG_API_KEY`
   - `EXPO_PUBLIC_POSTHOG_HOST`
   - **Never** add `EXPO_PUBLIC_DEMO_DATA` (it would put invented people into the real app).
   - **Never** add the `service_role` key anywhere in the app.
5. **Privacy policy URL** (required by both stores) and a support e-mail/URL.
6. **Store listing**: Hebrew name/description, screenshots (iPhone 6.7" and 6.1", Android phone), age rating, data-safety / privacy-nutrition answers (location, profile, photos, messages, analytics).
7. **Android only**: Google Maps API key if the map is used on Android (put it in `app.json` → `android.config.googleMaps.apiKey`, restrict it to the package name).
8. **Supabase before real users** (issue #15): Authentication → URL Configuration (Site URL + Redirect URLs), custom SMTP for confirmation e-mails.

## Commands (after the steps above)
```bash
cd duofit
npx eas-cli build --profile preview --platform ios      # internal test build (TestFlight / ad hoc)
npx eas-cli build --profile production --platform all   # store build
npx eas-cli submit --profile production --platform ios
```

## Not verified
No EAS build has been run yet (needs the Expo/Apple accounts). Device behaviour (permissions dialog texts, notifications) is checked in issue #11.
