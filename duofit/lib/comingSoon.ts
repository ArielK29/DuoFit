import { Alert, Platform } from 'react-native';

// Inviting a real member or messaging them needs the shared server tables
// (workouts, chats; issue #65 stage 2). Until they exist we say so honestly
// instead of pretending an invitation was sent.
const TITLE = 'עוד מעט';
const MESSAGE = 'ההזמנות וההודעות בין חברים יופעלו בקרוב. עדיין לא נשלחה שום הזמנה.';

export function showInvitesComingSoon(): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${TITLE}: ${MESSAGE}`);
    return;
  }
  Alert.alert(TITLE, MESSAGE);
}
