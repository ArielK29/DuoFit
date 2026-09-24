import { useState } from 'react';
import { I18nManager } from 'react-native';
import { LoginScreen } from './screens/login/LoginScreen';
import { VerifyOTPScreen } from './screens/login/VerifyOTPScreen';

// Force RTL layout for Hebrew
I18nManager.forceRTL(true);

export default function App() {
  const [screen, setScreen] = useState<'Login' | 'VerifyOTP'>('Login');

  if (screen === 'VerifyOTP') {
    return <VerifyOTPScreen onNavigate={(s) => setScreen(s as 'Login')} />;
  }

  return <LoginScreen onNavigate={(s) => setScreen(s as 'VerifyOTP')} />;
}
