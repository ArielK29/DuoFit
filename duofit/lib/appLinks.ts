import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

// Where an e-mail link (sign-up confirmation, password reset) should bring the member back to:
// this site on the web, the app's own link (duofit://...) on the phone. The address has to be on the
// Supabase "Redirect URLs" allow list, otherwise Supabase falls back to the Site URL.
export function appLinkUrl(path: string): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return `${window.location.origin}/${path}`;
  return Linking.createURL(path);
}
