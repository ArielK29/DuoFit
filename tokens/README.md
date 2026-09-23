# DuoFit · Design Tokens

**Version:** 2.0
**Last updated:** 2026-09-22

חבילת tokens מוכנה לייצוא לכל מערכת עיצוב חיצונית — Figma, Adobe XD, Framer, Zeroheight, Supernova, וכל build system מודרני.

---

## הקבצים בתיקייה הזאת

| קובץ | פורמט | לאיזה כלי |
|------|-------|-----------|
| **`design-tokens.json`** | W3C Design Tokens Community Group | הסטנדרט האוניברסלי. כל כלי מודרני תומך. |
| **`tokens-studio.json`** | Figma Tokens Studio | Figma דרך plugin "Tokens Studio for Figma" |
| **`tokens.css`** | CSS Custom Properties | אתרי ווב (Vercel, Next.js, Vite) |
| **`tokens.ts`** | TypeScript | React Native / React web / Node |
| **`style-dictionary.config.json`** | Style Dictionary | Auto-generate מ-JSON ל-Swift/Kotlin/iOS/Android |

---

## איך לייבא לכל מערכת

### 🎨 Figma (Tokens Studio Plugin)
1. פותחים את Figma → Plugins → Tokens Studio for Figma (חינם)
2. New file → Import → JSON
3. מעלים את `tokens-studio.json`
4. הכל מופיע כ-Variables ב-Figma, וכל שינוי מסתנכרן ל-GitHub אוטומטית.

### 🎨 Figma (built-in Variables — 2024+)
1. Figma → פאנל Variables → 3 נקודות → Import from JSON
2. מעלים את `design-tokens.json`
3. Figma יזהה W3C format אוטומטית.

### 🌐 Framer / Webflow / Wordpress
- טוענים את `tokens.css` ישירות ב-`<head>` של האתר.
- כל CSS variable זמין דרך `var(--color-primary)`.

### 📱 Expo / React Native
```ts
import { colors, fonts, space, typePresets } from './tokens/tokens';

<Text style={typePresets.hero}>28</Text>
<View style={{ backgroundColor: colors.bg, padding: space[4] }} />
```

### 📱 iOS (Swift) & Android (Kotlin/XML)
```bash
npm i -D style-dictionary
npx style-dictionary build --config tokens/style-dictionary.config.json
```
- `build/ios/Tokens.swift` — class Swift מוכן ל-`import`
- `build/android/colors.xml` + `dimens.xml` — resources Android

### 📊 Zeroheight / Supernova / Specify
- כולם תומכים ב-`design-tokens.json` (W3C standard).
- מעלים את הקובץ כ-token source ומקבלים תיעוד אוטומטי + עדכונים בגית.

### ⚡ Storybook
```js
// .storybook/preview.js
import '../tokens/tokens.css';
```

---

## מבנה הטוקנים

### היררכיה
```
color/
  base/     → צבעים גולמיים (never use directly)
  brand/    → צבעי מותג (magenta, cyan)
  neutral/  → אפורים
  semantic/ → aliases לשימוש בקוד (bg, ink, primary...)

typography/   → presets מוכנים (hero, h1, body, eyebrow...)
space/        → 0-8 (4px increments)
radius/       → none, sm, md, full
motion/       → duration + easing
shadow/       → streak-glow, magenta-glow
```

### כלל זהב: תמיד מהסמנטי ולא מהבסיס
```ts
// ✅ נכון
color: colors.primary

// ❌ שגוי
color: '#FF00A8'
color: colors.brand.magenta
```
אם תרצה לשנות את ה-Primary מ-מגנטה לסגול בעתיד — שינוי אחד ב-Token מספיק.

---

## Sync ו-Version Control

הטוקנים מנוהלים כ-**Single Source of Truth** ב-Git:

1. שינוי טוקן = commit ב-`design-tokens.json`
2. Style Dictionary מריץ build אוטומטית ב-CI
3. Figma Tokens Studio מסתנכרן דרך GitHub
4. React Native pulls את `tokens.ts` המעודכן

**זרימה מומלצת:**
```
Designer (Figma) → GitHub PR → Design review → Merge → אוטומטית לכל הפלטפורמות
```

---

## איך לעדכן טוקן

### הוספת צבע חדש (דוגמה)
```jsonc
// design-tokens.json
"color": {
  "brand": {
    "magenta": { "$value": "#FF00A8", "$type": "color" },
    "cyan":    { "$value": "#00E5FF", "$type": "color" },
    "gold":    { "$value": "#FFD700", "$type": "color" }  // ← חדש
  }
}
```

לאחר הוספה:
1. עדכן גם ב-`tokens-studio.json` (עד שאוטומציה תקום)
2. הוסף ל-`tokens.ts` בקטגוריה המתאימה
3. הוסף ל-`tokens.css` כ-CSS variable
4. אם רלוונטי — הוסף ל-semantic aliases

---

## Contrast & Accessibility

כל השילובים נבדקו ל-WCAG 2.1 AA:

| רקע | טקסט | Contrast | תוצאה |
|-----|------|----------|-------|
| `#050505` (bg) | `#F5F5F5` (ink) | 18.5:1 | ✅ AAA |
| `#050505` (bg) | `#7A7A7A` (muted) | 4.8:1 | ✅ AA (large) |
| `#FF00A8` (primary) | `#050505` (dark ink) | 5.2:1 | ✅ AA |
| `#00E5FF` (accent) | `#050505` (dark ink) | 13.2:1 | ✅ AAA |
| `#FF00A8` (primary) | `#F5F5F5` (ink) | 3.5:1 | ⚠️ AA large text only |

**כלל:** על מגנטה תמיד טקסט **שחור** (`#050505`), לא לבן.

---

## Fonts

הפונטים לא נכללים בטוקנים כי הם external. יש 3 דרכים לטעון:

### Google Fonts (מומלץ ל-Web)
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap">
```

### Expo (React Native)
```bash
npx expo install @expo-google-fonts/anton @expo-google-fonts/space-grotesk @expo-google-fonts/jetbrains-mono
```

### iOS/Android native
הורדה מ-[Google Fonts](https://fonts.google.com) → הוספה ל-Assets/Fonts → רישום ב-Info.plist / fonts.xml.

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-09-22 | חבילה ראשונית מלאה. 5 פורמטים. W3C compliant. |

---

## תמיכה / שאלות

הטוקנים הם הבסיס לכל האפליקציה. אם משהו לא ברור או חסר — שנה קודם את `design-tokens.json` (הסטנדרט), ואז תסתנכרן לשאר הפורמטים.
