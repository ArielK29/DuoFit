import test from 'node:test';
import assert from 'node:assert/strict';
import { assertLooksLikeImage } from './imageBytes.ts';

const bytes = (...values: number[]) => new Uint8Array(values).buffer;

test('assertLooksLikeImage: a JPEG, a PNG and a WEBP are accepted', () => {
  assert.doesNotThrow(() => assertLooksLikeImage(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0)));
  assert.doesNotThrow(() => assertLooksLikeImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0)));
  assert.doesNotThrow(() => assertLooksLikeImage(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50)));
});

test('assertLooksLikeImage: the 14-byte text that an Android upload sent instead of a photo (QA run 2) is refused', () => {
  const text = new TextEncoder().encode('[object Blob].').buffer;
  assert.equal(text.byteLength, 14);
  assert.throws(() => assertLooksLikeImage(text), /image/i);
});

test('assertLooksLikeImage: an empty buffer is refused', () => {
  assert.throws(() => assertLooksLikeImage(new ArrayBuffer(0)), /image/i);
});
