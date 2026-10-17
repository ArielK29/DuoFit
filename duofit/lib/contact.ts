import type { TermsSection } from './termsText.ts';

// The public support address. EMPTY on purpose until the owner has created the mailbox (checklist A4):
// nothing about contact is shown, in the app or on the public pages, while it is empty. Once it is set,
// run "npm run legal:build" to refresh the public pages.
export const SUPPORT_EMAIL = '';

export function contactSection(email: string): TermsSection | null {
  const address = email.trim();
  if (!address) return null;
  return {
    title: 'יצירת קשר',
    body: [`לשאלות, לבקשות מחיקה ולכל עניין של פרטיות אפשר לפנות אלינו במייל: ${address}`],
  };
}
