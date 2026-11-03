// Choosing where to train: search the known venues, or type any other place. Pure helpers, no React.

// The server accepts a place name of 1 to 100 characters (workouts.location and the chat invitation).
export const MAX_PLACE_LENGTH = 100;

export function filterPlaces(names: string[], query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return names;
  return names.filter((name) => name.toLowerCase().includes(needle));
}

// What the member typed, as a place of their own, or null when it is empty, too long or already one of the known venues.
export function customPlace(query: string, names: string[]): string | null {
  const text = query.trim();
  if (!text || text.length > MAX_PLACE_LENGTH) return null;
  if (names.some((name) => name.trim().toLowerCase() === text.toLowerCase())) return null;
  return text;
}

// Safety first: members meet only in public places. The server cannot know what a typed name is, so the app refuses the
// words that point to a private place (a home, a flat, "at my place") and also asks the member to confirm the place is public.
const PRIVATE_HEBREW = /^[בהלומש]{0,2}(בית|דירה|דירת|אצל|אצלי|אצלו|אצלה|פרטי|פרטית|בניין|מגורים|וילה|מרפסת|גג|חצר)$/;
const PRIVATE_ENGLISH = /^(house|home|apartment|flat|room|private|villa|my|his|her)$/;
const PUBLIC_ROOM_WORDS = new Set(['כושר', 'אימון', 'אימונים', 'כוח', 'יוגה', 'פילאטיס', 'ספורט']);

export const PRIVATE_PLACE_MESSAGE = 'אפשר להיפגש רק במקום ציבורי (פארק, חוף, חדר כושר, מגרש). בחר מקום ציבורי';

export function privatePlaceProblem(text: string): string | null {
  const tokens = text.toLowerCase().split(/[^a-z\u0590-\u05ff]+/).filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (PRIVATE_HEBREW.test(token) || PRIVATE_ENGLISH.test(token)) return PRIVATE_PLACE_MESSAGE;
    // "חדר" on its own is a room; "חדר כושר" and "חדר אימונים" are gyms.
    if (/^[בהלומש]{0,2}חדר$/.test(token) && !PUBLIC_ROOM_WORDS.has(tokens[i + 1] ?? '')) return PRIVATE_PLACE_MESSAGE;
  }
  return null;
}
