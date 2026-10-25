import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const buildConfig = require('../app.config.js') as (input: { config: Record<string, any> }) => Record<string, any>;

const base = () => ({ name: 'UnityFit', android: { package: 'com.arielk29.unityfit' }, ios: { bundleIdentifier: 'com.arielk29.unityfit' } });

function withKey(value: string | undefined) {
  const before = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  if (value === undefined) delete process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  else process.env.GOOGLE_MAPS_ANDROID_API_KEY = value;
  try {
    return buildConfig({ config: base() });
  } finally {
    if (before === undefined) delete process.env.GOOGLE_MAPS_ANDROID_API_KEY;
    else process.env.GOOGLE_MAPS_ANDROID_API_KEY = before;
  }
}

test('without the variable the config is returned as it is (no key anywhere in the repository)', () => {
  assert.deepEqual(withKey(undefined), base());
  assert.deepEqual(withKey(''), base());
  assert.deepEqual(withKey('   '), base());
});

test('with the variable the Android map key is set and nothing else changes', () => {
  const result = withKey('  test-key-123  ');
  assert.equal(result.android.config.googleMaps.apiKey, 'test-key-123', 'trimmed');
  assert.equal(result.android.package, 'com.arielk29.unityfit');
  assert.deepEqual(result.ios, base().ios);
  assert.equal(result.name, 'UnityFit');
});

test('an existing android.config entry is kept next to the key', () => {
  process.env.GOOGLE_MAPS_ANDROID_API_KEY = 'k';
  try {
    const result = buildConfig({ config: { android: { config: { branch: { apiKey: 'b' } } } } });
    assert.equal(result.android.config.branch.apiKey, 'b');
    assert.equal(result.android.config.googleMaps.apiKey, 'k');
    assert.doesNotThrow(() => buildConfig({ config: {} }));
  } finally {
    delete process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  }
});
