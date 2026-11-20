import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@components/Button';
import { BackButton } from '@components/BackButton';
import { theme } from '@styles/theme';
import { visualRightText } from '@lib/rtl';
import { useAuth } from '@hooks/useAuth';
import { useSubscriptionStore } from '@hooks/useSubscriptionStore';
import { buy, loadPlans, manageSubscription, purchasesAvailable, restore, startPurchases, type PlanOption } from '@lib/purchases';
import { isPaidTier, tierFromProductId, type Tier } from '@lib/entitlements';
import { planFeatures, renewalText, tierLabel } from '@lib/subscription';

const SHOWN_TIERS: Tier[] = ['plus', 'pro'];
const POLL_TIMES = 8;
const POLL_EVERY_MS = 2500;

function periodText(plan: PlanOption): string {
  return plan.period === 'yearly' ? 'לשנה' : plan.period === 'monthly' ? 'לחודש' : '';
}

function planLabel(plan: PlanOption): string {
  const trial = plan.trialDays ? ` · ${plan.trialDays} ימי ניסיון חינם` : '';
  return `${plan.priceString} ${periodText(plan)}${trial}`.trim();
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// The plans screen. Prices and trial lengths come from the store (never typed here); the plan itself is recorded by the server
// when Apple confirms the purchase, so after buying we ask the server a few times until it shows up.
export const PaywallScreen: React.FC = () => {
  const router = useRouter();
  const userId = useAuth((state) => state.user?.id ?? null);
  const subscription = useSubscriptionStore((state) => state.subscription);
  const [plans, setPlans] = useState<PlanOption[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (userId) await startPurchases(userId);
      const loaded = await loadPlans();
      if (alive) {
        setPlans(loaded);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const waitForPlan = useCallback(async () => {
    if (!userId) return;
    for (let i = 0; i < POLL_TIMES; i += 1) {
      await useSubscriptionStore.getState().refresh(userId);
      if (isPaidTier(useSubscriptionStore.getState().subscription.tier)) {
        setMessage('החבילה פעילה. תודה!');
        return;
      }
      await sleep(POLL_EVERY_MS);
    }
    setMessage('התשלום התקבל. החבילה תופיע כאן בעוד רגע, אפשר לחזור למסך הזה בהמשך.');
  }, [userId]);

  const onBuy = async (plan: PlanOption) => {
    setBusy(plan.productId);
    setMessage(null);
    const result = await buy(plan.pkg);
    if (result === 'purchased') {
      setMessage('מעדכנים את החבילה...');
      await waitForPlan();
    } else if (result === 'failed') {
      setMessage('הרכישה לא הושלמה ולא חויבת. אפשר לנסות שוב.');
    }
    setBusy(null);
  };

  const onRestore = async () => {
    setBusy('restore');
    setMessage(null);
    const ok = await restore();
    if (ok) {
      setMessage('בודקים אם יש רכישה קודמת...');
      await waitForPlan();
    } else {
      setMessage('לא הצלחנו לשחזר רכישות. בדוק את החיבור ונסה שוב.');
    }
    setBusy(null);
  };

  const current = renewalText(subscription);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BackButton />
      <Text style={styles.title}>FitFriend Plus ו-Pro</Text>
      <Text style={styles.subtitle}>
        כל הבטיחות באפליקציה חינם, תמיד: דיווח, חסימה ובדיקת גיל. החבילות נותנות עוד הזמנות לאימונים.
      </Text>

      {isPaidTier(subscription.tier) ? (
        <View style={styles.currentCard}>
          <Text style={styles.currentTitle}>{`החבילה שלך: ${tierLabel(subscription.tier)}`}</Text>
          {current ? <Text style={styles.currentText}>{current}</Text> : null}
          <Button label="ניהול או ביטול המנוי" variant="secondary" size="lg" onPress={manageSubscription} />
        </View>
      ) : null}

      {loading ? (
        <Text style={styles.note}>טוענים את החבילות...</Text>
      ) : !plans ? (
        <View style={styles.card}>
          <Text style={styles.note}>
            {purchasesAvailable()
              ? 'החבילות לא נטענו כרגע. בדוק את החיבור ונסה שוב בעוד רגע.'
              : 'רכישת חבילות עדיין לא זמינה בגרסה הזו של האפליקציה.'}
          </Text>
        </View>
      ) : (
        SHOWN_TIERS.map((tier) => {
          const options = plans.filter((plan) => tierFromProductId(plan.productId) === tier);
          if (options.length === 0) return null;
          const isCurrent = subscription.tier === tier;
          return (
            <View key={tier} style={[styles.card, isCurrent && styles.cardCurrent]}>
              <Text style={styles.cardTitle}>{`FitFriend ${tierLabel(tier)}`}</Text>
              {planFeatures(tier).map((line) => (
                <Text key={line} style={styles.feature}>{`• ${line}`}</Text>
              ))}
              {options.map((plan) => (
                <Button
                  key={plan.productId}
                  label={planLabel(plan)}
                  size="lg"
                  variant={plan.period === 'yearly' ? 'primary' : 'secondary'}
                  onPress={() => onBuy(plan)}
                  loading={busy === plan.productId}
                  disabled={busy !== null || isCurrent}
                />
              ))}
            </View>
          );
        })
      )}

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Button label="שחזור רכישות" variant="secondary" size="lg" onPress={onRestore} loading={busy === 'restore'} disabled={busy !== null || !purchasesAvailable()} />

      <Text style={styles.legal}>
        המנוי מתחדש אוטומטית בסוף כל תקופה (חודש או שנה, לפי מה שבחרת) באותו מחיר, ומחויב בחשבון ה-Apple שלך. אפשר לבטל בכל זמן, לפחות 24 שעות לפני סוף התקופה, ב: הגדרות ← שמך ← מנויים. ביטול מפסיק את החידוש, והחבילה נשארת עד סוף התקופה ששולמה. תקופת ניסיון חינם, אם יש, מסתיימת בחיוב אוטומטי אלא אם בוטלה לפחות 24 שעות לפני סופה.
      </Text>
      <Button label="תנאי שימוש ומדיניות פרטיות" variant="secondary" size="lg" onPress={() => router.push('/terms')} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.xl, gap: theme.spacing.md },
  title: { width: '100%', fontSize: 26, lineHeight: 36, fontWeight: 'normal', fontFamily: theme.typography.h2.fontFamily, color: theme.colors.text, ...visualRightText },
  subtitle: { width: '100%', fontSize: 14, lineHeight: 21, fontFamily: theme.typography.body.fontFamily, color: theme.colors.textSecondary, ...visualRightText },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, gap: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.surfaceHover },
  cardCurrent: { borderColor: theme.colors.cyan },
  cardTitle: { width: '100%', fontSize: 20, lineHeight: 28, fontFamily: theme.typography.h3.fontFamily, color: theme.colors.text, ...visualRightText },
  feature: { width: '100%', fontSize: 14, lineHeight: 21, fontFamily: theme.typography.body.fontFamily, color: theme.colors.text, ...visualRightText },
  currentCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, gap: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.cyan },
  currentTitle: { width: '100%', fontSize: 18, lineHeight: 26, fontFamily: theme.typography.h3.fontFamily, color: theme.colors.text, ...visualRightText },
  currentText: { width: '100%', fontSize: 14, lineHeight: 21, fontFamily: theme.typography.body.fontFamily, color: theme.colors.textSecondary, ...visualRightText },
  note: { width: '100%', fontSize: 14, lineHeight: 21, fontFamily: theme.typography.body.fontFamily, color: theme.colors.textSecondary, ...visualRightText },
  message: { width: '100%', fontSize: 14, lineHeight: 21, fontFamily: theme.typography.labelBold.fontFamily, color: theme.colors.cyan, ...visualRightText },
  legal: { width: '100%', fontSize: 12, lineHeight: 18, fontFamily: theme.typography.bodySmall.fontFamily, color: theme.colors.textTertiary, ...visualRightText },
});
