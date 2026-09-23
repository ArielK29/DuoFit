# Motion & Animation Specification
**DuoFit · Design System**  
**Version:** 1.0  
**Status:** ✅ FINAL

---

## Timing Principles

### Standard Durations
- **Fast interactions** (hover, focus): 100-150ms
- **Page transitions**: 300ms
- **Micro-interactions** (button press, success): 200ms
- **Longer flows** (modal entrance): 400ms

### Easing Functions
- **UI interactions:** `ease-out` (fast start, smooth end)
- **Entrance animations:** `ease-out`
- **Exit animations:** `ease-in`
- **Hover/focus:** `ease-in-out`
- **Never use:** `linear` (feels robotic)

---

## Page & Screen Transitions

### Standard Transition (Navigation)
- **Duration:** 300ms
- **Type:** Fade + Slide up
- **Easing:** ease-out
- **Details:**
  - Opacity: 0 → 1 (new screen fades in)
  - Transform: translateY(24px) → translateY(0) (slides up from bottom)

```css
@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.screen-enter {
  animation: slideUpFade 300ms ease-out;
}
```

### Back Navigation Exit
- **Duration:** 200ms
- **Type:** Fade out + slight scale down
- **Opacity:** 1 → 0
- **Transform:** scale(1) → scale(0.95)

---

## Button Interactions

### Hover State
- **Duration:** 150ms
- **Easing:** ease-in-out
- **Changes:**
  - Background color change
  - Shadow appears
  - Scale: 1 → 1.02 (2% grow)

### Press/Active State
- **Duration:** 100ms
- **Easing:** ease-out
- **Changes:**
  - Background darkens (pressed)
  - Shadow goes inward (pressed effect)
  - Scale: 1 → 0.98 (2% shrink)

### Loading State
- **Duration:** Continuous
- **Type:** Spinning spinner
- **Spinner rotation:** 360° per 1000ms
- **Easing:** linear (constant spin)
- **Color:** Cyan #00E5FF

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

---

## Form Interactions

### Input Focus
- **Duration:** 100ms
- **Easing:** ease-out
- **Changes:**
  - Border color: #1A1A1A → #00E5FF (cyan)
  - Glow: box-shadow with cyan halo
  - No scale (avoid keyboard jump)

### Form Shake (Error)
- **Duration:** 300ms total
- **Easing:** ease-in-out
- **Pattern:** 3 shakes

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

.input-error {
  animation: shake 300ms ease-in-out;
}
```

### Success Checkmark
- **Duration:** 500ms
- **Easing:** ease-out
- **Pattern:**
  1. Scale: 0 → 1.2 (overshoot slightly)
  2. Drop: translateY(-12px) → translateY(0)
  3. Color fade: opacity 0 → 1

```css
@keyframes checkmark {
  0% {
    opacity: 0;
    transform: scale(0) translateY(-12px);
  }
  60% {
    opacity: 1;
    transform: scale(1.2) translateY(0);
  }
  100% {
    transform: scale(1);
  }
}
```

---

## Screen-Specific Animations

### 1. Onboarding Flow (1a → 1k → 1l → 1b → 1m → 1n)

Each screen transition:
- Fade + slide up 300ms ease-out
- When "Next" button tapped:
  1. Button scale 0.98 for 100ms
  2. Screen fades out 200ms
  3. New screen fades in 300ms
  4. Back arrow available after 200ms delay

### 2. OTP Input (1l) — Real-time

As user types each digit:
- **Digit entry:** Scale 1 → 1.1 → 1.0 (bounce, 200ms)
- **On focus:** Input border glows cyan (100ms)
- **Full code:**
  1. If correct: Success checkmark (500ms)
  2. If wrong: Shake animation (300ms) + error message slides down

### 3. Partner Card Swipe (1c)

When swiping Discover card:
- **Swipe out (reject):** Rotate -45°, translateX(-200px), opacity fade (300ms ease-in)
- **Tap (interested):** Button press animation (100ms) + "Let's workout" modal slides up (400ms ease-out)

### 4. Match Found → Workout Scheduled (1d → 1e → 1f)

- Partner profile loads: skeleton fade → real content (300ms cross-fade)
- "Let's workout" button: scale press 100ms, then date picker modal enters 400ms ease-out
- Date selected: Button highlights in magenta (200ms), then slides to next screen 300ms

### 5. Workout Day (1g) — Streak Display

Streak number appears with animation:
- **Scale:** 0 → 1.3 → 1.0 (bounce, 400ms ease-out)
- **Glow:** Cyan shadow glow appears 200ms, fades out 1000ms
- **If streak saved:** Confetti particles fade out over 2000ms

### 6. Check-in (1h) — Confirmation

When both users confirm:
1. Checkmark animation (500ms)
2. "סיימתם אימון יחד!" (You completed!) appears (300ms slide up)
3. Cyan glow expands from center (500ms)
4. Auto-advance to next screen after 2 seconds

### 7. Dashboard (1i) — Home Load

On first load:
- Skeleton loaders appear (animated gradient)
- Real content fades in place of skeletons (300ms cross-fade)
- Streak number bounces (400ms ease-out)
- Each stat card staggered entry: 100ms, 200ms, 300ms

---

## General Loading Patterns

### Skeleton Loader Animation
- **Pattern:** Animated shimmer from left to right
- **Duration:** 1.5s per cycle, continuous
- **Colors:**
  - Light: #0D0D0D
  - Medium: #1A1A1A
  - Background: linear-gradient(90deg, #0D0D0D 0%, #1A1A1A 50%, #0D0D0D 100%)

```css
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton {
  background: linear-gradient(90deg, #0D0D0D 0%, #1A1A1A 50%, #0D0D0D 100%);
  background-size: 1000px 100%;
  animation: shimmer 1.5s infinite;
}
```

### Spinner Loading
- **Size:** 24px (small), 48px (large)
- **Color:** Cyan #00E5FF
- **Duration:** 1s per rotation
- **Easing:** linear
- **Stroke width:** 3px

---

## Touch Feedback (Mobile)

### Tap Ripple (Material-style)
- **Duration:** 400ms
- **Easing:** ease-out
- **Pattern:**
  1. Opacity: 0.1 → 0.3 (appears)
  2. Scale: 0 → 1 (expands from tap point)
  3. Opacity: 0.3 → 0 (fades out)

Alternatively, simple press/release:
- Pressed: backgroundColor darken, scale 0.98
- Released: fade back to normal

---

## Accessibility Notes

### Reduced Motion

Users with `prefers-reduced-motion: reduce` should see:
- No scale animations (use opacity instead)
- No entrance/exit animations (instant or fade only)
- No parallax or complex 3D
- Spinners still OK (essential for progress indication)

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### No Flashing/Strobing
- All animations max 3Hz (3 flashes per second)
- Spinners OK (not flashing)
- Avoid red/green rapidly alternating

---

## Implementation Checklist

- [ ] All transitions use ease-out (not linear)
- [ ] Page transitions are 300ms ± 50ms
- [ ] Button hover is 150ms with shadow + scale
- [ ] Form shake on error (300ms)
- [ ] Success checkmark bounces (500ms)
- [ ] Loading skeleton has shimmer animation
- [ ] Spinner is cyan #00E5FF, 1s rotation
- [ ] Entrance animations staggered (optional, not required)
- [ ] Reduced motion respects `prefers-reduced-motion`
- [ ] No animations faster than 3Hz (flashing)
- [ ] Test on slow device (Pixel 2, iPhone 6s) — should still feel smooth

---

## Tools & Libraries

### React Native
- Use `Animated` API or `Reanimated` (v2+)
- React Navigation handles screen transitions (customizable)
- `react-native-gesture-handler` for swipe animations

### Web/React
- CSS Transitions for simple states
- Framer Motion for complex sequences
- React Transition Group as fallback

### Easing Library
- Avoid custom easing — use standard `ease-out`, `ease-in`, `ease-in-out`
- No cubic-bezier() unless tested
