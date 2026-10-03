// DuoFit must never show invented people to real users. Everything that is made
// up (partners, posts, groups, leaderboard, example chats) is only visible when
// this flag is on: set EXPO_PUBLIC_DEMO_DATA=true in .env.local for design demos
// and screenshots. It is off by default, in every build.
export const DEMO_DATA = process.env.EXPO_PUBLIC_DEMO_DATA === 'true';
