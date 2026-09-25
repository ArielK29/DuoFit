import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  I18nManager,
  TextInput,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '@components/Button';
import { theme } from '@styles/theme';

I18nManager.forceRTL(true);

// Demo code that simulates a successful verification (no real SMS/OTP backend yet — see issue #15).
const DEMO_SUCCESS_OTP = '123456';

// Demo/testing hook: entering this code simulates a network failure so the
// connection-error state (03-EDGE-CASES.md) can be exercised without a real backend.
const SIMULATED_NETWORK_FAILURE_OTP = '000000';

// Per 03-EDGE-CASES.md "OTP Code Expired": code is considered expired after 10 minutes.
const OTP_EXPIRY_MS = 10 * 60 * 1000;

export const VerifyOTPScreen: React.FC = () => {
  const router = useRouter();
  // No fallback placeholder here on purpose: an empty phoneNumber must stay falsy
  // so ProfileSetupScreen's "missing identity" guard can actually catch a
  // malformed deep link that skips straight to this screen without a real phone.
  const { phoneNumber = '' } = useLocalSearchParams<'/verify-otp', { phoneNumber: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendCycle, setResendCycle] = useState(0);
  const [sentAt, setSentAt] = useState(() => Date.now());
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Resend cooldown. Re-arms whenever resendCycle changes (i.e. after each resend),
  // since the previous interval clears itself once it reaches zero.
  useEffect(() => {
    setTimer(60);
    setCanResend(false);

    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCycle]);

  const triggerShake = () => {
    // Shake animation per 03-EDGE-CASES.md: -3px to +3px horizontal, 100ms total.
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -3, duration: 25, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 25, useNativeDriver: true }),
    ]).start();
  };

  const handleOtpChange = (text: string) => {
    setOtp(text);
    // Clear error on next keystroke, per 03-EDGE-CASES.md.
    if (error) {
      setError(null);
    }
  };

  const handleVerify = () => {
    setError(null);

    if (!otp || otp.length !== 6) {
      setError('הזן קוד 6 ספרות'); // Enter 6-digit code
      triggerShake();
      return;
    }

    setLoading(true);

    // Simulate API verification
    setTimeout(() => {
      setLoading(false);

      if (otp === SIMULATED_NETWORK_FAILURE_OTP) {
        Alert.alert(
          'בעיה בחיבור',
          'לא הצלחנו להתחבר לשרת. בדוק את ה-Wi-Fi שלך',
          [
            { text: 'צא', style: 'cancel' },
            { text: 'נסה שוב', onPress: handleVerify },
          ]
        );
        return;
      }

      if (Date.now() - sentAt > OTP_EXPIRY_MS) {
        setError('הקוד שלך פקע'); // Your code expired
        triggerShake();
        return;
      }

      if (otp === DEMO_SUCCESS_OTP) {
        Alert.alert('הצלחה', 'אתה התחברת בהצלחה!');
        router.push({ pathname: '/profile-setup', params: { phoneNumber } });
      } else {
        setError('קוד שגוי. נסה שוב'); // Wrong code. Try again (wording per 03-EDGE-CASES.md)
        triggerShake();
      }
    }, 1500);
  };

  const handleResend = () => {
    setOtp('');
    setError(null);
    setSentAt(Date.now());
    setResendCycle((c) => c + 1);
    Alert.alert('הצלחה', 'קוד OTP חדש נשלח');
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
      fontSize: 28,
      fontWeight: 'normal',
      fontFamily: theme.typography.h2.fontFamily,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      fontFamily: theme.typography.bodySmall.fontFamily,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    phone: {
      fontSize: 14,
      color: theme.colors.cyan,
      textAlign: 'center',
      fontWeight: 'normal',
      fontFamily: theme.typography.bodySmallBold.fontFamily,
    },
    form: {
      marginVertical: theme.spacing.xl,
    },
    otpContainer: {
      marginBottom: theme.spacing.lg,
    },
    otpLabel: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: 'normal',
      fontFamily: theme.typography.label.fontFamily,
      marginBottom: theme.spacing.sm,
      textAlign: 'right',
    },
    otpInput: {
      borderWidth: 2,
      borderColor: theme.colors.surfaceHover,
      borderRadius: theme.borderRadius.md,
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: 'normal',
      fontFamily: theme.typography.monoBold.fontFamily,
      textAlign: 'center',
      paddingVertical: theme.spacing.md,
      letterSpacing: 8,
      minHeight: 60,
    },
    otpInputError: {
      borderColor: theme.colors.error,
    },
    timer: {
      textAlign: 'center',
      marginTop: theme.spacing.md,
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontFamily: theme.typography.bodySmall.fontFamily,
    },
    timerActive: {
      color: theme.colors.error,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginVertical: theme.spacing.md,
      fontSize: 14,
      fontFamily: theme.typography.bodySmall.fontFamily,
    },
    buttonContainer: {
      marginTop: theme.spacing.xl,
    },
    resendContainer: {
      marginTop: theme.spacing.lg,
    },
    resendText: {
      textAlign: 'center',
      color: theme.colors.textTertiary,
      fontSize: 14,
      fontFamily: theme.typography.bodySmall.fontFamily,
      marginBottom: theme.spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>אימות קוד OTP</Text>
          <Text style={styles.subtitle}>הזנו את הקוד שנשלח ל:</Text>
          <Text style={styles.phone}>{phoneNumber}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.otpContainer}>
            <Text style={styles.otpLabel}>קוד OTP (6 ספרות)</Text>
            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <TextInput
                style={[styles.otpInput, error && styles.otpInputError]}
                placeholder="000000"
                placeholderTextColor={theme.colors.textTertiary}
                value={otp}
                onChangeText={handleOtpChange}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
                selectTextOnFocus
              />
            </Animated.View>
            <Text style={[styles.timer, !canResend && styles.timerActive]}>
              {!canResend ? `שלח מחדש בעוד ${timer}s` : 'לחץ כדי לשלוח מחדש'}
            </Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonContainer}>
            <Button
              label={loading ? 'אימות...' : 'אמת קוד'}
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              onPress={handleVerify}
            />
          </View>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>לא קיבלת קוד?</Text>
            <Button
              label="שלח קוד חדש"
              variant="secondary"
              disabled={!canResend || loading}
              onPress={handleResend}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default VerifyOTPScreen;
