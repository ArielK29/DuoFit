import { useEffect, useState } from 'react';
import { ActivityIndicator, I18nManager, View, Text } from 'react-native';
import { LoginScreen } from './screens/login/LoginScreen';
import { VerifyOTPScreen } from './screens/login/VerifyOTPScreen';
import { ProfileSetupScreen } from './screens/login/ProfileSetupScreen';
import { useAuth } from './hooks/useAuth';
import { theme } from './styles/theme';
import type { NavigateAction, OnNavigate } from './types/navigation';

// Force RTL layout for Hebrew
I18nManager.forceRTL(true);

type Screen = NavigateAction['screen'];

export default function App() {
  // zustand's `persist` middleware rehydrates from AsyncStorage asynchronously,
  // after the first render, so we wait for it to finish before picking a screen —
  // otherwise every launch would briefly flash the Login screen even for an
  // already-authenticated user.
  const [hasHydrated, setHasHydrated] = useState(() => useAuth.persist.hasHydrated());
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const [screen, setScreen] = useState<Screen>('Login');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (useAuth.persist.hasHydrated()) {
      setHasHydrated(true);
      return;
    }

    const unsubscribe = useAuth.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    return unsubscribe;
  }, []);

  const handleNavigate: OnNavigate = (action) => {
    switch (action.screen) {
      case 'VerifyOTP':
      case 'Profile':
        setPhoneNumber(action.phoneNumber);
        setScreen(action.screen);
        break;
      case 'Login':
      case 'Discover':
        setScreen(action.screen);
        break;
    }
  };

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={theme.colors.cyan} size="large" />
      </View>
    );
  }

  // Session restore: decided directly at render time (not mirrored into `screen`
  // via a separate effect) so there's no extra render cycle where a stale
  // screen==='Login' could commit before flipping to Discover.
  const showDiscover = screen === 'Discover' || (screen === 'Login' && isAuthenticated);

  if (screen === 'VerifyOTP') {
    return <VerifyOTPScreen onNavigate={handleNavigate} phoneNumber={phoneNumber} />;
  }

  if (screen === 'Profile') {
    return <ProfileSetupScreen onNavigate={handleNavigate} phoneNumber={phoneNumber} />;
  }

  if (showDiscover) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.text, fontSize: 20 }}>🎉 ברוך הבא ל-DuoFit!</Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 14, marginTop: 8 }}>מסך Discover בבנייה...</Text>
      </View>
    );
  }

  return <LoginScreen onNavigate={handleNavigate} />;
}
