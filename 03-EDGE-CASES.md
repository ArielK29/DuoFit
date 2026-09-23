# Edge Cases & Error States Specification
**DuoFit · Design System**  
**Version:** 1.0  
**Status:** ✅ FINAL

---

## Empty States

### Discover Screen (No Partners Found)

**Screen:** Shows empty partner card stack

**Layout:**
- Hero icon: `🏚️` or empty card outline (24px, cyan #00E5FF)
- Headline: "אין שותפים קרובים" (No partners nearby)
- Subheading: "נסה שוב מאוחר יותר או הרחב את ההרשאות" (Try again later or expand permissions)
- CTA Button: "רענן חיפוש" (Refresh search, magenta)

**Colors:**
- Icon: #00E5FF (cyan)
- Text: #F5F5F5 (off-white)
- Button: #FF00A8 (magenta)

---

### Chat/Messages (No Messages)

**Headline:** "עדיין אין הודעות" (No messages yet)  
**Subheading:** "צא לאימון הראשון שלך!" (Start your first workout!)  
**Icon:** Speech bubble outline (cyan)

---

### Dashboard (First Time)

**Streak Number:** 0  
**Stats:** All zeros  
**CTA:** "התחל להתאמן עכשיו" (Start training now, magenta button)

---

## Error States

### Network Error (Timeout)

**Screen:** Modal/Alert overlay

**Content:**
- Headline: "בעיה בחיבור" (Connection issue)
- Message: "לא הצלחנו להתחבר לשרת. בדוק את ה-Wi-Fi שלך" (Failed to connect. Check your Wi-Fi)
- Icon: ⚠️ or connection-error icon (magenta, 48px)
- Button 1: "נסה שוב" (Retry, magenta, primary)
- Button 2: "צא" (Cancel, gray outline, secondary)

**Styling:**
- Background: semi-transparent dark overlay
- Border: `1px solid #FF00A8` (magenta)
- Toast appears for 4 seconds, then dismisses

---

### Authentication Error

**Case 1: Wrong OTP Code**
- Error message below input: "קוד שגוי. נסה שוני" (Wrong code. Try again)
- Input border: `2px solid #FF00A8` (magenta error)
- Shake animation: -3px to +3px horizontal, 100ms
- Clear on next keystroke

**Case 2: Phone Not Found**
- Message: "מספר זה לא רשום. הירשם קודם" (Number not registered. Sign up first)
- CTA: "חזור להרשמה" (Back to signup)

**Case 3: Session Expired**
- Modal: "ההפעלה שלך פקעה" (Your session expired)
- Message: "אנא התחבר שוב" (Please log in again)
- Button: "התחברות" (Login)

---

### Form Validation Errors

**Required Field Missing**
- Red border: `2px solid #FF00A8`
- Error message: "שדה חובה" (Required field)
- Below input, 12px, color #FF00A8

**Example:**
```
Name input (empty)
┌─────────────────┐
│ שם מלא          │ ← placeholder
└─────────────────┘
🔴 שדה חובה (Required field)
```

**Multi-error Form:**
- All invalid inputs get red borders
- Error summary at top: "נמצאו X שגיאות" (X errors found)
- Scroll to first error on submit

---

### Permission Denied

**Location Permission**
- Screen: Modal
- Headline: "זקוקים להרשאת מיקום" (Location permission required)
- Message: "כדי למצוא שותפים קרובים, אנחנו צריכים גישה למיקום שלך" (We need location access to find nearby partners)
- Icon: Location pin (magenta, 48px)
- Button 1: "אפשר" (Allow, magenta)
- Button 2: "עדיף לא" (Not now, gray)

**Notification Permission**
- Headline: "הפעל התראות" (Enable notifications)
- Message: "כדי להודיע לך על בדיקות ואימונים קרובים" (To notify you about check-ins and workouts)
- Same button structure

---

## Loading States

### Page Loading

**Full Screen Loader (First Load)**
- Spinner: cyan #00E5FF, 48px, rotating
- Text: "טוען..." (Loading...)
- Positioned center, above spinner

### List/Feed Loading

**Skeleton Loaders (Cards)**
```
┌──────────────────────┐
│ ▓▓▓▓▓▓▓▓ (animated)  │ ← Name skeleton
│ ▓▓▓▓▓ (animated)     │ ← Subtitle skeleton
│ ▓▓▓▓▓▓▓▓▓▓▓▓ (anim) │ ← Description
└──────────────────────┘
```

- Background: `linear-gradient(90deg, #0D0D0D, #1A1A1A, #0D0D0D)`
- Animation: slide left-to-right, 1.5s loop
- Show 3-4 skeleton cards while loading list
- Fade out when real data arrives

### Form Submission Loading

**Button State:**
```
Before: [שלח]
During: [⟳ שולח...]
After: [✓ נשלח!] → then back to [שלח]
```

- Button text changes to "שולח..." (Sending...)
- Spinner inside button (small, 16px)
- Button disabled during submit
- Success checkmark animation on success

---

## Timeout States

### OTP Code Expired

**Scenario:** User took >10 minutes to enter code

**Message:** "הקוד שלך פקע" (Your code expired)  
**Button:** "שלח קוד חדש" (Send new code)  
**Countdown:** If resend limit approaching, show: "ניתן לשלוח קוד בעוד 2 דקות" (Can resend in 2 minutes)

---

### Workout Session Timeout

**Scenario:** Partner didn't check-in within 30 min window

**Screen:**
- Headline: "פקעה הסיבובים" (Session expired)
- Message: "לא הצלחנו להשלים את בדיקת השותף" (Could not complete partner check-in)
- Button: "חזור לבית" (Back home)

---

## Specific Error Codes

| Error | Message (Hebrew) | Fallback | Icon | CTA |
|-------|-----------------|----------|------|-----|
| 400 | בקשה לא תקינה | Invalid request | ⚠️ | Retry |
| 401 | לא מאותתק | Unauthorized | 🔐 | Re-login |
| 403 | אסור | Forbidden | 🚫 | Contact support |
| 404 | לא נמצא | Not found | ❓ | Go home |
| 429 | יותר מדי בקשות | Rate limited | ⏳ | Wait & Retry |
| 500 | שגיאת שרת | Server error | 💥 | Retry later |
| Timeout | פקע הזמן | Connection timeout | ⏱️ | Retry |

---

## Implementation Guidelines

### Toast Messages
- Position: Bottom center, 16px from bottom
- Duration: 4 seconds (auto-dismiss)
- Background: Magenta #FF00A8 for errors
- Text: White #F5F5F5
- Max width: 80% of screen

### Modal Errors
- Overlay: Semi-transparent black, 70% opacity
- Modal: Centered, 88% width (max 440px), rounded 12px
- Padding: 24px
- Button spacing: 12px gap, 100% width each

### Inline Errors
- Red border + error text below input
- Error text: 12px, color #FF00A8
- Clear when user starts typing
- Use shake animation (100ms, -3px to +3px)

### Network Retry Logic
- Auto-retry first time (silent, show spinner)
- If fails again: show error message + manual retry button
- Max retry attempts: 3

---

## Testing Checklist

- [ ] Test all error messages in Hebrew RTL
- [ ] Verify error icons visible on black background
- [ ] Test error animations (shake, fade)
- [ ] Verify touch targets on error buttons (48px min)
- [ ] Test error recovery (does flow work after retry?)
- [ ] Test toast dismiss (manual close + auto-dismiss)
- [ ] Test form with multiple errors at once
- [ ] Test loading states on slow connections (simulate 3G)
- [ ] Test contrast ratios for error messages
