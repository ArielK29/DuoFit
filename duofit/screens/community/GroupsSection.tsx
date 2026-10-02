import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { GROUPS, CommunityGroup } from '@constants/community';
import { useCommunityStore } from '@hooks/useCommunityStore';
import { getActivityStyle } from '@lib/activityStyles';
import { theme } from '@styles/theme';

// "קבוצות באזור": joining is real (saved on the device); the member counts
// and the groups themselves are example data.
export const GroupsSection: React.FC = () => {
  const [showAll, setShowAll] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>קבוצות באזור</Text>
        <Pressable onPress={() => setShowAll((value) => !value)} hitSlop={12} accessibilityRole="button">
          <Text style={styles.aside}>{showAll ? 'פחות' : 'הכל'}</Text>
        </Pressable>
      </View>

      {showAll ? (
        <View style={styles.grid}>
          {GROUPS.map((group) => (
            <GroupCard key={group.id} group={group} fullWidth />
          ))}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {GROUPS.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const GroupCard: React.FC<{ group: CommunityGroup; fullWidth?: boolean }> = ({ group, fullWidth }) => {
  const joined = useCommunityStore((state) => state.joinedGroupIds.includes(group.id));
  const toggleGroup = useCommunityStore((state) => state.toggleGroup);
  const { icon: Icon, color } = getActivityStyle(group.activity);

  return (
    <View style={[styles.card, fullWidth && styles.cardFull]}>
      <View style={[styles.iconTile, { backgroundColor: `${color}26` }]}>
        <Icon color={color} size={24} strokeWidth={2} />
      </View>
      <Text style={styles.name}>{group.name}</Text>
      <Text style={styles.members}>{`${group.members + (joined ? 1 : 0)} חברים`}</Text>
      <Pressable
        style={[styles.joinButton, joined && styles.joinedButton]}
        onPress={() => toggleGroup(group.id)}
        accessibilityRole="button"
        accessibilityState={{ selected: joined }}
      >
        {joined && <Check color={theme.colors.cyan} size={16} strokeWidth={3} />}
        <Text style={[styles.joinText, joined && styles.joinedText]}>{joined ? 'חבר/ה' : 'הצטרף'}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 22,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
  },
  aside: {
    fontSize: 14,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  carousel: {
    gap: theme.spacing.md,
  },
  grid: {
    gap: theme.spacing.md,
  },
  card: {
    width: 200,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.xl * 1.5,
    padding: theme.spacing.lg,
    alignItems: 'flex-end',
  },
  cardFull: {
    width: '100%',
  },
  iconTile: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  name: {
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
    minHeight: 50,
  },
  members: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'stretch',
    minHeight: 48,
    backgroundColor: theme.colors.magenta,
    borderRadius: theme.borderRadius.full,
  },
  joinedButton: {
    backgroundColor: theme.colors.surfaceHover,
  },
  joinText: {
    fontSize: 15,
    fontFamily: theme.typography.button.fontFamily,
    color: theme.colors.black,
  },
  joinedText: {
    color: theme.colors.cyan,
  },
});
