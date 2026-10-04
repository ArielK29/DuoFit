import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, MessageSquare, Globe, BarChart3 } from 'lucide-react-native';
import { useUnreadCount } from '@hooks/useUnreadCount';
import { theme } from '@styles/theme';

export default function TabsLayout() {
  const unreadCount = useUnreadCount();
  // Keep the tab bar clear of the home indicator on notched phones.
  const bottomInset = useSafeAreaInsets().bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.cyan,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceHover,
          height: 56 + Math.max(bottomInset, 8),
          paddingBottom: Math.max(bottomInset, 8),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.label.fontFamily,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'בית',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'התאמות',
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "צ'אטים",
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarAccessibilityLabel: unreadCount > 0 ? `צ'אטים, ${unreadCount} הודעות שלא נקראו` : "צ'אטים",
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.magenta,
            color: theme.colors.black,
            fontFamily: theme.typography.bodySmallBold.fontFamily,
          },
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'קהילה',
          tabBarIcon: ({ color, size }) => <Globe color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'התקדמות',
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
