import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, MessageCircle, Plus } from 'lucide-react-native';
import { BottomSheet } from '@components/BottomSheet';
import { Button } from '@components/Button';
import { useGroupStore } from '@hooks/useGroupStore';
import { GROUP_ACTIVITIES, RemoteGroup, toGroupKey } from '@lib/remoteGroups';
import { DEMO_DATA } from '@lib/demo';
import { visualRightText } from '@lib/rtl';
import { GROUPS, CommunityGroup } from '@constants/community';
import { useCommunityStore } from '@hooks/useCommunityStore';
import { getActivityStyle } from '@lib/activityStyles';
import { theme } from '@styles/theme';

// "קבוצות באזור": joining is real (saved on the device); the member counts
// and the groups themselves are example data.
export const GroupsSection: React.FC = () => {
  const [showAll, setShowAll] = useState(false);

  // Real members see the real groups (created by members); the demo keeps its example groups.
  if (!DEMO_DATA) return <RealGroupsSection />;
  if (GROUPS.length === 0) return null;

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

// Real groups: the directory from the server, join / leave, open the group chat, create a group.
const RealGroupsSection: React.FC = () => {
  const router = useRouter();
  const groups = useGroupStore((state) => state.groups);
  const joinedIds = useGroupStore((state) => state.joinedIds);
  const loaded = useGroupStore((state) => state.loaded);
  const [createVisible, setCreateVisible] = useState(false);

  useEffect(() => {
    useGroupStore.getState().load();
  }, []);

  const openChat = (group: RemoteGroup) =>
    router.push({ pathname: '/conversation', params: { partnerId: toGroupKey(group.id), partnerName: group.name } });

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>קבוצות</Text>
        <Pressable style={styles.createLink} onPress={() => setCreateVisible(true)} hitSlop={12} accessibilityRole="button">
          <Plus color={theme.colors.cyan} size={16} strokeWidth={2.5} />
          <Text style={styles.createText}>צור קבוצה</Text>
        </Pressable>
      </View>

      {groups.length === 0 ? (
        <Text style={styles.empty}>{loaded ? 'עוד אין קבוצות. פתח את הראשונה והזמן אחרים להצטרף' : 'טוען קבוצות...'}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {groups.map((group) => {
            const joined = joinedIds.includes(group.id);
            const { icon: Icon, color } = getActivityStyle(group.activity);
            return (
              <View key={group.id} style={styles.card}>
                <View style={[styles.iconTile, { backgroundColor: `${color}26` }]}>
                  <Icon color={color} size={24} strokeWidth={2} />
                </View>
                <Text style={styles.name}>{group.name}</Text>
                <Text style={styles.members}>{`${group.memberCount} חברים`}</Text>
                {joined ? (
                  <View style={styles.actions}>
                    <Pressable style={[styles.joinButton, styles.openButton]} onPress={() => openChat(group)} accessibilityRole="button">
                      <MessageCircle color={theme.colors.black} size={16} strokeWidth={2.5} />
                      <Text style={styles.joinText}>צ'אט</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.joinButton}
                    onPress={() => useGroupStore.getState().join(group.id)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.joinText}>הצטרף</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      <CreateGroupSheet visible={createVisible} onClose={() => setCreateVisible(false)} />
    </View>
  );
};

const CreateGroupSheet: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => (
  <BottomSheet visible={visible} title="קבוצה חדשה" onClose={onClose}>
    <CreateGroupForm onClose={onClose} />
  </BottomSheet>
);

const CreateGroupForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [activity, setActivity] = useState(GROUP_ACTIVITIES[0]);
  const [sending, setSending] = useState(false);
  const canCreate = name.trim().length >= 2 && !sending;

  const create = async () => {
    if (!canCreate) return;
    setSending(true);
    const created = await useGroupStore.getState().create(name, activity);
    setSending(false);
    if (created) onClose();
  };

  return (
    <View>
      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={setName}
        placeholder="שם הקבוצה"
        placeholderTextColor={theme.colors.textTertiary}
        maxLength={60}
      />
      <View style={styles.activityRow}>
        {GROUP_ACTIVITIES.map((item) => (
          <Pressable
            key={item}
            style={[styles.activityChip, activity === item && styles.activityChipActive]}
            onPress={() => setActivity(item)}
            accessibilityState={{ selected: activity === item }}
          >
            <Text style={[styles.activityText, activity === item && styles.activityTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <Button label="צור קבוצה" variant="primary" size="lg" loading={sending} disabled={!canCreate} onPress={create} />
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
  createLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minHeight: 48,
  },
  createText: {
    fontSize: 14,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.cyan,
  },
  empty: {
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    ...visualRightText,
  },
  actions: {
    alignSelf: 'stretch',
  },
  openButton: {
    backgroundColor: theme.colors.cyan,
  },
  nameInput: {
    minHeight: 56,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    fontSize: 16,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.text,
    textAlign: 'right',
    marginBottom: theme.spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  activityChip: {
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
  },
  activityChipActive: {
    backgroundColor: theme.colors.cyan,
  },
  activityText: {
    fontSize: 15,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  activityTextActive: {
    color: theme.colors.black,
  },
});
