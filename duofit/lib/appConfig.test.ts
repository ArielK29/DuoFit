import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// The release metadata the stores look at (checklist B7). If one of these changes on purpose, change the test with it.
const config = JSON.parse(fs.readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo;
const HEBREW = /[֐-׿]/;

function plugin(name: string): Record<string, unknown> {
  const entry = config.plugins.find((p: unknown) => (Array.isArray(p) ? p[0] : p) === name);
  assert.ok(entry, `plugin ${name} is configured`);
  return Array.isArray(entry) ? (entry[1] ?? {}) : {};
}

test('identity: version 1.0.0, the agreed bundle id on both platforms, the app link scheme, iPhone only', () => {
  assert.equal(config.name, 'FitFriend');
  assert.equal(config.version, '1.0.0');
  assert.equal(config.ios.bundleIdentifier, 'com.arielk29.fitfriend');
  assert.equal(config.android.package, 'com.arielk29.fitfriend');
  assert.equal(config.scheme, 'duofit');
  assert.equal(config.ios.supportsTablet, false);
  assert.equal(config.orientation, 'portrait');
});

test('permission texts: Hebrew, say what the app does, and only for what the app really uses', () => {
  const photos = plugin('expo-image-picker').photosPermission as string;
  const camera = plugin('expo-image-picker').cameraPermission as string;
  const location = plugin('expo-location').locationWhenInUsePermission as string;
  for (const text of [photos, location, camera]) {
    assert.match(text, HEBREW);
    assert.doesNotMatch(text, /\$\(PRODUCT_NAME\)/, 'no template placeholder');
    assert.ok(text.endsWith('.'), text);
  }
  assert.match(photos, /תמונת פרופיל/);
  assert.match(photos, /פוסט/, 'pictures are also used for community posts');
  assert.match(location, /שותפים/);
  assert.match(camera, /סלפי/, 'the camera is only used for the identity selfie');
  // The camera is used only for the identity selfie, never the microphone; location only while the app is open.
  const picker = plugin('expo-image-picker');
  assert.equal(picker.microphonePermission, false);
  const loc = plugin('expo-location');
  assert.equal(loc.locationAlwaysAndWhenInUsePermission, false);
  assert.equal(loc.locationAlwaysPermission, false);
  assert.equal(loc.isIosBackgroundLocationEnabled, undefined);
});

test('Hebrew only: the app declares he as its only language and forces right-to-left from the first launch', () => {
  const localization = plugin('expo-localization') as { supportedLocales: Record<string, string[]>; forcesRTL: boolean; supportsRTL: boolean };
  assert.deepEqual(localization.supportedLocales.ios, ['he']);
  assert.deepEqual(localization.supportedLocales.android, ['he']);
  assert.equal(localization.forcesRTL, true);
  assert.equal(localization.supportsRTL, true);
  assert.equal(config.ios.infoPlist.CFBundleDevelopmentRegion, 'he');
});

test('iOS network rules: no blanket "allow arbitrary loads" (everything the app calls is https)', () => {
  const ats = config.ios.infoPlist.NSAppTransportSecurity;
  assert.equal(ats.NSAllowsArbitraryLoads, false);
  assert.equal(ats.NSAllowsLocalNetworking, true, 'the development build still reaches Metro on the local network');
  assert.equal(config.ios.infoPlist.ITSAppUsesNonExemptEncryption, false);
});

test('the icon and splash files named in the config exist', () => {
  const files = [config.icon, config.android.adaptiveIcon.foregroundImage, config.android.adaptiveIcon.backgroundImage, config.android.adaptiveIcon.monochromeImage, config.web.favicon];
  for (const file of files) {
    assert.ok(file, 'configured');
    assert.ok(fs.existsSync(new URL(`../${file}`, import.meta.url)), file);
  }
});
