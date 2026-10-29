// Renders index.html frame by frame (deterministic) and encodes with ffmpeg.
// Usage: node render.js <outDir> [frames-at-seconds,comma-separated for stills]
const { chromium } = require('playwright');
const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
(async () => {
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const stills = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto('file://' + path.resolve(__dirname, 'index.html')); await pg.waitForTimeout(500);
  const total = await pg.evaluate('TOTAL');
  if (stills) { for (const t of stills) { await pg.evaluate(t => render(t), t); await pg.screenshot({ path: `${out}/still-${t}.png` }); } await b.close(); return; }
  const fps = 30, n = Math.round(total * fps);
  for (let i = 0; i < n; i++) { await pg.evaluate(t => render(t), i / fps); await pg.screenshot({ path: `${out}/f${String(i).padStart(4, '0')}.png` }); }
  await b.close();
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', `${out}/f%04d.png`, '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${out}/checklist.mp4`], { stdio: 'inherit' });
})();
