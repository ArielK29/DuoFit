import { Alert, Platform } from 'react-native';

// One plain message when something that should have been saved on the server did not go through.
export function notifyFailure(message?: string): void {
  const text = message ?? 'הפעולה לא הושלמה. בדוק את החיבור ונסה שוב';
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(text);
    return;
  }
  Alert.alert('משהו השתבש', text);
}
