// Writes the public privacy and support pages into public/ (Expo copies them to the site root).
// Run after changing lib/termsText.ts or lib/contact.ts:  npm run legal:build
import fs from 'node:fs';
import { renderLegalPage } from '../lib/legalPages.ts';
import { SUPPORT_EMAIL } from '../lib/contact.ts';

const outDir = new URL('../public/', import.meta.url);
fs.mkdirSync(outDir, { recursive: true });
for (const kind of ['privacy', 'support'] as const) {
  fs.writeFileSync(new URL(`${kind}.html`, outDir), renderLegalPage(kind, SUPPORT_EMAIL));
  console.log(`wrote public/${kind}.html`);
}
if (!SUPPORT_EMAIL) {
  console.warn('SUPPORT_EMAIL is empty (lib/contact.ts): the pages have no contact line. Do not give these addresses to the stores yet.');
}
