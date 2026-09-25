import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@hooks/useAuth';
import { theme } from '@styles/theme';

export default function Discover() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: theme.colors.text, fontSize: 20, fontFamily: theme.typography.h2.fontFamily }}>🎉 ברוך הבא ל-DuoFit!</Text>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 14, marginTop: 8, fontFamily: theme.typography.bodySmall.fontFamily }}>מסך Discover בבנייה...</Text>
      {/* Dev-only: lets QA get back to the login flow without clearing app storage
          manually. Gated behind __DEV__ so it can never render in a release build. */}
      {__DEV__ && (
        <Pressable
          onPress={() => {
            useAuth.getState().logout();
            router.replace('/login');
          }}
          style={{ marginTop: 24, padding: 12 }}
        >
          <Text style={{ color: theme.colors.magenta, fontSize: 14, fontFamily: theme.typography.label.fontFamily }}>
            התנתק (לבדיקות)
          </Text>
        </Pressable>
      )}
    </View>
  );
}
