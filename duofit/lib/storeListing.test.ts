import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// The store forms reject texts over their limits only when you paste them. This reads docs/STORE-LISTING.md
// and keeps every text inside the limit named next to it (checklist B16). Limits: App Store Connect and Play Console.
const doc = fs.readFileSync(new URL('../../docs/STORE-LISTING.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

function inlineValue(label: string): string {
  const lines = doc.split('\n');
  const at = lines.findIndex((l) => l.startsWith(`**${label}`));
  assert.ok(at >= 0, `"${label}" is in the listing`);
  // The value is in backticks on the same line, or alone on the line after it.
  const same = lines[at].slice(lines[at].indexOf(':**') + 3);
  const match = /`([^`]+)`/.exec(same) ?? /^`([^`]+)`/.exec(lines[at + 1] ?? '');
  assert.ok(match, `"${label}" has a value in backticks`);
  return match![1];
}

function fullDescription(): string {
  const start = doc.indexOf('**Full description');
  const open = doc.indexOf('```\n', start) + 4;
  const close = doc.indexOf('\n```', open);
  assert.ok(start >= 0 && open > 4 && close > open, 'full description block found');
  return doc.slice(open, close);
}

const length = (text: string) => [...text].length; // characters, not UTF-16 units (emoji, Hebrew)

test('App name: at most 30 characters', () => {
  assert.ok(length(inlineValue('App name (max 30)')) <= 30);
  assert.equal(inlineValue('App name (max 30)'), 'UnityFit');
});

test('App Store subtitle: at most 30 characters', () => {
  const text = inlineValue('Subtitle, App Store (max 30)');
  assert.ok(length(text) <= 30, `${length(text)} characters`);
});

test('Play short description: at most 80 characters', () => {
  const text = inlineValue('Short description, Google Play (max 80)');
  assert.ok(length(text) <= 80, `${length(text)} characters`);
});

test('Promotional text: at most 170 characters', () => {
  const text = inlineValue('Promotional text, App Store (max 170)');
  assert.ok(length(text) <= 170, `${length(text)} characters`);
});

test('Keywords: at most 100 characters in total, no space after a comma, no repeated word, nothing from the app name', () => {
  const text = inlineValue('Keywords, App Store (max 100, comma separated)');
  assert.ok(length(text) <= 100, `${length(text)} characters`);
  assert.doesNotMatch(text, /,\s|\s,/, 'spaces around commas waste characters');
  const words = text.split(',');
  assert.equal(new Set(words).size, words.length, 'no repeated keyword');
  assert.ok(!words.some((w) => w.toLowerCase() === 'duofit'), 'the app name is already indexed');
});

test('Full description: at most 4000 characters and it makes no medical or emergency promise', () => {
  const text = fullDescription();
  assert.ok(length(text) <= 4000, `${length(text)} characters`);
  assert.match(text, /חירום/, 'mentions the emergency button honestly');
  assert.doesNotMatch(text, /מרפא|ריפוי|טיפול רפואי|מציל חיים/);
});

test('The listing has no placeholders left in the texts that are ready to paste', () => {
  for (const label of ['App name (max 30)', 'Subtitle, App Store (max 30)', 'Short description, Google Play (max 80)', 'Promotional text, App Store (max 170)']) {
    assert.doesNotMatch(inlineValue(label), /TODO|TBD|lorem|XXX/i);
  }
  assert.doesNotMatch(fullDescription(), /TODO|TBD|lorem|XXX/i);
});
