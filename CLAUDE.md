# Claude Instructions for DuoFit

## Project Overview
DuoFit is a Hebrew-language fitness buddy matching app built with React Native + Expo. This document guides AI assistants on project standards, structure, and workflow.

---

## Branch Strategy

### Main Branch
- **Purpose:** Production-ready code
- **Protection:** Require PR reviews before merge
- **Contains:** Design system files (01-08-*.md), core infrastructure, README

### Feature Branches
- **Naming:** `feature/{feature-name}`
  - `feature/login` — Authentication (phone → OTP → profile)
  - `feature/discover` — Partner discovery & matching
  - `feature/checkout` — Workout scheduling
  - `feature/dashboard` — User stats & streaks
  - `feature/chat` — Messaging between partners

- **Process:**
  1. Create branch from `main`
  2. Implement feature with tests
  3. Create PR with description
  4. Request review
  5. Merge after approval

---

## Design System Reference

**Always check these files before building UI:**
1. `01-DESIGN-TOKENS.json` — Colors, typography, spacing (W3C format)
2. `02-COMPONENT-STATES.md` — Button/input/card states
3. `03-EDGE-CASES.md` — Error handling, empty states
4. `04-DARK-MODE.md` — Dark-only design (no light mode)
5. `05-MOTION-SPECS.md` — Animation timing (300ms transitions, ease-out)
6. `06-RTL-ICONS-SPEC.md` — RTL layout, Lucide icons (24px, 2px stroke)
7. `07-RESPONSIVE-DECISION.md` — Mobile-only (375-428px)
8. `08-DESIGN-SIGN-OFF.md` — Final approval & checklist

---

## Code Standards

### Language
- **UI Text:** Hebrew (RTL)
- **Code:** English
- **Comments:** English
- **Commits:** English

### File Structure
```
screens/
├── login/
│   ├── SignUpScreen.tsx
│   ├── LoginScreen.tsx
│   ├── VerifyOTPScreen.tsx
│   └── ProfileSetupScreen.tsx
├── discover/
│   ├── DiscoverScreen.tsx
│   └── PartnerProfileScreen.tsx
└── dashboard/
    └── DashboardScreen.tsx

components/
├── Button.tsx
├── Input.tsx
├── Card.tsx
├── StreakDisplay.tsx
└── EmptyState.tsx

hooks/
├── useAuth.ts
├── useLocation.ts
└── usePartnerMatching.ts

constants/
├── colors.ts
├── spacing.ts
└── typography.ts

styles/
└── theme.ts
```

### Component Naming
- **Screens:** `{ScreenName}Screen.tsx` (PascalCase)
- **Components:** `{ComponentName}.tsx` (PascalCase)
- **Hooks:** `use{HookName}.ts` (camelCase)
- **Types:** `{TypeName}.ts` (PascalCase)

### Color Usage (from design tokens)
```tsx
import { colors } from '../constants/colors';

<View style={{ backgroundColor: colors.dark.bg }}>
  <Text style={{ color: colors.dark.text }}>Hello</Text>
  <Button backgroundColor={colors.dark.magenta} />
</View>
```

### Animation Timing
```tsx
// Page transition: 300ms ease-out
<Animated.View
  style={{
    animation: fadeInSlideUp 300ms ease-out,
  }}
/>

// Button hover: 150ms ease-in-out
<Pressable onPressIn={handleHover} />
```

---

## Testing Checklist Before PR

- [ ] All text in Hebrew (UI) is RTL-aligned
- [ ] Button/input states match `02-COMPONENT-STATES.md`
- [ ] Colors use design tokens (no hardcoded #hex)
- [ ] Animation timing matches `05-MOTION-SPECS.md`
- [ ] Error messages in Hebrew with English fallback
- [ ] Touch targets min 48px (per `02-COMPONENT-STATES.md`)
- [ ] Tested on iPhone SE (375px) and Pixel 5 (412px)
- [ ] No console warnings or errors
- [ ] Accessibility: font size readable, contrast >4.5:1

---

## Common Patterns

### RTL Input Field
```tsx
<TextInput
  style={{
    textAlign: 'right',
    marginInlineEnd: 16,
    marginInlineStart: 0,
  }}
  placeholder="שם מלא"
/>
```

### Error Message (Hebrew)
```tsx
{error && (
  <Text style={{ color: colors.dark.magenta, fontSize: 12 }}>
    {error} {/* e.g., "קוד שגוי" */}
  </Text>
)}
```

### Loading Skeleton
```tsx
<View style={{
  backgroundColor: colors.dark.surface,
  borderRadius: 8,
  overflow: 'hidden',
}}>
  <Animated.View
    style={{
      background: 'linear-gradient(90deg, #0D0D0D 0%, #1A1A1A 50%, #0D0D0D 100%)',
      animation: shimmer 1.5s infinite,
    }}
  />
</View>
```

---

## Git Workflow

### Commit Message Format
```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code reorganization (no behavior change)
- `style:` Formatting, missing semicolons (no code change)
- `test:` Adding or updating tests
- `docs:` Documentation changes
- `chore:` Build, deps, tooling

**Example:**
```
feat: add partner discovery screen with swipe gestures

- Implement partner card with image, name, bio
- Add swipe animations (rotate -45°, fade out)
- Connect to matching API
- Add "interested" and "pass" CTAs

Closes #42
```

---

## Contact & Support
- **Questions:** Check CLAUDE.md first, then design specs
- **Design Spec:** Refer to files 01-08 in root
- **Code Review:** All PRs require review before merge

---

**Last Updated:** 2026-09-23  
**Status:** Active Development
