import {
  EXAMPLE_PLANK_BEST_SECONDS,
  PLANK_LEADERBOARD,
  LeaderboardEntry,
} from '@constants/community';

const TOP_ROWS = 5;
// A time of exactly EXAMPLE_PLANK_BEST_SECONDS lands on this rank (kept in
// sync with the Home "באתגר הפלאנק" ring), and ranks between the 5th place
// and that time are spread linearly. Example model — there is no server-side
// leaderboard yet.
const EXAMPLE_RANK = 37;

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function getDaysLeftInWeek(now: Date): number {
  return 6 - now.getDay(); // week ends Saturday (getDay: 0 = Sunday)
}

export function getPlankSeconds(bestSeconds: number | null): number {
  return bestSeconds ?? EXAMPLE_PLANK_BEST_SECONDS;
}

export function computePlankRank(seconds: number): number {
  const beaten = PLANK_LEADERBOARD.filter((entry) => entry.seconds > seconds).length;
  if (beaten < TOP_ROWS) return beaten + 1;

  const fifth = PLANK_LEADERBOARD[TOP_ROWS - 1].seconds;
  const span = fifth - EXAMPLE_PLANK_BEST_SECONDS;
  const progress = (fifth - seconds) / span;
  return TOP_ROWS + 1 + Math.round(progress * (EXAMPLE_RANK - TOP_ROWS - 1));
}

export interface LeaderboardRow extends LeaderboardEntry {
  rank: number;
  isMe: boolean;
}

// Top five (with the user slotted in if they made it) plus the user's own row
// underneath when they didn't.
export function buildLeaderboard(seconds: number, myName: string): LeaderboardRow[] {
  const myRank = computePlankRank(seconds);
  const me: LeaderboardEntry = { name: myName, avatarColor: '', seconds };

  const top = [...PLANK_LEADERBOARD, me]
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, TOP_ROWS)
    .map((entry, index) => ({ ...entry, rank: index + 1, isMe: entry === me }));

  if (myRank <= TOP_ROWS) return top;
  return [...top, { ...me, rank: myRank, isMe: true }];
}
