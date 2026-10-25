# FitFriend: map setup (B9)

What is done, and the one part that needs the owner.

## How the map works today
- **iPhone:** Apple Maps (the default of `react-native-maps` on iOS). No key, no account, nothing to set up. The dark style of the Android map does not apply there.
- **Android in Expo Go:** works without a key (Expo Go has its own).
- **Android in a real build:** needs a **Google Maps API key**. Without it the map area stays empty. The code is already ready for it: `app.config.js` reads the key from the build environment variable `GOOGLE_MAPS_ANDROID_API_KEY` and puts it in the Android config. The key is never in the repository (checked by `lib/appConfigDynamic.test.ts`).
- **If the map tiles do not load** (no key, no internet), `PlacesView` shows one plain Hebrew message: "no internet" or "the map did not load". There is no backup tile layer: the CARTO tiles that were used as one drew an "API KEY REQUIRED" watermark over the whole map (seen on a real iPhone, 2026-10-21) and were removed. On iPhone the map is Apple Maps (dark appearance, no key needed); on Android it is Google Maps and needs the key described here.

## What the owner does (Android release only, not needed for the iPhone version)
1. In Google Cloud Console, create or choose a project and **enable "Maps SDK for Android"**. Google asks for a billing account for Maps; the monthly free usage is usually enough for a small app **(verify current Maps Platform pricing)**.
2. Create an **API key** and restrict it: application restriction "Android apps" with the package `com.arielk29.fitfriend` and the SHA-1 fingerprint of the signing key (shown by `eas credentials` once the Expo account and the first Android build exist), and API restriction "Maps SDK for Android" only.
3. Add the key as an **EAS environment variable** named `GOOGLE_MAPS_ANDROID_API_KEY` for the `preview` and `production` environments (visibility "sensitive"). Never in the repository, never in chat.
4. Claude then checks the first Android build's manifest for the key and the map on a real phone.

The key of an Android Maps app is restricted by package and fingerprint, so it is not a secret in the way a password is, but it still stays out of the repository.

## Left for the Android stage
- Decide the tile provider plan for the backup tiles, or remove the backup (then a missing Google map shows only the message).
- Block `SYSTEM_ALERT_WINDOW` in the Android manifest (see `docs/DECISIONS.md`, Android timing).
