import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Sparkles } from 'lucide-react-native';
import { PartnerWithDistance } from '@hooks/usePartnerMatching';
import { Button } from '@components/Button';
import { theme } from '@styles/theme';

interface SuggestedPartnerCardProps {
  partner: PartnerWithDistance;
  sharedActivity?: string;
  onViewProfile: () => void;
  onInvite: () => void;
}

// "שותף מוצע היום" — one daily pick from the (mock) candidate pool, so Home
// always has a direct path into matching.
export const SuggestedPartnerCard: React.FC<SuggestedPartnerCardProps> = ({
  partner,
  sharedActivity,
  onViewProfile,
  onInvite,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <LinearGradient
          colors={[theme.colors.magenta, theme.colors.cyan]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarInitial}>{partner.name[0]}</Text>
        </LinearGradient>
        <View style={styles.headerText}>
          <Text style={styles.name}>
            {partner.name}, {partner.age}
          </Text>
          <View style={styles.metaRow}>
            <MapPin color={theme.colors.textTertiary} size={12} strokeWidth={2} />
            <Text style={styles.meta}>{`${partner.distanceKm.toFixed(1)} ק"מ ממך`}</Text>
          </View>
          {sharedActivity && (
            <View style={styles.sharedPill}>
              <Sparkles color={theme.colors.cyan} size={12} strokeWidth={2} />
              <Text style={styles.sharedText}>גם אוהב/ת {sharedActivity}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.bio} numberOfLines={2}>
        {partner.bio}
      </Text>
      <View style={styles.actions}>
        <View style={styles.actionFlex}>
          <Button label="הזמן לאימון" variant="primary" onPress={onInvite} />
        </View>
        <View style={styles.actionFlex}>
          <Button label="לפרופיל" variant="secondary" onPress={onViewProfile} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 26,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.black,
  },
  headerText: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  name: {
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  meta: {
    fontSize: 12,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textTertiary,
  },
  sharedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  sharedText: {
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.cyan,
  },
  bio: {
    fontSize: 13,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginBottom: theme.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionFlex: {
    flex: 1,
  },
});
