import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SearchX } from 'lucide-react-native';
import { EmptyState } from '@components/EmptyState';
import { theme } from '@styles/theme';

// Shown for any address the app does not know (for example a hand-typed web URL),
// instead of the default English "Unmatched Route" page.
export default function NotFound() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <EmptyState
        icon={<SearchX color={theme.colors.textTertiary} size={48} strokeWidth={2} />}
        headline="הדף לא נמצא"
        subheading="הכתובת שחיפשת לא קיימת באפליקציה"
        ctaLabel="חזרה לדף הבית"
        onCtaPress={() => router.replace('/')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
  },
});
