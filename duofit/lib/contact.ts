import type { TermsSection } from './termsText.ts';

// The public support address (checklist A4). For now an alias of the owner's own mailbox: everything sent to
// arielkorman7+duofit@gmail.com arrives there. Replace it with a dedicated address when one exists, then run "npm run legal:build" to refresh
// the public pages. While it is empty, no contact line is shown anywhere (in the app or on the public pages).
export const SUPPORT_EMAIL = 'arielkorman7+duofit@gmail.com';

export function contactSection(email: string): TermsSection | null {
  const address = email.trim();
  if (!address) return null;
  return {
    title: 'יצירת קשר',
    body: [`לשאלות, לבקשות מחיקה ולכל עניין של פרטיות אפשר לפנות אלינו במייל: ${address}`],
  };
}
