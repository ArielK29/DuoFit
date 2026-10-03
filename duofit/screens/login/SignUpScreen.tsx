import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useAuth } from '@hooks/useAuth';
import { MIN_PASSWORD_LENGTH, isValidEmail } from '@lib/authErrors';
import { trackEvent } from '@lib/analytics';
import { AuthLayout, authStyles } from '@screens/login/AuthLayout';

export const SignUpScreen: React.FC = () => {
  const router = useRouter();
  const signUp = useAuth((state) => state.signUp);
  const resendConfirmation = useAuth((state) => state.resendConfirmation);
  const isLoading = useAuth((state) => state.isLoading);
  const storeError = useAuth((state) => state.error);
  const setError = useAuth((state) => state.setError);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    setError(null);
  }, [setError]);

  const handleSignUp = async () => {
    setLocalError(null);
    setError(null);

    if (name.trim().length < 2) {
      setLocalError('הזן שם (לפחות 2 תווים)');
      return;
    }
    if (!isValidEmail(email)) {
      setLocalError('הזן כתובת אימייל תקינה');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setLocalError(`הסיסמה צריכה להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים`);
      return;
    }

    trackEvent('signup_started');
    const result = await signUp(email, password, name);
    if (!result) return;
    // Email confirmation is on: the account only works after the link in the email.
    if (result.needsEmailConfirmation) setSentTo(email.trim());
    // Otherwise a session exists and the root layout continues to profile setup.
  };

  const handleResend = async () => {
    if (!sentTo) return;
    const ok = await resendConfirmation(sentTo);
    setResent(ok);
  };

  if (sentTo) {
    return (
      <AuthLayout subtitle="כמעט סיימנו">
        <Text style={authStyles.successTitle}>בדוק את תיבת הדואר</Text>
        <Text style={authStyles.successText}>
          {`שלחנו קישור אימות אל ${sentTo}.\nלחץ עליו, ואחר כך חזור לכאן והתחבר.\nאם לא מצאת, בדוק גם בספאם.`}
        </Text>
        {resent && <Text style={authStyles.successText}>נשלח שוב. זה יכול לקחת דקה</Text>}
        {storeError && <Text style={authStyles.errorText}>{storeError}</Text>}
        <View style={authStyles.buttons}>
          <Button label="חזרה להתחברות" variant="primary" size="lg" onPress={() => router.replace('/login')} />
          <Button label="שלח שוב את המייל" variant="secondary" size="lg" loading={isLoading} onPress={handleResend} />
        </View>
      </AuthLayout>
    );
  }

  const error = localError ?? storeError;

  return (
    <AuthLayout subtitle="יוצרים חשבון" description="הרשמה עם אימייל. נשלח לך מייל לאימות החשבון">
      <Input
        label="שם"
        placeholder="איך יקראו לך באפליקציה"
        value={name}
        onChangeText={setName}
        autoComplete="name"
        disabled={isLoading}
      />
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
      />
      <Input
        label="סיסמה"
        placeholder={`לפחות ${MIN_PASSWORD_LENGTH} תווים`}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        disabled={isLoading}
        onSubmitEditing={handleSignUp}
      />

      {error && <Text style={authStyles.errorText}>{error}</Text>}

      <View style={authStyles.buttons}>
        <Button label="הירשם" variant="primary" size="lg" loading={isLoading} disabled={isLoading} onPress={handleSignUp} />
      </View>

      <Pressable style={authStyles.linkRow} onPress={() => router.replace('/login')} accessibilityRole="link">
        <Text style={authStyles.linkText}>כבר יש לך חשבון? התחבר</Text>
      </Pressable>
      <Text style={authStyles.muted}>בהרשמה אתה מסכים לתנאי השירות שלנו</Text>
    </AuthLayout>
  );
};

export default SignUpScreen;
