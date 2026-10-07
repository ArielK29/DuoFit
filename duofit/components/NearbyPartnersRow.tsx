import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MapPin, Plus } from 'lucide-react-native';
import { PartnerWithDistance } from '@hooks/usePartnerMatching';
import { theme } from '@styles/theme';

interface NearbyPartnersRowProps {
  partners: PartnerWithDistance[];
  onOpen: (partner: PartnerWithDistance) => void;
  onInvite: (partner: PartnerWithDistance) => void;
}

// Fixed row of the closest candidates (cards share the width evenly), each
// with a one-tap invite.
export const NearbyPartnersRow: React.FC<NearbyPartnersRowProps> = ({ partners, onOpen, onInvite }) => {
  return (
    <View style={styles.row}>
      {partners.map((partner) => (
        <Pressable key={partner.id} style={styles.card} onPress={() => onOpen(partner)}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{partner.name[0]}</Text>
          </View>
          <Text style={styles.name}>{partner.name}</Text>
          {partner.distanceKm !== null && (
            <View style={styles.metaRow}>
              <MapPin color={theme.colors.textTertiary} size={11} strokeWidth={2} />
              <Text style={styles.meta}>{`${partner.distanceKm.toFixed(1)} ק"מ`}</Text>
            </View>
          )}
          <Text style={styles.activity} numberOfLines={1}>
            {partner.activities[0]}
          </Text>
          <Pressable
            style={styles.inviteButton}
            onPress={() => onInvite(partner)}
            accessibilityLabel={`הזמן את ${partner.name} לאימון`}
          >
            <Plus color={theme.colors.black} size={16} strokeWidth={2.5} />
            <Text style={styles.inviteText}>הזמן</Text>
          </Pressable>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    borderWidth: 2,
    borderColor: theme.colors.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  avatarInitial: {
    fontSize: 20,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.cyan,
  },
  name: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  meta: {
    fontSize: 11,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textTertiary,
  },
  activity: {
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    alignSelf: 'stretch',
    minHeight: 48,
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.cyan,
    borderRadius: theme.borderRadius.full,
  },
  inviteText: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.black,
  },
});
