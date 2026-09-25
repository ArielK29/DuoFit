import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { trackEvent } from '@lib/analytics';
import { theme } from '@styles/theme';

// Ensure RTL layout
I18nManager.forceRTL(true);

// Demo/testing hook: this phone number simulates a network failure so the
// connection-error state (03-EDGE-CASES.md) can be exercised without a real
// backend — SMS/OTP sending is simulated and tracked separately in issue #15.
const SIMULATED_NETWORK_FAILURE_PHONE = '0500000000';

export const LoginScreen: React.FC = () => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePhone = (phone: string): boolean => {
    // Israeli mobile format: 05X-XXXXXXX (10 digits total, starting with "05")
    const digitsOnly = phone.replace(/[\s\-()]/g, '');
    return /^05\d{8}$/.test(digitsOnly);
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text);
    // Clear error on next keystroke, per 03-EDGE-CASES.md.
    if (error) {
      setError(null);
    }
  };

  const handleLogin = () => {
    setError(null);

    if (!phoneNumber.trim()) {
      setError('הזן מספר טלפון'); // Enter phone number
      return;
    }

    if (!validatePhone(phoneNumber)) {
      setError('מספר טלפון לא תקין'); // Invalid phone number
      return;
    }

    setLoading(true);

    const digitsOnly = phoneNumber.replace(/[\s\-()]/g, '');

    // Simulate API call
    setTimeout(() => {
      setLoading(false);

      if (digitsOnly === SIMULATED_NETWORK_FAILURE_PHONE) {
        Alert.alert(
          'בעיה בחיבור',
          'לא הצלחנו להתחבר לשרת. בדוק את ה-Wi-Fi שלך',
          [
            { text: 'צא', style: 'cancel' },
            { text: 'נסה שוב', onPress: handleLogin },
          ]
        );
        return;
      }

      trackEvent('signup_started');
      trackEvent('otp_sent');

      Alert.alert('הצלחה', `קוד OTP נשלח ל-${phoneNumber}`);
      router.push({ pathname: '/verify-otp', params: { phoneNumber } });
    }, 1500);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
      paddingHorizontal: theme.spacing.lg,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl,
    },
    header: {
      textAlign: 'center',
      marginBottom: theme.spacing.xxl,
    },
    title: {
      fontSize: 32,
      fontWeight: 'normal',
      fontFamily: theme.typography.h1.fontFamily,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      fontFamily: theme.typography.body.fontFamily,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    description: {
      fontSize: 14,
      fontFamily: theme.typography.bodySmall.fontFamily,
      color: theme.colors.textTertiary,
      textAlign: 'center',
      lineHeight: 20,
    },
    form: {
      marginVertical: theme.spacing.xl,
    },
    inputWrapper: {
      marginBottom: theme.spacing.lg,
    },
    buttonContainer: {
      marginTop: theme.spacing.xl,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginVertical: theme.spacing.md,
      fontSize: 14,
      fontFamily: theme.typography.bodySmall.fontFamily,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.surfaceHover,
      marginVertical: theme.spacing.lg,
    },
    footer: {
      textAlign: 'center',
      marginTop: theme.spacing.xl,
    },
    footerText: {
      color: theme.colors.textTertiary,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: theme.typography.label.fontFamily,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🏋️ DuoFit</Text>
          <Text style={styles.subtitle}>למצוא את בן הזוג הבא שלך</Text>
          <Text style={styles.description}>
            התחברות מדויקת כדי לקבל OTP קוד בטלפון שלך
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Input
              label="מספר טלפון"
              placeholder="050-123-4567"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              disabled={loading}
              error={error ?? undefined}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              label={loading ? 'שליחה...' : 'קבל קוד OTP'}
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              onPress={handleLogin}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            בלחיצה על "קבל קוד OTP" אתה מסכים{'\n'}לתנאי השירות שלנו
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default LoginScreen;
