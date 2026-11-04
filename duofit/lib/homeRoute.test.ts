import test from 'node:test';
import assert from 'node:assert/strict';
import { homeRoute } from './homeRoute.ts';

test('homeRoute: signed out goes to the login screen', () => {
  assert.equal(homeRoute({ signedIn: false, profileComplete: false, verified: false }), '/login');
});

test('homeRoute: a signed-in member without a finished profile goes to the profile form', () => {
  assert.equal(homeRoute({ signedIn: true, profileComplete: false, verified: false }), '/profile-setup');
});

test('homeRoute: a member whose identity is not approved goes to the identity screen, never to a closed tab (the black screen after a password reset)', () => {
  assert.equal(homeRoute({ signedIn: true, profileComplete: true, verified: false }), '/verify-identity');
});

test('homeRoute: an approved member goes to discover', () => {
  assert.equal(homeRoute({ signedIn: true, profileComplete: true, verified: true }), '/discover');
});

test('homeRoute: a signed-out member who has not seen the intro sees it first, then the login', () => {
  assert.equal(homeRoute({ signedIn: false, profileComplete: false, verified: false, introSeen: false }), '/welcome');
  assert.equal(homeRoute({ signedIn: false, profileComplete: false, verified: false, introSeen: true }), '/login');
  assert.equal(homeRoute({ signedIn: true, profileComplete: true, verified: true, introSeen: false }), '/discover');
});
