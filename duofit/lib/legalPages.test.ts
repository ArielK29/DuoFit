import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderLegalPage } from './legalPages.ts';
import { contactSection, SUPPORT_EMAIL } from './contact.ts';
import { TERMS_SECTIONS, TERMS_UPDATED } from './termsText.ts';

const escapeForHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

test('privacy page: right-to-left Hebrew document with every section of the in-app text', () => {
  const html = renderLegalPage('privacy', '');
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="he" dir="rtl">/);
  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /<title>[^<]*FitFriend[^<]*<\/title>/);
  assert.ok(html.includes(TERMS_UPDATED));
  for (const section of TERMS_SECTIONS) {
    assert.ok(html.includes(section.title), section.title);
    for (const paragraph of section.body) assert.ok(html.includes(escapeForHtml(paragraph)), paragraph.slice(0, 30));
  }
});

test('pages never print "undefined" or "null" and need no script', () => {
  for (const kind of ['privacy', 'support'] as const) {
    for (const email of ['', 'help@example.com']) {
      const html = renderLegalPage(kind, email);
      assert.doesNotMatch(html, /undefined|null|NaN/, `${kind} ${email}`);
      assert.doesNotMatch(html, /<script/i);
    }
  }
});

test('the support email appears only when one is set, as a mailto link, and is escaped', () => {
  assert.doesNotMatch(renderLegalPage('support', ''), /mailto:/);
  assert.doesNotMatch(renderLegalPage('privacy', ''), /mailto:/);
  const withEmail = renderLegalPage('support', 'help@duofit.example');
  assert.match(withEmail, /<a href="mailto:help@duofit\.example">help@duofit\.example<\/a>/);
  assert.match(renderLegalPage('privacy', 'help@duofit.example'), /mailto:help@duofit\.example/);
  const hostile = renderLegalPage('support', '"><img src=x onerror=alert(1)>@a.co');
  assert.doesNotMatch(hostile, /<img/);
  assert.ok(renderLegalPage('support', 'a&b@x.co').includes('a&amp;b@x.co'), 'ampersand is escaped');
});

test('support page says how to delete the account and how to report, and the emergency numbers', () => {
  const html = renderLegalPage('support', '');
  assert.match(html, /מחק את החשבון שלי/);
  assert.match(html, /דווח/);
  assert.match(html, /100/);
  assert.match(html, /101/);
});

test('contactSection: nothing without an email, a contact section with one', () => {
  assert.equal(contactSection(''), null);
  assert.equal(contactSection('   '), null);
  const section = contactSection('help@duofit.example');
  assert.ok(section);
  assert.ok(section!.body.join(' ').includes('help@duofit.example'));
});

test('the in-app text names the providers and the retention rule', () => {
  const all = TERMS_SECTIONS.map((s) => `${s.title} ${s.body.join(' ')}`).join(' ');
  for (const name of ['Supabase', 'Vercel', 'PostHog', 'Resend']) assert.ok(all.includes(name), name);
  assert.match(all, /200/, 'notifications kept: newest 200');
  assert.match(all, /אין פרסומות/);
});

test('the committed public pages are exactly what the generator produces (run "npm run legal:build" after changing the text)', () => {
  for (const [kind, file] of [['privacy', 'public/privacy.html'], ['support', 'public/support.html']] as const) {
    const onDisk = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
    assert.equal(onDisk, renderLegalPage(kind, SUPPORT_EMAIL), file);
  }
});
