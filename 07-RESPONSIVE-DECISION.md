# Responsive Design Decision
**DuoFit · Design System**  
**Version:** 1.0  
**Status:** ✅ FINAL

---

## Decision: MOBILE-ONLY

### Primary Breakpoint
- **375px × 812px** (iPhone SE / standard mobile)
- This is the ONLY supported breakpoint

### Why Mobile-Only?

1. **Use Case:** Fitness app = used in gym, outdoors, during workouts
   - No one opens fitness app on desktop
   - No need for laptop/tablet versions
   
2. **Product Focus:** Real-time location matching + workout pairing
   - Requires GPS + accelerometer
   - Phone-native features only
   
3. **Time to Market:** Skip tablet/desktop = faster to MVP
   - 2-3 weeks less design + dev
   - Simpler QA
   
4. **Future-Proof:** Can add tablet/desktop in V2 if needed
   - Design tokens already built (scalable)
   - Figma works at any breakpoint

---

## What This Means

### ✅ DO

- Design for 375px width (smallest phone)
- Test on actual devices (iPhone SE, Pixel 4a)
- Use responsive typography (scale with viewport)
- Full-screen immersive UI (no desktop-style sidebars)

### ❌ DON'T

- Add tablet layouts (768px)
- Add desktop views (1280px+)
- Use left/right sidebars (phone UX)
- Assume mouse/trackpad input (touch-only)

---

## Implementation

### CSS
```css
/* Mobile-first only */
@media screen and (min-width: 375px) and (max-width: 428px) {
  /* Handle large phones (iPhone 12/13 Max) if needed */
  body { font-size: 16px; }
}

/* NO tablet breakpoint */
/* NO desktop breakpoint */
```

### React Native
```tsx
const { width, height } = useWindowDimensions();

// Assume mobile only — width will be 375-428px
// No tablet/desktop handling needed
```

---

## Future Path

**If tablet/desktop needed in V2:**

1. Create new wireframes for 768px (tablet) and 1280px (desktop)
2. Design new component variants (wider buttons, multi-column layouts)
3. Add breakpoints to CSS
4. Minimal code changes (design system already supports scaling)

**Timeline if V2 includes tablet:** +2-3 weeks for design + dev

---

## Testing Coverage

- ✅ iPhone SE (375px)
- ✅ iPhone 11/12 (390px)
- ✅ Pixel 5 (412px)
- ✅ Tall screens (Samsung S21 — 1080px height)
- ❌ iPad (tablet — explicitly NOT supported)
- ❌ Chrome DevTools "Responsive" mode
  - Only use for quick checks; always test on real device
  - DevTools doesn't simulate actual mobile performance

---

## Navigation Strategy

Since mobile-only:
- **No desktop navigation** (no hamburger menu needed)
- Tab bar at bottom (iOS style) or top (Android style)
- Full-screen modals and screens
- Gesture-driven (swipe, pinch, tap)

---

## Performance (Mobile-Only Advantage)

Mobile-only lets us:
- Skip CSS media queries (simpler)
- Skip responsive image sizes (one size fits all)
- Skip complex grid layouts (single column)
- Focus on battery + network optimization
- Faster app launch, smaller bundle

---

## Decision Confirmation

✅ **APPROVED FOR DEVELOPMENT:** Mobile-only, 375-428px width

No further design work needed for tablet/desktop in V1.

**Next step:** Begin React Native implementation with Expo.
