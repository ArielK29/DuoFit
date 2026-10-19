// Dynamic part of the Expo config. Everything else is in app.json; Expo passes it in as `config`.
// The Google Maps key for the Android map is read from the build environment (an EAS environment variable),
// so it never sits in the repository. Without the variable the config is returned unchanged
// (Expo Go and the iPhone map, which is Apple Maps, need no key).
module.exports = ({ config }) => {
  const apiKey = (process.env.GOOGLE_MAPS_ANDROID_API_KEY || '').trim();
  if (!apiKey) return config;
  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...(config.android && config.android.config),
        googleMaps: { apiKey },
      },
    },
  };
};
