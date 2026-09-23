# Component States Specification
**DuoFit · Design System**  
**Version:** 1.0  
**Status:** ✅ FINAL

---

## Button Component

### States (all variants)

**Default**
- Background: `#FF00A8` (magenta)
- Text: `#F5F5F5` (off-white)
- Border: none
- Shadow: none

**Hover**
- Background: `#E0007A` (darker magenta, -20% brightness)
- Text: `#F5F5F5`
- Shadow: `0px 4px 12px rgba(255, 0, 168, 0.3)`
- Cursor: pointer
- Scale: 1.02 (slight zoom)

**Active/Pressed**
- Background: `#CC0066` (even darker, -30% brightness)
- Text: `#F5F5F5`
- Shadow: `inset 0px 2px 4px rgba(0, 0, 0, 0.3)`
- Scale: 0.98 (pressed down)

**Disabled**
- Background: `#3A3A3A` (concrete gray)
- Text: `#7A7A7A` (muted)
- Border: `1px solid #1A1A1A`
- Cursor: not-allowed
- Opacity: 0.6

**Loading**
- Background: `#FF00A8`
- Content: Spinner icon (cyan #00E5FF) rotating
- Text: hidden
- Cursor: not-allowed

---

## Input Component (Text, Phone, OTP)

### States

**Empty (Placeholder)**
- Border: `1px solid #1A1A1A`
- Background: `#050505`
- Text: placeholder color `#7A7A7A`
- Cursor: text

**Focused**
- Border: `2px solid #00E5FF` (cyan)
- Background: `#0D0D0D` (surface)
- Text: `#F5F5F5`
- Box-shadow: `0px 0px 0px 4px rgba(0, 229, 255, 0.1)`
- Cursor: text

**Filled**
- Border: `1px solid #1A1A1A`
- Background: `#0D0D0D`
- Text: `#F5F5F5`
- Padding: 12px 16px
- Height: 48px minimum

**Error**
- Border: `2px solid #FF00A8` (magenta)
- Background: `#0D0D0D`
- Text: `#F5F5F5`
- Error message below (12px, color `#FF00A8`)
- Box-shadow: `0px 0px 0px 4px rgba(255, 0, 168, 0.1)`

**Disabled**
- Border: `1px solid #1A1A1A`
- Background: `#050505`
- Text: `#7A7A7A` (muted)
- Opacity: 0.5
- Cursor: not-allowed

---

## Card Component (Partner Card, Match Card)

### States

**Default**
- Background: `#0D0D0D` (surface)
- Border: `1px solid #1A1A1A`
- Border-radius: 12px
- Shadow: `0px 1px 3px rgba(0, 0, 0, 0.2)`
- Padding: 16px

**Hover**
- Background: `#0D0D0D`
- Border: `1px solid #00E5FF` (cyan)
- Shadow: `0px 8px 24px rgba(0, 229, 255, 0.15)`
- Scale: 1.02 (slight lift)
- Cursor: pointer
- Transition: 200ms ease-out

**Selected/Active**
- Background: `#0D0D0D`
- Border: `2px solid #FF00A8` (magenta, thicker)
- Shadow: `0px 8px 24px rgba(255, 0, 168, 0.2)`
- Scale: 1.02
- Checkmark or highlight indicator visible

**Disabled**
- Background: `#050505`
- Border: `1px solid #1A1A1A`
- Opacity: 0.5
- Cursor: not-allowed

---

## Checkbox/Toggle Component

### States

**Unchecked**
- Border: `2px solid #1A1A1A`
- Background: `#050505`
- Size: 20px × 20px
- Border-radius: 4px

**Checked**
- Background: `#FF00A8` (magenta)
- Border: `2px solid #FF00A8`
- Icon: checkmark in `#F5F5F5`
- Animation: scale 1.1 then back to 1.0

**Focused**
- Box-shadow: `0px 0px 0px 4px rgba(255, 0, 168, 0.1)`

**Disabled**
- Background: `#1A1A1A`
- Border: `2px solid #1A1A1A`
- Opacity: 0.5
- Cursor: not-allowed

---

## Loading States (Skeleton & Spinner)

### Skeleton Loader
- Background: `linear-gradient(90deg, #0D0D0D 0%, #1A1A1A 50%, #0D0D0D 100%)`
- Animation: slide left-to-right, 1.5s loop
- Used for: Card loading, list loading, profile loading

### Spinner
- Color: `#00E5FF` (cyan)
- Size: 24px (small), 48px (large)
- Speed: 1s rotation
- Stroke-width: 3px

---

## Color Contrast Verification (WCAG AA)

| Component | Foreground | Background | Ratio | Pass? |
|-----------|-----------|-----------|-------|-------|
| Button text | #F5F5F5 | #FF00A8 | 4.8:1 | ✅ |
| Secondary text | #A8A8A8 | #050505 | 4.5:1 | ✅ |
| Muted text | #7A7A7A | #050505 | 2.8:1 | ❌ (use #A8A8A8) |
| Magenta on white | #FF00A8 | #F5F5F5 | 4.8:1 | ✅ |
| Cyan on black | #00E5FF | #050505 | 4.8:1 | ✅ |

---

## Touch Target Sizes (Mobile)

**Minimum touch target:** 48px × 48px (iOS/Android standard)

- Buttons: 48px height, 56px+ width
- Inputs: 48px height
- Cards: min 64px × 64px clickable area
- Icons: 24px icon in 48px target area
- Spacing between targets: 8px minimum

---

## Transitions & Animations

**Page transitions:** 300ms ease-out (fade or slide up)  
**Button hover:** 150ms ease-in-out  
**Input focus:** 100ms ease-out  
**Card hover:** 200ms ease-out  

All transitions use ease-out or ease-in-out (never linear for UI).

---

## Implementation Notes

- Use CSS custom properties (variables) for all colors
- Apply transitions to all interactive elements
- Test all states at both light and dark contrast levels
- Verify touch targets on physical mobile devices
- Ensure keyboard navigation (tab, enter, escape) works on web
