# Deploying DuoFit (web) to Vercel

Vercel hosts the **web version** of DuoFit (a static export of the Expo app). The phone apps (iOS/Android) are separate (Expo/EAS). In the browser the map is a placeholder and share/location behave differently; everything else is the same app.

## How it is built
- `duofit/vercel.json` tells Vercel what to do: `npx expo export --platform web`, output folder `dist`, every URL falls back to `index.html` (single-page app), plus basic security headers.
- `EXPO_PUBLIC_*` variables are baked into the build at build time, so they must exist in Vercel **before** the build runs.

## One-time setup (Vercel dashboard)
1. vercel.com -> **Add New -> Project** -> import the GitHub repo `ArielK29/DuoFit`.
2. **Root Directory:** `duofit`  (important - the app is in a subfolder). Framework Preset: **Other**.
3. **Environment Variables:** open `duofit/.env.local`, copy the whole file, and paste it into the first Variable field (Vercel splits the lines automatically). Needed names:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `EXPO_PUBLIC_POSTHOG_API_KEY`
   - `EXPO_PUBLIC_POSTHOG_HOST`
   - Do **not** add `EXPO_PUBLIC_DEMO_DATA` (it must stay off in production) and never add the `service_role` key.
4. Click **Deploy**. Every push to `main` then redeploys automatically; pull requests get preview URLs.

## After the first deploy (Supabase dashboard, project `duofit`)
Authentication -> **URL Configuration**:
- **Site URL:** the Vercel URL (e.g. `https://duofit.vercel.app`) - the confirmation email link points here instead of `localhost`.
- **Redirect URLs:** add the same URL (and `http://localhost:8083` for local testing).

## Checks
- Sign up with a real email -> the email link opens the Vercel site (not "localhost").
- Reloading a deep link (e.g. `/chat`) still works (the rewrite in `vercel.json`).
- Run the Snyk scans (see CLAUDE.md) before relying on a deploy.
