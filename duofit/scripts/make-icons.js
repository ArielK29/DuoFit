// Regenerates the app icons from the brand monogram (logo/duofit-icon.svg: 'DF' in Anton on the pink-black-cyan gradient).
// Not part of the app: run it from an empty temp folder with `npm i sharp opentype.js`, then:
//   node make-icons.js <output folder> <path to Anton_400Regular.ttf from @expo-google-fonts/anton>
// iOS icon is full-bleed and has NO alpha channel (Apple requires that); Android gets background, foreground (66% safe zone) and monochrome layers.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const opentype = require('opentype.js');
const out = process.argv[2];
const fontPath = process.argv[3];
const buf = fs.readFileSync(fontPath); const f = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const SIZE = 620, SPACING = 4; // the same text settings as logo/duofit-icon.svg
const width = f.getAdvanceWidth('DF', SIZE, { letterSpacing: SPACING / SIZE });
const base = f.getPath('DF', 0, 0, SIZE, { letterSpacing: SPACING / SIZE });
const box = base.getBoundingBox();
const GRAD = `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FF00A8"/><stop offset="55%" stop-color="#050505"/><stop offset="100%" stop-color="#00E5FF"/></linearGradient></defs>`;
// the monogram path, placed so its box is centered at (cx, cy) and scaled to the given width
function mark(cx, cy, w) {
  const k = w / (box.x2 - box.x1);
  const p = f.getPath('DF', 0, 0, SIZE, { letterSpacing: SPACING / SIZE });
  const d = p.toPathData(3);
  const tx = cx - ((box.x1 + box.x2) / 2) * k, ty = cy - ((box.y1 + box.y2) / 2) * k;
  return { d, tf: `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(5)})` };
}
async function png(svg, file, size, opaque) {
  let s = sharp(Buffer.from(svg), { density: 300 }).resize(size, size);
  if (opaque) s = s.flatten({ background: '#050505' }).removeAlpha();
  await s.png({ compressionLevel: 9 }).toFile(path.join(out, file));
  console.log(file, size, opaque ? 'opaque' : 'transparent');
}
(async () => {
  const wide = (box.x2 - box.x1);
  // iOS icon: full-bleed square (Apple rounds the corners itself), no alpha. Same layout as the brand SVG: text 620 px, baseline 720, centered.
  const m1 = mark(512, 512 + 0, wide * (620 / SIZE)); // same scale as the SVG; vertical position set below
  // recenter vertically like the brand SVG (baseline 720): box center in SVG = 720 + (y1+y2)/2
  const cyIcon = 720 + (box.y1 + box.y2) / 2;
  const mi = mark(512, cyIcon, wide);
  await png(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${GRAD}<rect width="1024" height="1024" fill="url(#bg)"/><path d="${mi.d}" transform="${mi.tf}" fill="#F5F5F5"/></svg>`, 'icon.png', 1024, true);
  // Android adaptive icon: gradient background layer, monogram inside the 66% safe zone, and a one-color version for themed icons.
  await png(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${GRAD}<rect width="1024" height="1024" fill="url(#bg)"/></svg>`, 'android-icon-background.png', 1024, true);
  const ma = mark(512, 512, 520);
  await png(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path d="${ma.d}" transform="${ma.tf}" fill="#F5F5F5"/></svg>`, 'android-icon-foreground.png', 1024, false);
  await png(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path d="${ma.d}" transform="${ma.tf}" fill="#000000"/></svg>`, 'android-icon-monochrome.png', 1024, false);
  // Splash: the monogram on the dark splash background (color set in app.json).
  const ms = mark(256, 256, 400);
  await png(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="${ms.d}" transform="${ms.tf}" fill="#F5F5F5"/></svg>`, 'splash-icon.png', 512, false);
  // Web favicon: small rounded square.
  const mf = mark(512, cyIcon, wide);
  await png(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${GRAD}<rect width="1024" height="1024" rx="224" fill="url(#bg)"/><path d="${mf.d}" transform="${mf.tf}" fill="#F5F5F5"/></svg>`, 'favicon.png', 196, false);
  // The logo shown inside the app (login screens): the same rounded monogram as the icon, 512 px with transparent corners.
  await png(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${GRAD}<rect width="1024" height="1024" rx="224" fill="url(#bg)"/><path d="${mf.d}" transform="${mf.tf}" fill="#F5F5F5"/></svg>`, 'duofit-logo.png', 512, false);
})();