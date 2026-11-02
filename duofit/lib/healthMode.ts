// What the Home and Progress screens show for the health numbers.
// 'live'    = the member's real numbers.
// 'loading' = the real numbers are on their way: show a quiet placeholder, never the example numbers.
// 'connect' = this phone has Apple Health but it is not connected (or the last read failed): show the connect card.
// 'example' = this phone cannot give health data (Android, web, Expo Go): labelled example numbers.
export type HealthMode = 'live' | 'loading' | 'connect' | 'example';

export interface HealthModeInput {
  hydrated: boolean; // the saved settings and last numbers have been read from the phone's storage
  connected: boolean;
  available: boolean | null; // null until the phone has answered
  failed: boolean;
  hasFreshSnapshot: boolean; // the last numbers were read today
}

export function healthMode(input: HealthModeInput): HealthMode {
  if (!input.hydrated) return 'loading';
  if (input.connected && input.hasFreshSnapshot) return 'live';
  if (input.connected) return input.failed ? 'connect' : 'loading';
  if (input.available === null) return 'loading';
  return input.available ? 'connect' : 'example';
}

export function isSameDay(iso: string, now: Date): boolean {
  const date = new Date(iso);
  return !Number.isNaN(date.getTime()) && date.toDateString() === now.toDateString();
}
