// Pure on purpose (the phone's OS name is passed in), so it is unit-tested.
// What the health numbers are called on this phone, and where the member allows them. The iPhone reads Apple Health,
// an Android phone reads Health Connect (see lib/healthKit.ts and lib/healthConnect.ts).
export function healthSourceName(os: string): string {
  return os === 'android' ? 'Health Connect' : 'Apple Health';
}

// Hebrew hint shown when reading failed: where to allow FitFriend again.
export function healthPermissionHint(os: string): string {
  return os === 'android'
    ? 'אפשר לאשר את הגישה ב: הגדרות ← אפליקציות ← Health Connect ← FitFriend. בטלפון ישן ייתכן שצריך להתקין או לעדכן את Health Connect מ-Google Play.'
    : 'אפשר לאשר את הגישה ב: הגדרות ← בריאות ← גישה לנתונים ← FitFriend.';
}
