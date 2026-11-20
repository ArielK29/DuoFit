import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import { useSubscriptionStore } from '@hooks/useSubscriptionStore';
import { DEMO_DATA } from '@lib/demo';
import { startPurchases, stopPurchases } from '@lib/purchases';

// Connects the signed-in member to RevenueCat (same id as the Supabase user) and keeps the plan in sync: loaded at sign-in
// and every time the app comes back to the foreground (a renewal, a cancel or a purchase on another device shows up).
export function PurchasesSync() {
  const userId = useAuth((state) => state.user?.id);

  useEffect(() => {
    if (DEMO_DATA) return;
    if (!userId) {
      useSubscriptionStore.getState().reset();
      stopPurchases();
      return;
    }
    startPurchases(userId);
    useSubscriptionStore.getState().refresh(userId);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') useSubscriptionStore.getState().refresh(userId);
    });
    return () => appState.remove();
  }, [userId]);

  return null;
}
