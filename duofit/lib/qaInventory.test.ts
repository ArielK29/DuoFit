import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = fileURLToPath(new URL('../scripts/qa-inventory.ts', import.meta.url));
const appRoot = fileURLToPath(new URL('../', import.meta.url));

function check(root: string) {
  const r = spawnSync(process.execPath, [script, '--check'], { encoding: 'utf8', env: { ...process.env, QA_ROOT: root, NODE_NO_WARNINGS: '1' } });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

test('every button in the app is mapped to a QA flow and none is empty, unlabelled or in English', () => {
  const result = check(appRoot);
  assert.equal(result.code, 0, result.out);
  assert.match(result.out, /all mapped to a flow, no findings/);
});

test('the scan catches an empty handler, an icon-only button without a label, English text and a screen with no flow', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-'));
  fs.mkdirSync(path.join(root, 'screens'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'screens', 'NewScreen.tsx'),
    `import React from 'react';
import { Pressable, Text, View } from 'react-native';
export const NewScreen = () => (
  <View>
    <Pressable onPress={() => {}}><Text>שמור</Text></Pressable>
    <Pressable onPress={() => 1}><Icon /></Pressable>
    <Pressable onPress={() => 1} accessibilityLabel="סגור"><Icon /></Pressable>
    <Button label="Save changes" onPress={() => 1} />
    <Text>coming soon</Text>
  </View>
);
`
  );
  const result = check(root);
  assert.equal(result.code, 1, result.out);
  assert.match(result.out, /no flow mapped for screens\/NewScreen\.tsx/);
  assert.match(result.out, /empty-handler: screens\/NewScreen\.tsx:5/);
  assert.match(result.out, /icon-only-no-label: screens\/NewScreen\.tsx:6/);
  assert.doesNotMatch(result.out, /NewScreen\.tsx:7/, 'a labelled icon button is fine');
  assert.match(result.out, /english-text: screens\/NewScreen\.tsx:8 label="Save changes"/);
  assert.match(result.out, /placeholder-word: screens\/NewScreen\.tsx:9/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('a button inside a mapped screen with a Hebrew label, a text child and a label passes the per-file checks', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-'));
  fs.mkdirSync(path.join(root, 'screens', 'login'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'screens', 'login', 'TermsScreen.tsx'),
    `export const A = () => (<Pressable onPress={go}><Text>חזרה</Text></Pressable>);
export const B = () => (<Pressable onPress={go} accessibilityLabel="חזרה"><Icon /></Pressable>);
`
  );
  const result = check(root);
  // Only the "stale map" notices for every other mapped file remain; there is no finding about this file.
  assert.doesNotMatch(result.out, /TermsScreen\.tsx:\d+/);
  assert.doesNotMatch(result.out, /no flow mapped for screens\/login\/TermsScreen/);
  fs.rmSync(root, { recursive: true, force: true });
});
