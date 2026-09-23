# RTL & Icon Specification
**DuoFit · Design System**  
**Version:** 1.0  
**Status:** ✅ FINAL

---

## RTL (Right-to-Left) Layout

### Core Rules

**1. Direction:** All screens are RTL-first
- HTML: `<html dir="rtl">`
- All text flows right-to-left
- All UI elements align to right by default

**2. Logical Properties (NOT physical left/right)**

❌ DON'T use:
```css
.button {
  margin-left: 16px; /* WRONG */
  padding-right: 12px; /* WRONG */
  border-left: 2px solid cyan; /* WRONG */
}
```

✅ DO use:
```css
.button {
  margin-inline-start: 16px; /* Adapts to RTL */
  padding-inline-end: 12px; /* Adapts to RTL */
  border-inline-start: 2px solid cyan; /* Flips in RTL */
}
```

**3. Text Alignment**
- Body text: align right (RTL default)
- Form inputs: text-align right, cursor at right edge
- Placeholder text: right-aligned

**4. Navigation**
- Back arrow: Points LEFT (←) — do NOT flip
  - In RTL, going "back" is still left-ward in gesture/navigation sense
  - Icon direction stays the same
- Forward arrow: Points RIGHT (→) — do NOT flip
- Swipe direction: Right gesture = next screen (same as LTR)

**5. Image/Content Positioning**
- Profile images: Left side of card (flipped from typical right)
- CTA buttons: Right side of card
- All stacked content: top-down unchanged

---

## Icon Library (Lucide Icons)

### Icons Used in DuoFit

**Navigation & Actions**
- `chevron-right` — Forward (in navigation)
- `chevron-left` — Back button
- `arrow-left` — Back/Undo
- `arrow-right` — Forward/Next
- `menu` — Hamburger menu
- `x` — Close modal/dialog
- `check` — Confirmation, success

**User & Profile**
- `user` — Profile icon
- `user-plus` — Add/invite user
- `users` — Multiple users/groups
- `heart` — Favorite, like
- `star` — Rating, badge

**Communication & Social**
- `message-square` — Chat, message
- `bell` — Notifications
- `share-2` — Share screen
- `send` — Send message/invite

**Fitness & Workout**
- `zap` — Streak, energy, active
- `calendar` — Date, schedule
- `clock` — Time, timer
- `map-pin` — Location, distance
- `activity` — Workout, activity
- `target` — Goal, aim
- `briefcase` — Gym, workout

**Settings & System**
- `settings` — Settings screen
- `sliders` — Filters, preferences
- `toggle-2` — Toggle switch
- `eye` — Show/View
- `eye-off` — Hide
- `download` — Download, import
- `upload` — Upload, export

**Status & Feedback**
- `alert-circle` — Warning, error
- `info` — Information
- `check-circle` — Success
- `loader` — Loading spinner

---

## Icon Styling

### Sizes
- **Tiny:** 16px (inline with text, metadata)
- **Small:** 20px (list items, labels)
- **Medium:** 24px (buttons, tab bar)
- **Large:** 32px (hero/featured actions)
- **Extra Large:** 48px (error/empty states)

### Colors
- **Primary:** #F5F5F5 (off-white) — most icons
- **Brand Magenta:** #FF00A8 — primary actions, highlights
- **Brand Cyan:** #00E5FF — success, active, Streak
- **Muted:** #A8A8A8 — disabled, secondary
- **Error:** #FF00A8 — errors, warnings

### Stroke Weight (Lucide)
- All icons: 2px stroke (Lucide "outline" style)
- Never use filled/solid style (unless specifically noted)
- Icons scale with their container, stroke stays 2px

### Icon + Text Combinations

```
Common Patterns:

[Icon 16px] Label text (inline with paragraph)
[Icon 20px] List item label → clickable area 48px height
[Icon 24px] [Button text] → full button 48px height
[Icon 48px] 
  Centered error message
  In empty/error state screen
```

---

## RTL Icon Behavior

### Icons that STAY the same in RTL
- ✅ `check` (checkmark) — symmetric
- ✅ `zap` (lightning bolt) — symmetric
- ✅ `star` (star) — symmetric
- ✅ `heart` (heart) — symmetric
- ✅ `user` (person) — symmetric
- ✅ `bell` (notification) — symmetric
- ✅ `message-square` (chat bubble) — symmetric
- ✅ `calendar` (calendar) — symmetric
- ✅ `clock` (clock) — symmetric
- ✅ `activity` (activity) — symmetric
- ✅ `target` (target) — symmetric
- ✅ `settings` (gear) — symmetric
- ✅ `toggle-2` (toggle) — symmetric
- ✅ `eye` / `eye-off` (eye) — symmetric
- ✅ `alert-circle` (alert) — symmetric

### Icons that DO NOT flip in RTL
- ✅ `chevron-right` — Points RIGHT ➜ (stays same)
- ✅ `chevron-left` — Points LEFT ⬅ (stays same)
- ✅ `arrow-right` — Points RIGHT ➜ (stays same)
- ✅ `arrow-left` — Points LEFT ⬅ (stays same)
- ✅ `menu` (hamburger) — 3 horizontal lines (stays same)
- ✅ `x` (close) — X shape (stays same)
- ✅ `map-pin` (location pin) — Points down (stays same)
- ✅ `download` — Arrow points down (stays same)
- ✅ `upload` — Arrow points up (stays same)

### Why No Flip?
In RTL gesture/navigation semantics:
- Swiping RIGHT = advance/next (same as LTR in gesture context)
- Swiping LEFT = go back (same as LTR)
- Arrows indicating direction are ABSOLUTE, not relative

**Example:**
```
[← Back button stays ← ]  (user swipes from right edge, expects to go back)
[→ Next arrow stays →]  (consistent with gesture semantics)

NOT:
[→ Back button flipped to →]  (confusing! gestures don't flip)
```

---

## Lucide Import (React Native & Web)

### React Native
```tsx
import { ChevronRight, Check, Zap, MessageSquare } from 'lucide-react-native';

<ChevronRight size={24} color="#F5F5F5" strokeWidth={2} />
<Zap size={24} color="#00E5FF" strokeWidth={2} />
```

### React / Web
```tsx
import { ChevronRight, Check, Zap, MessageSquare } from 'lucide-react';

<ChevronRight size={24} color="#F5F5F5" strokeWidth={2} />
<Zap size={24} color="#00E5FF" strokeWidth={2} />
```

---

## Form Fields (RTL Specific)

### Text Input
```
RTL:
שם מלא         [text input box]
(label on right, input box on right side)

Visual flow: [input] label
```

### Checkbox / Radio
```
RTL:
☑ אני מסכים לתנאים
(checkbox on LEFT of label, because label is RTL)

Visual flow: checkbox ← text
```

### Toggle Switch
```
RTL:
הפעל התראות    [◯ → ◉]
(label on right, toggle on left)
```

---

## Edge Cases & Gotchas

### Numbers & Digits
- Phone numbers: Always LTR `+972-50-123-4567`
- Streak counts: Always LTR `27` (not `72`)
- Dates: Format `DD.MM.YYYY` right-aligned but numbers stay LTR
- OTP code: `123456` — LTR digits, right-aligned in field

### Mixed Text (Hebrew + English)
```
Example: "Follow John Smith"

In RTL should render as:
John Smith עקוב
(direction auto-handles mixing)

Use <bidi> tags or dir="auto" for safe rendering
```

### Links & URLs
- Always LTR `https://duofit.app` even in RTL text
- Underline stays visible
- Let browser handle text direction

---

## Testing Checklist

- [ ] All text aligns right by default
- [ ] Inputs have text-align: right
- [ ] Logical CSS properties used (no left/right)
- [ ] Icons stay in place (no flip)
- [ ] Checkboxes/radios on left of labels
- [ ] Toggles on left of labels
- [ ] Back arrow still points left ←
- [ ] Navigation feels natural (right swipe = next)
- [ ] Numbers stay LTR digits
- [ ] Hebrew + English text renders correctly
- [ ] No horizontal scroll
- [ ] Touch targets stay 48px minimum
- [ ] Modal dialogs centered
- [ ] Overflow handled (no cut-off text)

---

## Implementation Libraries

### React Native
- Use `I18nManager.isRTL` to detect RTL
- Yoga layout engine handles flexDirection automatically
- Use `start` / `end` properties

### Web
- Use CSS Logical Properties (width, height, margins, padding, borders)
- Flexbox + `flex-direction: row-reverse` if needed
- CSS Grid respects RTL automatically
- Avoid `left` / `right` positioning

### Third-party Libraries
- Ensure i18n library supports RTL (react-i18next, expo-localization)
- Test with RTL simulator before launch
- Never hardcode left/right in code
