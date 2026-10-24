// Refuses bytes that are not a photo. On a Samsung the first version of the uploads sent a 14-byte stand-in instead of the picture and
// the feed showed an empty grey box, with no error anywhere; an upload that is not an image now fails loudly (and the member is told).
export function assertLooksLikeImage(bytes: ArrayBuffer): void {
  const head = new Uint8Array(bytes.slice(0, 12));
  const jpeg = head[0] === 0xff && head[1] === 0xd8;
  const png = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  const webp = head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 && head[8] === 0x57 && head[9] === 0x45;
  if (!jpeg && !png && !webp) throw new Error('The picked file is not an image (empty or unreadable)');
}
