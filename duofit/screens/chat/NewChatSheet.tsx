import React, { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { BadgeCheck } from 'lucide-react-native';
import { BottomSheet } from '@components/BottomSheet';
import { PARTNER_POOL } from '@hooks/usePartnerMatching';
import { usePartnerStore } from '@hooks/usePartnerStore';
import { DEMO_DATA } from '@lib/demo';
import { avatarColorFor } from '@lib/chat';
import { theme } from '@styles/theme';

interface NewChatSheetProps {
  visible: boolean;
  onPick: (partnerId: string, partnerName: string) => void;
  onClose: () => void;
}

// "New chat" (the pencil button): pick anyone from the example partner pool.
export const NewChatSheet: React.FC<NewChatSheetProps> = ({ visible, onPick, onClose }) => {
  const realPartners = usePartnerStore((state) => state.partners);
  const loadPartners = usePartnerStore((state) => state.load);
  const people = DEMO_DATA ? PARTNER_POOL : realPartners;

  useEffect(() => {
    if (visible && !DEMO_DATA) loadPartners();
  }, [visible, loadPartners]);

  return (
  <BottomSheet visible={visible} title="שיחה חדשה" onClose={onClose}>
    {people.length === 0 && <Text style={styles.empty}>עוד אין שותפים להתכתב איתם. הם יופיעו כאן כשיצטרפו</Text>}
    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
      {people.map((partner) => (
        <Pressable
          key={partner.id}
          style={styles.row}
          onPress={() => onPick(partner.id, partner.name)}
          accessibilityRole="button"
        >
          <View style={[styles.avatar, { backgroundColor: avatarColorFor(partner.id) }]}>
            <Text style={styles.avatarInitial}>{partner.name[0]}</Text>
          </View>
          <View style={styles.text}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{partner.name}</Text>
              {partner.verified && <BadgeCheck color={theme.colors.cyan} size={16} strokeWidth={2} />}
            </View>
            <Text style={styles.activities}>{partner.activities.join(' · ')}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  </BottomSheet>
  );
};

const styles = StyleSheet.create({
  empty: {
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.xl,
  },
  list: {
    maxHeight: 420,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 64,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.black,
  },
  text: {
    flex: 1,
    alignItems: 'flex-end',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  name: {
    fontSize: 17,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
  },
  activities: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
  },
});
