import { DEMO_DATA } from '@lib/demo';
import { theme } from '@styles/theme';

// Everything here is example data — DuoFit has no backend, user directory or
// social graph yet (#15). The Community tab is labeled "תצוגה מקדימה" because
// of it. The user's own actions (likes, joins, posts, plank record) are real
// and live in useCommunityStore.

// null = unknown (no backend yet): the screen then shows no number at all.
export const MEMBER_COUNT: number | null = DEMO_DATA ? 3214 : null;

export const FEED_FILTERS = ['הכל', 'כוח', 'ריצה', 'קליסטניקס', 'כדורסל'];
export const POST_ACTIVITIES = FEED_FILTERS.slice(1);

export type PostAttachment =
  | { kind: 'record'; kicker: string; value: string; badge?: string }
  | { kind: 'event'; when: string; place: string; spots: number }
  | { kind: 'stats'; items: { value: string; label: string }[] };

export interface CommunityPost {
  id: string;
  authorName: string;
  avatarColor: string;
  verified: boolean;
  activity: string;
  timeAgo: string;
  place: string;
  text: string;
  attachment?: PostAttachment;
  likes: number;
  comments: number;
}

const DEMO_POSTS: CommunityPost[] = [
  {
    id: 'post-maya',
    authorName: 'מאיה שרון',
    avatarColor: theme.colors.cyan,
    verified: true,
    activity: 'כוח',
    timeAgo: 'לפני 25 דק׳',
    place: 'הולמס פלייס',
    text: 'שיא אישי חדש בסקוואט! תודה ליונתן שעמד מאחוריי ולא נתן לי לוותר על החזרה האחרונה.',
    attachment: { kind: 'record', kicker: 'שיא אישי · סקוואט', value: '100 ק"ג', badge: '5+ ק"ג מהשיא הקודם' },
    likes: 48,
    comments: 12,
  },
  {
    id: 'post-omer',
    authorName: 'עומר דהן',
    avatarColor: theme.colors.warning,
    verified: true,
    activity: 'כדורסל',
    timeAgo: 'לפני שעה',
    place: 'מגרש גורדון',
    text: 'חסרים 2 שחקנים ל-3 על 3 הערב. רמה בינונית, אווירה טובה. מי בא?',
    attachment: { kind: 'event', when: 'היום · 20:00', place: 'מגרש גורדון', spots: 2 },
    likes: 19,
    comments: 7,
  },
  {
    id: 'post-shir',
    authorName: 'שיר מזרחי',
    avatarColor: theme.colors.cyan,
    verified: true,
    activity: 'ריצה',
    timeAgo: 'לפני 3 שעות',
    place: 'הטיילת',
    text: 'ריצת בוקר עם הקבוצה: 7 אנשים ב-06:30. מי אמר שאין מוטיבציה בבוקר?',
    attachment: {
      kind: 'stats',
      items: [
        { value: '6.4', label: 'ק"מ' },
        { value: '34:12', label: 'זמן' },
        { value: '5:20', label: 'קצב' },
      ],
    },
    likes: 86,
    comments: 21,
  },
  {
    id: 'post-yonatan',
    authorName: 'יונתן אזולאי',
    avatarColor: theme.colors.magenta,
    verified: true,
    activity: 'כוח',
    timeAgo: 'אתמול',
    place: 'תל אביב',
    text: 'חודש ראשון עם DuoFit: 14 אימונים, 0 הברזות. כשמישהו מחכה לך ב-18:00 אתה פשוט מגיע.',
    likes: 132,
    comments: 34,
  },
  {
    id: 'post-itai',
    authorName: 'איתי ברק',
    avatarColor: theme.colors.magenta,
    verified: true,
    activity: 'קליסטניקס',
    timeAgo: 'אתמול',
    place: 'פארק הירקון',
    text: 'מאסל-אפ ראשון של עדן! 3 שבועות של עבודה משותפת בפארק.',
    attachment: { kind: 'record', kicker: 'שיא אישי · מאסל-אפ', value: 'חזרה ראשונה', badge: 'עדן גבאי' },
    likes: 64,
    comments: 15,
  },
];

export interface CommunityGroup {
  id: string;
  name: string;
  activity: string;
  members: number;
}

const DEMO_GROUPS: CommunityGroup[] = [
  { id: 'group-run', name: 'ריצת בוקר בטיילת', activity: 'ריצה', members: 42 },
  { id: 'group-calisthenics', name: 'קליסטניקס בירקון', activity: 'קליסטניקס', members: 67 },
  { id: 'group-women-strength', name: 'כוח לנשים תל אביב', activity: 'כוח', members: 31 },
  { id: 'group-basketball', name: 'כדורסל גורדון', activity: 'כדורסל', members: 54 },
  { id: 'group-yoga', name: 'יוגה על החוף', activity: 'יוגה', members: 28 },
];

// Weekly plank challenge (example leaderboard + participant count).
export const PLANK_PARTICIPANTS = DEMO_DATA ? 1284 : 1; // outside demo mode: just you
export const EXAMPLE_PLANK_BEST_SECONDS = 165; // 2:45, demo mode only, until the first real attempt

export interface LeaderboardEntry {
  name: string;
  avatarColor: string;
  seconds: number;
}

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { name: 'איתי ברק', avatarColor: theme.colors.magenta, seconds: 372 },
  { name: 'מאיה שרון', avatarColor: theme.colors.cyan, seconds: 348 },
  { name: 'עומר דהן', avatarColor: theme.colors.warning, seconds: 324 },
  { name: 'שיר מזרחי', avatarColor: theme.colors.cyan, seconds: 301 },
  { name: 'רועי כהן', avatarColor: theme.colors.warning, seconds: 287 },
];

export const SEED_POSTS: CommunityPost[] = DEMO_DATA ? DEMO_POSTS : [];
export const GROUPS: CommunityGroup[] = DEMO_DATA ? DEMO_GROUPS : [];
export const PLANK_LEADERBOARD: LeaderboardEntry[] = DEMO_DATA ? DEMO_LEADERBOARD : [];
