# DuoFit — Design System (Production)

**Version:** 3.0
**Date:** 2026-09-22
**Direction:** Underground · Pure Type · Mobile-First
**Platform:** iOS + Android (Expo / React Native)
**Status:** Production-Ready · Design-System-Export-Ready

---

## Table of Contents

1. [עקרונות מרכזיים](#0-עקרונות-מרכזיים)
2. [Brand Identity](#1-brand-identity--הלוגו-הרשמי)
3. [Design Tokens](#2-design-tokens)
4. [Typography](#3-טיפוגרפיה)
5. [Layout & Spacing](#4-layout--spacing)
6. [Components (14)](#5-קומפוננטות-14)
7. [Component States](#6-component-states)
8. [Icon Library](#7-icon-library)
9. [Screen Inventory (14)](#8-screen-inventory--כל-המסכים)
10. [Motion Library](#9-motion-library)
11. [Accessibility](#10-accessibility)
12. [Content / Copy Library](#11-content--copy-library)
13. [Modals, Sheets, Toasts](#12-modals-sheets-toasts)
14. [Push Notifications](#13-push-notifications)
15. [Error / Empty / Loading States](#14-error--empty--loading-states)
16. [RTL Rules](#15-rtl-rules)
17. [QA Checklist](#16-qa-checklist)
18. [Change Log](#17-change-log)

---

## 0. עקרונות מרכזיים

1. **מובייל בלבד** — לא בונים ווב במקביל. כל החלטה מקבלה עם מסך של 375×812.
2. **שחור מוחלט** — הרקע הראשי הוא `#050505` (מונע burn-in ב-OLED).
3. **שני צבעים חדים** — מגנטה + ציאן. אף צבע נוסף.
4. **טיפוגרפיה היא הזהות** — אין אייקון-לוגו. השם `DUOFIT` בפונט Anton עם O מפוצל הוא כל הזהות.
5. **RTL first** — logical properties בכל מקום.
6. **פחות עדיף מיותר** — פחות אפקטים, פחות שכבות, פחות רעש.

---

## 1. Brand Identity — הלוגו הרשמי

### 1.1 Wordmark ראשי

מילה אחת: `DUOFIT`. האות **O האמצעית מפוצלת** — חצי שמאלי מגנטה `#FF00A8`, חצי ימני ציאן `#00E5FF`, פיצול חד ואנכי במרכז.

**מיקום קבצים:**
- `/logo/duofit-wordmark.svg` — הלוגו המלא
- `/logo/duofit-icon.svg` — App Icon (מונוגרם DF + גרדיאנט)
- `/logo/duofit-favicon.svg` — Favicon 32×32

### 1.2 SVG טכני — הרנדור הנכון

```html
<svg viewBox="0 0 400 110" direction="ltr">
  <defs>
    <linearGradient id="splitO" x1="0" y1="0" x2="1" y2="0"
                    gradientUnits="objectBoundingBox">
      <stop offset="50%" stop-color="#FF00A8"/>
      <stop offset="50%" stop-color="#00E5FF"/>
    </linearGradient>
  </defs>
  <text x="200" y="88" text-anchor="middle"
        font-family="Anton, Impact, sans-serif"
        font-size="96" fill="currentColor" letter-spacing="0.5">
    <tspan>DU</tspan>
    <tspan fill="url(#splitO)">O</tspan>
    <tspan>FIT</tspan>
  </text>
</svg>
```

**חוקים קריטיים:**
- ✅ `<tspan>` בתוך `<text>` יחיד (לא 6 טקסטים)
- ✅ `text-anchor="middle"` + `direction="ltr"`
- ❌ אין להשתמש בקואורדינטות ידניות לכל אות

### 1.3 גדלים מינימליים

| שימוש | גודל | הערה |
|-------|------|------|
| Splash / Marketing | 200-400px | DUOFIT מלא |
| Header באפליקציה | 100-140px | DUOFIT מלא |
| App Icon | 60-1024px | DF + גרדיאנט |
| Favicon / Notification | 16-32px | D בלבד |

### 1.4 App Icon Specifications

- **גודל אבסולוטי:** 1024×1024 (Master), נגזר ל-180/167/152/120/87/80/76/60/40/29/20
- **רדיוס:** 22% מהגובה (Apple standard = 225.28px ב-1024)
- **רקע:** `linear-gradient(135deg, #FF00A8 0%, #050505 55%, #00E5FF 100%)`
- **טקסט:** DF, Anton, font-size ≈ 60% מגובה הריבוע, מרכוז אופטי
- **בפיקסל 16:** רק האות D (לא DF)

---

## 2. Design Tokens

**מקור אמת:** `/tokens/design-tokens.json` (W3C format).
**קבצי ייצוא:** ראה `/tokens/README.md` — CSS, TS, Figma, Style Dictionary.

**רק 5 צבעים סמנטיים.**

| Token | Hex | תפקיד |
|-------|-----|-------|
| `--color-bg` | `#050505` | רקע ראשי |
| `--color-surface` | `#0D0D0D` | כרטיסים |
| `--color-border` | `#1A1A1A` | Hairlines |
| `--color-ink` | `#F5F5F5` | טקסט ראשי |
| `--color-muted` | `#7A7A7A` | טקסט משני |
| `--color-primary` | `#FF00A8` | כל פעולה |
| `--color-accent` | `#00E5FF` | רק Streak & Success |

**כללי שימוש:**
- ✅ מגנטה = פעולות/CTAs/בחירות
- ✅ ציאן = שמור בקדושה ל-Streak, Check-in success
- ❌ אין ירוק/אדום/צהוב סמנטי. הצלחה = ציאן, שגיאה = מגנטה.

---

## 3. טיפוגרפיה

**4 פונטים מ-Google Fonts.**

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Heebo:wght@400;500;700;800;900&family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap">
```

| Role | Font | Fallback | שימוש |
|------|------|----------|-------|
| Display (Latin) | **Anton** | `Impact, 'Arial Narrow', sans-serif` | לוגו, מספרים (Streak/stats), כותרות/מיקרו-קופי באנגלית בלבד |
| Display (Hebrew) | **Heebo** (weight 800-900) | `'Arial Hebrew', sans-serif` | H1-H2 בעברית, כל כותרת שמכילה טקסט עברי |
| Body | **Space Grotesk** | `system-ui, -apple-system, sans-serif` | טקסט גוף, UI |
| Mono | **JetBrains Mono** | `'Courier New', monospace` | Metadata, eyebrows |

### 3.1 החלטה: Anton אין לו גליפים בעברית — Heebo הוא הפתרון

**הבעיה:** Anton (הפונט של הלוגו והכותרות) הוא פונט לטיני בלבד. אין לו אף תו עברי. כל כותרת עברית שתנסה להציג ב-Anton תיפול אוטומטית ל-fallback (בד"כ פונט המערכת), מה שישבור את העקביות החזותית.

**הפתרון: Heebo, משקל 800-900 (ExtraBold/Black).**

למה Heebo ולא משהו אחר:
- כיסוי עברי מלא, כולל ניקוד אם יידרש בעתיד
- במשקל 900 יש לו אופי דומה ל-Anton: קונדנסד יחסית, פינות חדות, "תעשייתי" — לא עגול וחמוד כמו Rubik או Assistant
- בשימוש נרחב באפליקציות טכנולוגיה ישראליות (מוכר ומהיר לטעינה)
- Google Fonts, אותה שרשרת טעינה כמו שאר הפונטים

**כלל שימוש בקוד:**
```css
/* כותרת שיכולה להכיל גם עברית וגם אנגלית */
.heading {
  font-family: 'Heebo', 'Anton', sans-serif;
  font-weight: 900;
}

/* לוגו / מספרים / טקסט אנגלי בלבד — Anton נשאר */
.logo, .streak-number {
  font-family: 'Anton', sans-serif;
}
```

**מה נשאר ב-Anton:** הלוגו (DUOFIT — אנגלית בלבד), מספר ה-Streak (ספרות הן universal, Anton עובד מצוין), טקסטים טכניים קצרים באנגלית (`// LOADING...`).

**מה עובר ל-Heebo:** כל כותרת H1/H2 שמכילה עברית — כלומר כמעט כל כותרת מסך באפליקציה (עברית היא שפת ה-UI הראשית).

### Type Scale

| Token | Size | Line-height | שימוש |
|-------|------|-------------|-------|
| `text-xs` | 10 | 1.4 | Eyebrows |
| `text-sm` | 12 | 1.5 | Metadata |
| `text-base` | 14 | 1.6 | Body |
| `text-lg` | 16 | 1.5 | Emphasis body |
| `text-xl` | 20 | 1.2 | Section headers |
| `text-2xl` | 28 | 1.1 | H2 |
| `text-3xl` | 44 | 1.0 | H1 |
| `text-hero` | 108 | 0.85 | **Streak number** |

---

## 4. Layout & Spacing

### Grid
- Mobile viewport: **375×812** (baseline iPhone 13/14)
- Safe area top: 44px · Safe area bottom: 34px
- Content padding: **18px** לצדדים
- Tab bar height: 54px

### Spacing Scale (4px increments)
`0, 4, 8, 12, 16, 24, 32, 48, 64` → `space-0` ... `space-8`

### Radii
- **`radius-none: 0`** — ברירת מחדל לכל הקומפוננטות
- `radius-sm: 4` — Status pills
- `radius-md: 8` — App icons קטנים
- `radius-full: 9999` — **avatars בלבד**

---

## 5. קומפוננטות (14)

### 5.1 Button

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| `primary` | `#FF00A8` | `#050505` | none |
| `accent` | `#00E5FF` | `#050505` | none |
| `ghost` | transparent | `#F5F5F5` | 1px `#1A1A1A` |

**מיוחד:** Clip-path corner-cut
```css
clip-path: polygon(0 0, 100% 0, 100% 82%, 92% 100%, 0 100%);
```

**Font:** Anton 16px UPPERCASE, letter-spacing 0.03em
**Height:** 48px (touch target ≥44px)
**Padding:** 14px vertical, 20px horizontal

### 5.2 Input
- רקע: `#0D0D0D`
- Border: אין default; 1px hairline `#1A1A1A` bottom
- Placeholder: `#7A7A7A`
- Text: `#F5F5F5`, Space Grotesk 14px
- Padding: 12px 14px

### 5.3 Avatar
- גדלים: 32, 40, 48, 60, 96px
- צורה: **ריבוע חד** (לא עיגול)
- Fallback: מגנטה או ציאן + אות ראשונה ב-Anton
- Border: אין default; 2px ציאן כשמסמל "online"

### 5.4 Card
- רקע: `#0D0D0D`
- Border: 1px `#1A1A1A`
- Padding: 20px · Radius: 0

### 5.5 Chat Bubble
- User (שמאל): `#101010`, טקסט `#F5F5F5`
- אני (ימין): מגנטה, טקסט `#050505`
- Max width: 75% · Radius: 0
- Timestamp: JetBrains Mono 9px muted מתחת לבועה

### 5.6 Streak Badge
- מספר: Anton, ציאן, 64-108px
- Label מעל: `// STREAK` — Mono 9px ציאן
- Sub מתחת: `WEEKS · NO GAPS` — Mono 9px muted
- Border: 1px ציאן · רקע: `linear-gradient(180deg, rgba(0,229,255,0.08), transparent)`

### 5.7 Workout Invite Card
- רקע: `#0D0D0D` + border 1px ציאן
- Header: `// הזמנה לאימון` — Mono ציאן
- תאריך: Anton 14px לבן
- מיקום + סגנון: 10px muted
- 2 כפתורים: **אישור** (ציאן), **דחייה** (ghost)

### 5.8 Check-in Button
- **מופיע רק בחלון ±30 דקות** מזמן האימון
- טקסט: "סיימנו אימון יחד! ✓"
- Full-width, מגנטה, Anton 18px, corner-cut
- Disabled state: `#1A1A1A` bg, `#7A7A7A` text

### 5.9 Tab Bar
- 3 טאבים: גילוי · צ'אט · אני
- Active: מגנטה, שאר: `#7A7A7A`
- Height: 54px + safe-area bottom
- Border top: 1px `#1A1A1A`

### 5.10 Filter Pill
- Selected: מגנטה bg, `#050505` text
- Unselected: border `#1A1A1A`, muted text
- JetBrains Mono 9px UPPERCASE

### 5.11 Map Pin
- ריבוע 24×24 (לא עיגול)
- Border: 2px `#050505`
- רקע: מגנטה/ציאן לפי סוג האימון
- Letter: אות ראשונה, Anton 12px

**הבסיס מתחת לפינים — החלטה:**

| הקשר | מה מוצג | למה |
|------|---------|-----|
| **אפליקציית פרודקשן** | Google Maps אמיתי (`react-native-maps`), בסגנון כהה מותאם | המשתמש צריך למקם את עצמו אמיתית ביחס לפארק/רחוב |
| **Design System / mockups סטטיים** | גריד מופשט (כמו שנוצר ע"י Claude Design) | לא ניתן להטמיע Google Maps חי בדף HTML סטטי בלי API key חשוף; הגריד הוא placeholder מכוון, לא פער |

**Style JSON למפה הכהה (ל-`react-native-maps` / Google Maps Platform):**
מיקום: `/assets/map-style-dark.json` — מכהה את כל שכבות ה-POI/כבישים/מים כך שהמפה תשתלב עם `#050505` הרקע של האפליקציה, ומשאירה רק את הפינים שלנו (מגנטה/ציאן) כאלמנט הצבעוני היחיד על גבי המפה.

### 5.12 Status Pill
- `// ONLINE` — Mono ציאן 9px
- `// OFFLINE` — Mono muted 9px
- ללא רקע

### 5.13 Section Header
- Eyebrow: `// SECTION_NAME` — Mono 10-11px ציאן
- Title: Anton 18-22px UPPERCASE
- Divider: 1px `#1A1A1A` למטה

### 5.14 Toast
- רקע: `#101010` + border 1px מגנטה/ציאן
- Space Grotesk 12px
- מיקום: Top, מתחת ל-status bar

---

## 6. Component States

**לכל קומפוננטה — 6 מצבים חובה.**

### Button States

| State | Background | Text | Border | Opacity |
|-------|-----------|------|--------|---------|
| **default** | primary color | dark ink | — | 1.0 |
| **pressed** | primary + darken 15% | dark ink | — | 1.0 |
| **hover** (web only) | primary + lighten 5% | dark ink | — | 1.0 |
| **focus** | primary | dark ink | 2px cyan outline offset 2px | 1.0 |
| **disabled** | `#1A1A1A` | `#7A7A7A` | — | 1.0 |
| **loading** | primary | ghost | — | 1.0 (spinner `//...` mono) |

### Input States

| State | Background | Border Bottom | Placeholder | Text |
|-------|-----------|---------------|-------------|------|
| default | `#0D0D0D` | 1px `#1A1A1A` | `#7A7A7A` | `#F5F5F5` |
| focus | `#0D0D0D` | 2px ציאן | `#7A7A7A` | `#F5F5F5` |
| filled | `#0D0D0D` | 1px `#3A3A3A` | — | `#F5F5F5` |
| error | `#0D0D0D` | 2px מגנטה | `#7A7A7A` | `#F5F5F5` |
| disabled | `#0A0A0A` | 1px `#1A1A1A` | `#3A3A3A` | `#3A3A3A` |

### Chat Bubble States

| State | Style |
|-------|-------|
| sending | opacity 0.6 + `// SENDING` mono badge |
| sent | default |
| delivered | ✓ ציאן 10px right |
| read | ✓✓ ציאן 10px right |
| failed | border 1px מגנטה + `// TAP TO RETRY` |

### Streak Badge States

| State | Style |
|-------|-------|
| active | ציאן, pulse animation 3s infinite |
| warning (יום לפני איפוס) | ציאן → מגנטה fade + `// EXPIRES IN 1 DAY` |
| broken (איפוס) | muted גראפי + `// STREAK ENDED` |
| celebrating (התעדכן) | pulse + shadow-streak-glow 1200ms |

### Check-in Button States

| State | Style | מתי |
|-------|-------|-----|
| upcoming | disabled, muted, `// AVAILABLE IN 2H` | לפני חלון |
| available | מגנטה full CTA | ±30 דק' מהזמן |
| pressed-waiting | ציאן opacity 0.6 + `// WAITING FOR PARTNER` | הצד שלך אישר |
| both-confirmed | ציאן animated pulse | שני הצדדים אישרו |
| expired | disabled + `// WINDOW CLOSED` | 24h עברו |

---

## 7. Icon Library

**Library:** [Lucide Icons](https://lucide.dev) (React Native: `lucide-react-native`)

**סיבה:** Lucide הוא stroke-based, קונסיסטנטי, מודרני, ומתאים לכיוון Underground. חלופה: Feather (מקור של Lucide).

### התקנה
```bash
npx expo install lucide-react-native react-native-svg
```

### שימוש
```tsx
import { Search, MessageSquare, User } from 'lucide-react-native';

<Search size={20} color="#FF00A8" strokeWidth={2} />
```

### Icon Set ל-MVP (רק אלה שנחוצים)

| Screen | Icons |
|--------|-------|
| Tab Bar | `MapPin` (גילוי), `MessageSquare` (צ'אט), `User` (אני) |
| Discover | `Search`, `SlidersHorizontal` (filter), `X` (close) |
| Chat | `Send`, `Paperclip`, `Calendar` (invite), `ChevronRight` |
| Profile | `Settings`, `Edit3`, `LogOut`, `Award` (streak) |
| Onboarding | `ChevronLeft`, `ChevronRight`, `Check`, `Camera` |
| Modals | `X` (close), `AlertTriangle` (warning), `Info` |

**Stroke width:** 2px (default) · **Sizes:** 16, 20, 24, 32

### Custom Icons (SVG בפרויקט) — ✅ נוצרו

מיקום: `/assets/icons/`

- **`check-in.svg`** — שני ריבועי-אווטאר חופפים (עקבי לחלוטין עם avatar squares §5.3) + סימן וי במרובע הקדמי. Stroke-based 24×24, 2px stroke, סגנון Lucide. לא reused מ-Lucide כי אין שם אייקון שמייצג "שני משתמשים אישרו יחד".
- **`duo-logo-mark.svg`** — האות "D" על גרדיאנט מגנטה→שחור→ציאן, 32×32. זהה במהות ל-`/logo/duofit-favicon.svg`; שני הקבצים קיימים כי ה-favicon משרת את הדפדפן/PWA וה-icon הזה משרת שימוש בתוך רכיבי ה-UI (למשל placeholder כשאין תמונת פרופיל).

---

## 8. Screen Inventory — כל המסכים

### 8.1 Onboarding Flow (5 מסכים)

| # | Screen ID | תוכן | Route |
|---|-----------|------|-------|
| 01 | `SPLASH` | לוגו + `// LOADING...` | `/` |
| 02 | `SIGN_UP` | Google / Email + סיסמה | `/auth/signup` |
| 03 | `ONBOARDING_PROFILE` | שם, גיל, תמונה | `/onboarding/1` |
| 04 | `ONBOARDING_STYLE` | סגנון אימון + רמה | `/onboarding/2` |
| 05 | `ONBOARDING_LOCATION` | מיקום + ימים/שעות | `/onboarding/3` |

### 8.2 Main App (9 מסכים)

| # | Screen ID | תוכן | Route |
|---|-----------|------|-------|
| 06 | `DISCOVER` | מפה + List | `/tabs/discover` |
| 07 | `PARTNER_PROFILE` | פרופיל של אחר | `/user/:id` |
| 08 | `CHAT_LIST` | שיחות | `/tabs/chat` |
| 09 | `CHAT_THREAD` | שיחה 1-על-1 | `/chat/:id` |
| 10 | `WORKOUT_INVITE_SEND` | מודל תיאום | `/modal/invite` |
| 11 | `CHECK_IN` | הפעולה עצמה | `/modal/checkin/:sessionId` |
| 12 | `CHECK_IN_SUCCESS` | Streak update | `/modal/checkin/success` |
| 13 | `MY_PROFILE` | הפרופיל שלי | `/tabs/me` |
| 14 | `SETTINGS` | הגדרות | `/settings` |

**סה"כ: 14 מסכים ב-MVP.** כל שם ב-`SCREAMING_SNAKE_CASE` — משמש בקוד, ב-analytics, ובדיבור בין הצוות.

---

## 9. Motion Library

**Library מומלצת:** `react-native-reanimated` v3 + `moti` (wrapper של Reanimated).

```bash
npx expo install react-native-reanimated moti
```

### Duration Scale (מהטוקנים)

| Token | Value | שימוש |
|-------|-------|-------|
| `fast` | 150ms | Micro-interactions (press feedback) |
| `base` | 300ms | Standard transitions |
| `slow` | 500ms | Emphasized (bottom sheet) |
| `splash` | 800ms | Splash → Home |
| `celebrate` | 1200ms | Check-in success, Streak update |

### Easing

| Token | Curve | שימוש |
|-------|-------|-------|
| `standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default |
| `decelerate` | `cubic-bezier(0, 0, 0, 1)` | Enter animations |
| `accelerate` | `cubic-bezier(0.3, 0, 1, 1)` | Exit animations |
| `sharp` | `cubic-bezier(0.4, 0, 0.6, 1)` | Attention-grabbing (Streak celebrate) |

### The 3 Signature Animations

**1. Splash → Home**
```tsx
<MotiView
  from={{ opacity: 1, scale: 1 }}
  animate={{ opacity: 0, scale: 0.8 }}
  transition={{ type: 'timing', duration: 800, easing: Easing.bezier(0.2, 0, 0, 1) }}
/>
```

**2. Check-in Success — Streak Counter**
```tsx
<MotiText
  from={{ scale: 1, opacity: 0.6 }}
  animate={{ scale: [1, 1.15, 1], opacity: 1 }}
  transition={{ type: 'timing', duration: 1200, easing: Easing.bezier(0.4, 0, 0.6, 1) }}
>28</MotiText>
```
+ Glow: `shadow-streak-glow` fades in 400ms → out 800ms

**3. Workout Invite → Enter**
```tsx
<MotiView
  from={{ translateY: 100, opacity: 0 }}
  animate={{ translateY: 0, opacity: 1 }}
  transition={{ type: 'spring', damping: 15, stiffness: 200 }}
/>
```

### Motion אסור

- ❌ Loading spinners עגולים גנריים → השתמש ב-`// LOADING...` טקסטואלי
- ❌ Parallax scrolling
- ❌ Confetti / stickers
- ❌ Screen transitions (fade/slide) → ניווט מיידי
- ❌ Hover effects (mobile only)

### Reduced Motion Support

**חובה:** בדוק את `AccessibilityInfo.isReduceMotionEnabled()` והחלף את כל האנימציות ל-`duration: 0` — הטוקנים כבר מוגדרים לזה ב-`tokens.css`.

---

## 10. Accessibility

### 10.1 Contrast (WCAG 2.1 AA)

| רקע | טקסט | Ratio | תוצאה |
|-----|------|-------|-------|
| `#050505` bg | `#F5F5F5` ink | **18.5:1** | ✅ AAA |
| `#050505` bg | `#7A7A7A` muted | **4.8:1** | ✅ AA large text |
| `#FF00A8` primary | `#050505` dark ink | **5.2:1** | ✅ AA |
| `#00E5FF` accent | `#050505` dark ink | **13.2:1** | ✅ AAA |
| `#FF00A8` primary | `#F5F5F5` ink | **3.5:1** | ⚠️ AA large only |

**כלל:** על מגנטה תמיד טקסט **שחור**, לא לבן.

### 10.2 Touch Targets

- **מינימום:** 44×44 pt (Apple HIG) / 48dp (Material)
- כפתורים קטנים ויזואלית — hitSlop של 8px לכל הכיוונים
- מרווח מינימלי בין targets: 8px

### 10.3 Screen Reader (VoiceOver / TalkBack)

**חובה בכל component אינטראקטיבי:**

```tsx
<Pressable
  accessibilityRole="button"
  accessibilityLabel="שלח הזמנה לאימון"
  accessibilityHint="פותח מודל לבחירת תאריך ושעה"
  accessibilityState={{ disabled: false }}
>
```

**Streak-specific:**
```tsx
<View accessibilityRole="text" accessibilityLabel="Streak של 28 שבועות רצופים">
  <Text>28</Text>
</View>
```

### 10.4 Font Scaling

- תמיכה מלאה ב-Dynamic Type (iOS) / Font Scaling (Android)
- כל Text component: `allowFontScaling={true}` (default)
- Layout חייב להישבר יפה עד 200% scale
- Streak number: `maxFontSizeMultiplier={1.4}` (מונע דחיפת layout)

### 10.5 Focus Management

- כפתורים ראשיים: focus trap במודלים
- Escape/Back key סוגר modal
- Tab order הגיוני (RTL: מימין לשמאל, ולמעלה למטה)

---

## 11. Content / Copy Library

**עברית סופית לכל המסכים.** אין `[Lorem Ipsum]`.

### 11.1 Onboarding Copy

**SPLASH:** `// LOADING...`

**SIGN_UP:**
- Title: "הצטרפו ל-DUOFIT"
- Subtitle: "מצאו פרטנר לאימון באזור שלכם"
- Google button: "המשך עם Google"
- Email button: "המשך עם אימייל"
- Legal: "בהמשך אתם מסכימים ל[תנאי השימוש] ו[מדיניות הפרטיות]"

**ONBOARDING_PROFILE:**
- Title: "בואו נכיר"
- Fields: "שם מלא", "גיל", "העלה תמונה"
- Photo helper: "תמונה אמיתית עוזרת לקבל יותר תגובות"
- Age validator: "צריך להיות בן 16+"

**ONBOARDING_STYLE:**
- Title: "איזה סגנון אימון שלך?"
- Helper: "אפשר לבחור יותר מאחד"
- Options: קליסטניקס · משקולות · ריצה · HIIT · יוגה · הליכה
- Level title: "רמה"
- Levels: מתחיל · בינוני · מתקדם

**ONBOARDING_LOCATION:**
- Title: "איפה אתם מתאמנים?"
- Field label: "מכון כושר או פארק"
- Placeholder: "חפשו לפי שם או כתובת"
- Days label: "ימים מועדפים"
- Times: "בוקר" (6:00-11:00) · "צהריים" (11:00-16:00) · "ערב" (16:00-22:00)

### 11.2 Discover Screen

- Header: "גילוי"
- Meta: `// {N} PARTNERS · {D}KM`
- Empty state: "עדיין אין פרטנרים ברדיוס. שתפו את DuoFit עם חברים!"
- Empty CTA: "שתף עם חבר"
- Filter reset: "אפס סינון"

### 11.3 Chat Screen

- Chat list header: "שיחות"
- Empty state: "אין שיחות עדיין. גשו ל'גילוי' כדי למצוא פרטנר."
- Message placeholder: "הקלד הודעה..."
- Invite card header: `// הזמנה לאימון`
- Invite actions: "אישור" · "דחייה"
- Invite response confirmed: "אישרת. נתראה בפארק!"
- Report: "דווח על משתמש"
- Block: "חסום משתמש"

### 11.4 Check-in Flow

- Available: "סיימנו אימון יחד!"
- Waiting: `// WAITING FOR {name}`
- Success title: `// CHECK-IN CONFIRMED ✓`
- Success message: "כל הכבוד! אתה ו{name} סיימתם עוד אימון יחד."
- Streak label: "שבועות רצופים"
- CTA: "חזרה לגילוי"
- Expired: `// WINDOW CLOSED — נסו שוב בפעם הבאה`

### 11.5 Profile

- Streak label: `// STREAK`
- Streak subtitle: "WEEKS · NO GAPS"
- Stats: "החודש" · "פרטנרים" · "סה\"כ"
- Squad log header: `// SQUAD_LOG`
- No streak state: "עוד לא התאמנת עם פרטנר. הזמנה ראשונה = Streak של 1!"
- Edit button: "עדכן פרופיל"

### 11.6 Errors

**Network:**
- Title: "אין חיבור"
- Body: "נסו לוודא שיש לכם אינטרנט ואז לרענן."
- CTA: "נסה שוב"

**Location denied:**
- Title: "צריך את המיקום"
- Body: "בלי מיקום, לא נוכל למצוא פרטנרים באזור שלך."
- CTA: "פתח הגדרות"

**Camera denied:**
- Title: "צריך הרשאת מצלמה"
- Body: "לתמונת פרופיל, צריך גישה למצלמה או לגלריה."
- CTA: "פתח הגדרות"

**Generic error:**
- Title: "משהו השתבש"
- Body: "נסו לרענן. אם זה חוזר — כתבו לנו."
- CTA: "רענן"

### 11.7 Notifications (In-app)

- הזמנה חדשה: "{name} מזמין/ה אותך להתאמן"
- אישור הזמנה: "{name} אישר/ה את ההזמנה שלך"
- Check-in reminder: "עוד 30 דקות לאימון עם {name}"
- Streak warning: "עוד יומיים ו-Streak שלך של {N} נגמר!"

---

## 12. Modals, Sheets, Toasts

### 12.1 Bottom Sheet (ברירת מחדל למודלים במובייל)

**Library:** `@gorhom/bottom-sheet` v4

**Specs:**
- Snap points: 25%, 50%, 90% (לפי תוכן)
- Handle: 32×4 bar, `#3A3A3A`, radius 2px, מרווח 12px למעלה
- Background: `#0D0D0D`
- Backdrop: `rgba(0,0,0,0.7)`, tap-to-close
- Corner radius: 16px top only (top-left + top-right)
- Enter: `slow` (500ms) `decelerate`
- Exit: `base` (300ms) `accelerate`

### 12.2 Full-Screen Modal

- Background: `#050505`
- Header: 56px height, close X שמאלי, title מרכזי (Anton 18px)
- Enter: `slide from bottom` 400ms
- Exit: `slide to bottom` 300ms

### 12.3 Toast

**Library:** `react-native-toast-message` או custom

**Specs:**
- Position: Top, 16px מתחת ל-safe-area-top
- Width: `100% - 32px` padding
- Background: `#101010`
- Border-left (RTL: right): 4px מגנטה (error) / ציאן (success)
- Height: auto, min 56px
- Padding: 14px 16px
- Font: Space Grotesk 12px `#F5F5F5`
- Duration: 3s (success), 5s (error), infinite עד dismiss (critical)
- Enter: `slide from top` 300ms `decelerate`
- Exit: `slide to top` 200ms `accelerate`

### 12.4 Alert Dialog (Confirmation)

**Use only for destructive actions** (delete account, block user).

- Background: `#0D0D0D`
- Backdrop: `rgba(0,0,0,0.85)`
- Width: `320px` centered
- Title: Anton 18px
- Body: Space Grotesk 14px `#F5F5F5`
- Actions row: `Cancel` (ghost) · `Confirm` (מגנטה if destructive)

---

## 13. Push Notifications

**Library:** `expo-notifications`

### 13.1 Notification Types

| Type | Title | Body | Sound | Priority |
|------|-------|------|-------|----------|
| **invite_received** | "{name} מזמין/ה אותך להתאמן" | "לחץ לצפייה בפרטים" | default | high |
| **invite_accepted** | "מאושר! אימון עם {name}" | "{date} · {location}" | default | high |
| **checkin_reminder** | "עוד 30 דקות לאימון" | "עם {name} ב{location}" | default | high |
| **checkin_needed** | "סיים Check-in" | "לחץ לאישור שאתם התאמנתם" | default | critical |
| **streak_warning** | "Streak של {N} בסכנה!" | "עוד יום להתאמן כדי לשמור" | default | normal |
| **streak_celebrated** | "🔥 Streak {N} שבועות!" | "אתם ו{partner} על סטריק אגדי" | subtle | normal |

### 13.2 Icons

- iOS: אייקון האפליקציה + Badge count
- Android: `notification_icon.png` — האות "D" בלבד (32×32, לבן על שקוף)

### 13.3 Deep Linking

כל notification צריכה לפתוח את המסך הרלוונטי:
- invite → `/chat/{id}`
- checkin_needed → `/modal/checkin/{sessionId}`
- streak_warning → `/tabs/me`

---

## 14. Error / Empty / Loading States

### 14.1 Empty States

**Anatomy:**
- אייקון Lucide 32px muted
- Title: Anton 18px `#F5F5F5`
- Body: Space Grotesk 13px muted, max-width 240px
- CTA: primary button

**דוגמאות:**
- `EMPTY_DISCOVER`: אייקון `MapPin` + "עדיין אין פרטנרים ברדיוס..."
- `EMPTY_CHAT_LIST`: אייקון `MessageSquare` + "אין שיחות עדיין..."
- `EMPTY_STREAK`: אייקון `Award` + "עוד לא התאמנת עם פרטנר..."

### 14.2 Loading States (Skeleton)

**Library:** `expo-linear-gradient` + custom shimmer

**Skeleton style:**
- Background: `#0D0D0D`
- Shimmer: gradient `#0D0D0D → #1A1A1A → #0D0D0D` moving left→right (RTL: right→left)
- Duration: 1200ms infinite
- Radius: matches component

**Skeleton screens:**
- Discover: 5 card skeletons בגובה 80px
- Chat list: 6 row skeletons
- Profile: Streak block skeleton (large rectangle) + 3 stats + 3 partner rows

**Text skeleton alternative:**
במקום shimmer מלא, אפשר `// LOADING...` באנתון מוצנע במרכז — מתאים ל-Splash וטעינות קצרות.

### 14.3 Error States

**In-line errors:**
- קרוב לרכיב שגרם (form field, מפה)
- טקסט: Space Grotesk 12px מגנטה
- אייקון: `AlertTriangle` 16px מגנטה משמאל

**Full-screen error:**
- Illustration: אייקון Lucide 48px muted (`AlertTriangle`, `WifiOff`, `MapPinOff`)
- Title + body + CTA (כמו Empty State)

---

## 15. RTL Rules

### 15.1 Logical Properties

```js
// ✅ נכון
{ paddingStart: 16, marginEnd: 8, borderStartWidth: 2 }

// ❌ שגוי
{ paddingLeft: 16, marginRight: 8, borderLeftWidth: 2 }
```

### 15.2 Icon Mirroring

**Mirror in RTL:**
- Chevron / Arrow (חזרה, המשך)
- Send message icon
- List indicators

**Don't mirror:**
- Play / Pause, Camera, Heart, Star, Settings gear

```tsx
<Icon style={{ transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }} />
```

### 15.3 Text עם מספרים inline

מספרים ב-inline נשארים LTR:
```jsx
<Text>התאמנת {27} שבועות</Text>
```
במקרה מורכב: `writingDirection: 'rtl'` על ה-container.

### 15.4 SVG בקונטקסט RTL

**חובה:** `direction="ltr"` על SVG שמכיל טקסט:
```html
<svg direction="ltr" viewBox="...">...</svg>
```

---

## 16. QA Checklist

לפני merge של component חדש — הכל חייב להיבדק ✓:

### Visual
- [ ] Component עובד ב-Light-simulated (על רקע לבן) — לא רלוונטי כרגע אבל checkpoint
- [ ] Component עובד ב-Dark (default)
- [ ] Contrast ratio ≥ 4.5:1 (AA) לכל טקסט
- [ ] כל 6 states קיימות (default, pressed, disabled, focus, loading, error)
- [ ] Font scaling עד 200% לא שובר layout

### Interaction
- [ ] Touch target ≥ 44×44
- [ ] Feedback ויזואלי בלחיצה (pressed state) תוך <100ms
- [ ] Focus visible לכל אלמנט אינטראקטיבי

### Accessibility
- [ ] `accessibilityRole` מוגדר
- [ ] `accessibilityLabel` בעברית ברורה
- [ ] `accessibilityHint` (אם הפעולה לא מובנת מאליה)
- [ ] בדיקה עם VoiceOver (iOS) / TalkBack (Android)

### RTL
- [ ] נבדק במצב עברית (RTL)
- [ ] אייקונים כיווניים עברו mirror נכון
- [ ] SVG עם `direction="ltr"`
- [ ] אין `left`/`right` — רק `start`/`end`

### Motion
- [ ] אין אנימציות מיותרות
- [ ] כל אנימציה מכבדת `AccessibilityInfo.isReduceMotionEnabled()`
- [ ] Durations תואמות לטוקנים

### Performance
- [ ] נבדק על מכשיר low-end (Android אמצע-נמוך)
- [ ] אין re-renders מיותרים
- [ ] תמונות עברו optimization

---

## 17. Change Log

| Version | Date | Changes |
|---------|------|---------|
| **3.1** | 2026-09-22 | תשובה ל-3 השאלות הפתוחות ש-Claude Design העלה לאחר בניית ה-UI kit: **(1)** נוסף **Heebo** (weight 800-900) כפונט Display לכותרות עבריות — Anton (ללא גליפים בעברית) נשאר רק ללוגו/מספרים/טקסט אנגלי. **(2)** נוצרו 2 האייקונים המותאמים החסרים ב-`/assets/icons/` (`check-in.svg`, `duo-logo-mark.svg`). **(3)** הובהר שהגריד המופשט במפת ה-Discover הוא placeholder מכוון ל-mockups סטטיים; באפליקציית הפרודקשן זה Google Maps אמיתי עם style JSON כהה (`/assets/map-style-dark.json`). |
| **3.0** | 2026-09-22 | **Production-ready release.** נוסף: Component states (6 לכל אחד), Icon Library (Lucide), Motion Library (Reanimated + Moti), Accessibility מלא (WCAG contrast, touch targets, screen readers), Copy Library (עברית מלאה לכל 14 המסכים), Modals/Sheets/Toasts specs, Push Notifications, Empty/Loading/Error states, QA Checklist. חבילת tokens חיצונית ב-`/tokens/` (5 פורמטים: W3C JSON, Tokens Studio, CSS, TypeScript, Style Dictionary). |
| 2.0 | 2026-09-22 | שם המוצר → DuoFit. כיוון Underground. לוגו PURE TYPE. Screen inventory. |
| 1.0 | 2026-09-21 | Ember Athletic (deprecated). |

---

## נספחים

### A. קבצים בפרויקט

```
/DESIGN.md                    ← המסמך הזה
/PRD.md                       ← דרישות המוצר
/logo/
  duofit-wordmark.svg
  duofit-icon.svg
  duofit-favicon.svg
/tokens/
  design-tokens.json          ← W3C standard (source of truth)
  tokens-studio.json          ← Figma Tokens Studio format
  tokens.css                  ← CSS variables (web)
  tokens.ts                   ← TypeScript (React Native)
  style-dictionary.config.json ← Multi-platform builder config
  README.md                   ← איך לייבא לכל מערכת
```

### B. External Design Systems — Import Guide

| מערכת | קובץ | הוראה מהירה |
|-------|------|-------------|
| **Figma (Variables)** | `design-tokens.json` | Variables panel → Import from JSON |
| **Figma (Tokens Studio)** | `tokens-studio.json` | Plugin → Import → JSON |
| **Zeroheight** | `design-tokens.json` | Settings → Integrations → W3C |
| **Supernova** | `design-tokens.json` | Design system → Sources → Add |
| **Framer** | `tokens.css` | טעינה ב-Site Settings → Custom CSS |
| **Storybook** | `tokens.css` | Import ב-`.storybook/preview.js` |
| **Style Dictionary** | `style-dictionary.config.json` | `npx style-dictionary build` |

**סיסמת הזהב:** תמיד מתחילים ב-`design-tokens.json` (W3C) כמקור אמת, וסינכרון לשאר הפורמטים.
