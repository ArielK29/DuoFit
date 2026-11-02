import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Smartphone } from 'lucide-react-native';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useWellbeingStore } from '@hooks/useWellbeingStore';
import { screenTimeChange, weekKey } from '@lib/wellbeing';
import { visualRightText } from '@lib/rtl';
import { theme } from '@styles/theme';

// Apple does not let an app read the phone's Screen Time, so the member types the weekly number from
// Settings ← Screen Time. The card shows this week and how it compares with last week.
export const ScreenTimeCard: React.FC = () => {
  const hours = useWellbeingStore((state) => state.screenTimeHours);
  const setScreenTime = useWellbeingStore((state) => state.setScreenTime);

  const now = new Date();
  const thisKey = weekKey(now);
  const lastKey = weekKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7));
  const thisWeek = hours[thisKey];
  const change = screenTimeChange(thisWeek, hours[lastKey]);

  const [editing, setEditing] = useState(thisWeek === undefined);
  const [text, setText] = useState(thisWeek === undefined ? '' : String(thisWeek));
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const value = Number(text.replace(',', '.'));
    if (!(value >= 0 && value <= 168)) {
      setError('הזן מספר שעות בשבוע, למשל 21 או 18.5');
      return;
    }
    setError(null);
    setScreenTime(thisKey, value);
    setEditing(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconTile}>
          <Smartphone color={theme.colors.cyan} size={22} strokeWidth={2} />
        </View>
        <Text style={styles.title}>זמן מסך השבוע</Text>
      </View>

      {editing ? (
        <>
          <Text style={styles.body}>פתח הגדרות ← זמן מסך, ורשום כאן כמה שעות היו לך השבוע (הממוצע היומי כפול 7).</Text>
          <Input label="שעות מסך בשבוע" value={text} onChangeText={setText} keyboardType="decimal-pad" placeholder="21" error={error ?? undefined} />
          <Button label="שמור" variant="primary" onPress={save} />
        </>
      ) : (
        <>
          <Text style={styles.value}>{`${thisWeek} שע'`}</Text>
          {change !== null && (
            <Text style={[styles.change, { color: change >= 0 ? theme.colors.cyan : theme.colors.magenta }]}>
              {change >= 0 ? `↓ ${change} שעות פחות משבוע שעבר` : `↑ ${Math.abs(change)} שעות יותר משבוע שעבר`}
            </Text>
          )}
          <Button label="עדכן" variant="secondary" onPress={() => setEditing(true)} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.xl * 1.5,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(0,229,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    ...visualRightText,
  },
  value: {
    fontSize: 40,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
  },
  change: {
    fontSize: 15,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    ...visualRightText,
  },
});
