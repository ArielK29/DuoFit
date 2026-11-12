import test from 'node:test';
import assert from 'node:assert/strict';
import { healthPermissionHint, healthSourceName } from './healthSource.ts';

test('healthSourceName: Apple Health on the iPhone, Health Connect on Android', () => {
  assert.equal(healthSourceName('ios'), 'Apple Health');
  assert.equal(healthSourceName('android'), 'Health Connect');
});

test('healthPermissionHint: Hebrew, points to the right settings for each phone', () => {
  assert.match(healthPermissionHint('ios'), /בריאות/);
  assert.match(healthPermissionHint('android'), /Health Connect/);
  assert.match(healthPermissionHint('android'), /Google Play/);
});
