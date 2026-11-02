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
