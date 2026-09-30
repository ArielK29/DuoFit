// Example conversations from the FitMatch reference. There is no real-time
// backend yet (#15), so these stand in for other people's messages. They're
// shown (and counted in the tab badge) until opened, then they become normal
// chats in useChatStore. The Chat tab is labeled "תצוגה מקדימה" because of it.

export type SeedWhen = { minutesAgo: number } | { daysAgo: number; hour: number; minute: number };

export interface ExampleMessage {
  fromMe: boolean;
  senderName?: string;
  text: string;
  when: SeedWhen;
  unread?: boolean;
}

export interface ExampleConversation {
  id: string;
  name: string;
  isGroup?: boolean;
  verified?: boolean;
  members?: string[];
  memberCount?: number;
  streak?: number;
  messages: ExampleMessage[];
}

export const EXAMPLE_CONVERSATIONS: ExampleConversation[] = [
  {
    id: 'example-push-day',
    name: 'צפון ת"א · Push Day',
    isGroup: true,
    members: ['רועי', 'עדן', 'נועה', 'שיר', 'איתי'],
    memberCount: 6,
    messages: [
      { fromMe: false, senderName: 'נועה', text: 'מי מביא מים?', when: { minutesAgo: 47 }, unread: true },
      { fromMe: false, senderName: 'עדן', text: 'אני מגיע ב-18:00', when: { minutesAgo: 41 }, unread: true },
      {
        fromMe: false,
        senderName: 'רועי',
        text: '12 אימונים ברצף. 🔥 היום לא שוברים.',
        when: { minutesAgo: 34 },
        unread: true,
      },
    ],
  },
  {
    id: 'example-roei',
    name: 'רועי כהן',
    verified: true,
    messages: [{ fromMe: false, text: 'היום אני עומד מאחוריך. אל תבריז.', when: { minutesAgo: 120 }, unread: true }],
  },
  {
    id: 'example-basketball',
    name: 'כדורסל גורדון · רביעי',
    isGroup: true,
    members: ['עדן', 'עומר', 'שיר', 'דניאל'],
    memberCount: 9,
    streak: 5,
    messages: [
      { fromMe: false, senderName: 'עומר', text: 'חסרים לנו שחקנים ב-20:00', when: { daysAgo: 1, hour: 20, minute: 5 } },
      { fromMe: false, senderName: 'עדן', text: 'אני בפנים', when: { daysAgo: 1, hour: 20, minute: 31 } },
    ],
  },
  {
    id: 'example-noa',
    name: 'נועה לוי',
    verified: true,
    messages: [
      { fromMe: false, text: 'מתאים לך ריצה קלה מחר?', when: { daysAgo: 1, hour: 9, minute: 12 } },
      { fromMe: true, text: 'בשמחה. מחר ב-06:30?', when: { daysAgo: 1, hour: 9, minute: 20 } },
    ],
  },
  {
    id: 'example-itai',
    name: 'איתי ברק',
    verified: true,
    streak: 3,
    messages: [
      {
        fromMe: false,
        text: 'תודה על האימון בפארק. בפעם הבאה מאסל-אפ ביחד?',
        when: { daysAgo: 2, hour: 19, minute: 40 },
      },
    ],
  },
];
