import { useEffect, useState } from 'react';
import { ActivityIndicator, I18nManager, View, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import { Heebo_400Regular, Heebo_500Medium, Heebo_700Bold, Heebo_800ExtraBold } from '@expo-google-fonts/heebo';
import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { LoginScreen } from './screens/login/LoginScreen';
import { VerifyOTPScreen } from './screens/login/VerifyOTPScreen';
import { ProfileSetupScreen } from './screens/login/ProfileSetupScreen';
import { useAuth } from './hooks/useAuth';
import { theme } from './styles/theme';
import type { NavigateAction, OnNavigate } from './types/navigation';

// Force RTL layout for Hebrew
I18nManager.forceRTL(true);

// Keep the native splash screen up until fonts have finished loading (or
// failed), so there's no flash-of-unstyled-content moment where UI briefly
// renders with the OS default font. Must be called at module scope,
// unawaited, before the splash screen would otherwise auto-hide.
SplashScreen.preventAutoHideAsync();

type Screen = NavigateAction['screen'];

// Shared loading view for both the zustand-hydration gate and the
// font-loading gate below, so the spinner isn't duplicated in two places.
function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={theme.colors.cyan} size="large" />
    </View>
  );
}

export default function App() {
  // zustand's `persist` middleware rehydrates from AsyncStorage asynchronously,
  // after the first render, so we wait for it to finish before picking a screen —
  // otherwise every launch would briefly flash the Login screen even for an
  // already-authenticated user.
  const [hasHydrated, setHasHydrated] = useState(() => useAuth.persist.hasHydrated());
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const [screen, setScreen] = useState<Screen>('Login');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Custom fonts referenced throughout constants/typography.ts (Anton, Heebo,
  // Space Grotesk, JetBrains Mono). Weight-specific constants are loaded
  // individually since each Google Fonts weight ships as its own family name.
  const [fontsLoaded, fontError] = useFonts({
    Anton_400Regular,
    Heebo_400Regular,
    Heebo_500Medium,
    Heebo_700Bold,
    Heebo_800ExtraBold,
    SpaceGrotesk_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });
  const fontsReady = fontsLoaded || !!fontError;

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

  useEffect(() => {
    if (hasHydrated && fontsReady) {
      SplashScreen.hideAsync();
    }
  }, [hasHydrated, fontsReady]);

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

  // Don't render the app until both zustand hydration and font loading have
  // settled — otherwise UI could briefly commit with the OS default font
  // before swapping to the custom typefaces once they finish loading.
  if (!hasHydrated || !fontsReady) {
    return <LoadingScreen />;
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
        <Text style={{ color: theme.colors.text, fontSize: 20, fontFamily: theme.typography.h2.fontFamily }}>🎉 ברוך הבא ל-DuoFit!</Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 14, marginTop: 8, fontFamily: theme.typography.bodySmall.fontFamily }}>מסך Discover בבנייה...</Text>
      </View>
    );
  }

  return <LoginScreen onNavigate={handleNavigate} />;
}
