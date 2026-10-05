import { Platform, Share } from 'react-native';

// Opens the phone's share sheet. The browser preview has no share sheet on desktop,
// so there the text is copied to the clipboard instead of crashing the screen.
export async function shareInvite(message: string): Promise<void> {
  try {
    await Share.share({ message });
  } catch {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(message);
      if (typeof window !== 'undefined') window.alert('ההזמנה הועתקה. אפשר להדביק ולשלוח לחברים');
    }
  }
}
