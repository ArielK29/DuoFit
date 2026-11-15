import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSubscriptionStore } from '@hooks/useSubscriptionStore';
import { inviteLimitMessage } from '@lib/subscription';

const TITLE = 'נגמרו ההזמנות לשבוע';

// Shown when the server refuses a new invitation because the weekly limit of the member's plan is used up.
// Free and Plus members get a button to the plans screen; Pro already has the most, so it is only a message.
export function notifyInviteLimit(): void {
  const tier = useSubscriptionStore.getState().subscription.tier;
  const text = inviteLimitMessage(tier);
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(text);
    return;
  }
  if (tier === 'pro') {
    Alert.alert(TITLE, text);
    return;
  }
  Alert.alert(TITLE, text, [
    { text: 'אולי אחר כך', style: 'cancel' },
    { text: 'לחבילות', onPress: () => router.push('/paywall') },
  ]);
}
