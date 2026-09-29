import { Tabs } from 'expo-router';
import { Search, LayoutDashboard } from 'lucide-react-native';
import { theme } from '@styles/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.cyan,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceHover,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.label.fontFamily,
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: 'גלה',
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'לוח בקרה',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
