import { TERMS_SECTIONS, TERMS_UPDATED } from './termsText.ts';
import { contactSection } from './contact.ts';

export type LegalPageKind = 'privacy' | 'support';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const STYLE = `
  :root { color-scheme: dark; }
  body { margin: 0; background: #050505; color: #F5F5F5; font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif; line-height: 1.7; }
  main { max-width: 42rem; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
  h1 { font-size: 1.6rem; margin: 0 0 .25rem; }
  h2 { font-size: 1.15rem; margin: 2rem 0 .5rem; color: #00E5FF; }
  p { margin: .5rem 0; color: #F5F5F5; }
  .meta { color: #A8A8A8; font-size: .9rem; }
  a { color: #00E5FF; }
`;

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STYLE}</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;
}

function mailLink(email: string): string {
  const safe = escapeHtml(email);
  return `<a href="mailto:${safe}">${safe}</a>`;
}

function renderPrivacy(email: string): string {
  const sections = [...TERMS_SECTIONS];
  const contact = contactSection(email);
  if (contact) sections.push(contact);
  const parts = sections.map((section) => {
    const paragraphs = section.body
      .map((paragraph) => {
        const text = escapeHtml(paragraph);
        // The contact line carries a real link when an address is set.
        return `<p>${email.trim() && paragraph.includes(email.trim()) ? text.replace(escapeHtml(email.trim()), mailLink(email.trim())) : text}</p>`;
      })
      .join('\n');
    return `<h2>${escapeHtml(section.title)}</h2>\n${paragraphs}`;
  });
  return page(
    'תנאי שימוש ופרטיות | FriendFit',
    `<h1>תנאי שימוש ופרטיות</h1>\n<p class="meta">עודכן לאחרונה: ${escapeHtml(TERMS_UPDATED)}</p>\n${parts.join('\n')}`
  );
}

function renderSupport(email: string): string {
  const address = email.trim();
  const contact = address ? `<p>שאלות, תקלות או בקשות? כתבו לנו: ${mailLink(address)}</p>` : '';
  return page(
    'תמיכה | FriendFit',
    `<h1>FriendFit: תמיכה</h1>
${contact}
<h2>מחיקת חשבון</h2>
<p>מתוך האפליקציה: "החשבון שלי", ואז "מחק את החשבון שלי". המחיקה סופית ומסירה את הפרופיל, התמונות, ההודעות והנתונים האישיים שלך.</p>
<h2>דיווח על תוכן או משתמש</h2>
<p>מתוך האפליקציה, בלחיצה על "דווח" ליד ההודעה, הפוסט או המשתמש. אפשר גם לחסום משתמש.</p>
<h2>מצב חירום</h2>
<p>FriendFit אינה שירות חירום. במצב חירום חייגו 100 או 101.</p>`
  );
}

// The public pages the stores ask for (privacy policy URL, support URL), built from the same text as the app.
export function renderLegalPage(kind: LegalPageKind, supportEmail: string): string {
  return kind === 'privacy' ? renderPrivacy(supportEmail) : renderSupport(supportEmail);
}
