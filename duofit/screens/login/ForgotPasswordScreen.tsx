import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useAuth } from '@hooks/useAuth';
import { isValidEmail } from '@lib/authErrors';
import { AuthLayout, authStyles } from '@screens/login/AuthLayout';

export const ForgotPasswordScreen: React.FC = () => {
  const router = useRouter();
  const sendPasswordReset = useAuth((state) => state.sendPasswordReset);
  const isLoading = useAuth((state) => state.isLoading);
  const storeError = useAuth((state) => state.error);
  const setError = useAuth((state) => state.setError);

  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setError(null);
  }, [setError]);

  const handleSend = async () => {
    setLocalError(null);
    setError(null);
    if (!isValidEmail(email)) {
      setLocalError('הזן כתובת אימייל תקינה');
      return;
    }
    setSent(await sendPasswordReset(email));
  };

  if (sent) {
    return (
      <AuthLayout subtitle="איפוס סיסמה">
        <Text style={authStyles.successTitle}>שלחנו הוראות</Text>
        <Text style={authStyles.successText}>
          {'אם קיים חשבון עם האימייל הזה, נשלח אליו קישור לאיפוס הסיסמה.\nבדוק גם בספאם.'}
        </Text>
        <Button label="חזרה להתחברות" variant="primary" size="lg" onPress={() => router.replace('/login')} />
      </AuthLayout>
    );
  }

  const error = localError ?? storeError;

  return (
    <AuthLayout subtitle="איפוס סיסמה" description="נשלח לך קישור לאיפוס במייל">
      <Input
        label="אימייל"
        placeholder="name@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        disabled={isLoading}
        onSubmitEditing={handleSend}
      />

      {error && <Text style={authStyles.errorText}>{error}</Text>}

      <View style={authStyles.buttons}>
        <Button label="שלח קישור" variant="primary" size="lg" loading={isLoading} disabled={isLoading} onPress={handleSend} />
      </View>

      <Pressable style={authStyles.linkRow} onPress={() => router.back()} accessibilityRole="link">
        <Text style={authStyles.linkText}>חזרה להתחברות</Text>
      </Pressable>
    </AuthLayout>
  );
};

export default ForgotPasswordScreen;
