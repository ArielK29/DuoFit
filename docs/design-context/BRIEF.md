# DuoFit - brief for a high-fidelity MOBILE design project

Project name in Claude Design: **DuoFit-Hi-Fi-Mobile** (fidelity: High fidelity).

## What DuoFit is
A Hebrew, right-to-left fitness-buddy app: people find a real workout partner nearby, chat, schedule a workout together, check in, and track progress and streaks. Mobile only (phones). Built with React Native + Expo; the working app already exists in `duofit/`.

## The goal of this design project
**Be faithful to the original design and only adapt it to mobile.** Create the high-fidelity mobile design for the existing app so that it matches the original design system exactly. This is **not a redesign**: the visual language, colors, fonts, components, copy and the information on every screen stay exactly as they are. The only thing that changes is how the same design is fitted to a phone (sizing, spacing, thumb reach, small-screen behavior). Each screen gets a few **variations**, and every variation must be a faithful mobile adaptation, never a new style.

## Hard rules (do not break)
1. **Dark mode only.** No light theme. Background `#050505`, cards `#0D0D0D`, raised `#1A1A1A`, text `#F5F5F5` (secondary `#A8A8A8`, tertiary `#8C8C8C`).
2. **Brand colors:** magenta `#FF00A8` (primary actions), cyan `#00E5FF` (secondary / selected), amber `#FFB800` (warnings, stars). Text on magenta/cyan is near-black.
3. **Right-to-left Hebrew UI.** Titles and body text sit on the right; first item in a row is on the right. UI copy is in Hebrew (keep the Hebrew strings visible in the screenshots).
4. **Fonts:** Heebo (Hebrew, 800 for titles), Space Grotesk 600 (h3), Anton (Latin-only numbers). Radii: cards 24px, pills fully round, small 8-12px.
5. **Touch targets at least 48px**, contrast at least 4.5:1, mobile width 375-428px. Icons: Lucide, 24px, 2px stroke.
6. **No invented people.** Never design with fake users as if they were real; show real empty states ("אין שותפים קרובים", "היה הראשון לשתף"). When a screen needs people to look populated, mark it clearly as an illustrative state.
7. Do not add features that do not exist in the app (see the screen list).

## Screens that exist (sources are in the repo)
| Screen | Code | Screenshot |
|---|---|---|
| Login / sign-up / forgot password | `duofit/screens/login/` | `docs/design-context/screens/01-login.jpg` |
| Profile setup (after sign-up) | `duofit/screens/login/ProfileSetupScreen.tsx` | - |
| Home (בית) | `duofit/src/app/(tabs)/dashboard.tsx` | `screens/02-home.jpg` |
| Matches (התאמות): swipe card, places map, filters | `duofit/screens/discover/` , `duofit/components/FilterSheet.tsx` | `screens/03-matches.jpg` |
| Chat list + conversation (צ'אטים) | `duofit/screens/chat/` | - |
| Community (קהילה): weekly plank challenge, groups, feed | `duofit/screens/community/` | - |
| Progress (התקדמות): weight, streak, charts | `duofit/screens/progress/` | - |
| Partner profile, schedule workout, check-in, notifications | `duofit/screens/discover/PartnerProfileScreen.tsx`, `duofit/screens/checkout/`, `duofit/screens/notifications/` | - |

Design system sources: `01-DESIGN-TOKENS.json`, `02-COMPONENT-STATES.md`, `03-EDGE-CASES.md`, `04-DARK-MODE.md`, `05-MOTION-SPECS.md`, `06-RTL-ICONS-SPEC.md`, `07-RESPONSIVE-DECISION.md`, `08-DESIGN-SIGN-OFF.md`, `DESIGN.md`, `PRD.md`, `tokens/`, `logo/`, `assets/`, and the shared UI components in `duofit/components/` and `duofit/constants/`.

## What to produce
- High-fidelity artboards on a design canvas, **three variations per screen**. All three keep the same elements, colors, fonts, components and copy; they differ only in the mobile adaptation:
  - **A - Faithful:** exactly the current layout, fitted to the phone frame.
  - **B - Thumb-friendly:** the same layout with the main actions placed within thumb reach (bottom area), 48px+ targets, sheets instead of full pages where the app already uses sheets.
  - **C - Small-phone:** the same layout tuned for the smallest phones (375px wide) and large text, with spacing/line breaks adjusted so nothing is cut.
  - Nothing in A/B/C may introduce a new visual style, color, font, icon set, or content.
- Show the key states where they exist: empty, loading skeleton, error, filled.
- Primary frame: **iPhone** (393 x 852). Secondary check: one **Android** frame (412 x 915) for the Home and Matches screens.

## Choices made for the design questions, and why (decided by the mentor, open to the student's objection)
| Question | Choice | Why |
|---|---|---|
| Fidelity | High fidelity | The app already exists, so wireframes add nothing; the owner needs pixel-level options. |
| Device | iPhone frame as primary, Android as a secondary check | The owner is moving to an iPhone; Android is where the app was tested so far. |
| Scope | The 5 tab screens + login + partner profile | Those are the screens users spend their time in; secondary screens follow the same components. |
| Variations | 3 per screen, all faithful: exact fit / thumb-friendly / small-phone | The owner asked to stay faithful and only adapt to mobile, so the options differ in mobile fit, not in style. |
| Presentation | Design canvas with artboards side by side | Easiest way to compare variations. |
| Interactivity | Static artboards with states, no prototype flow | Navigation already works in the real app. |
| Style | **Faithful to the original; only adapt to mobile.** Keep the existing tokens, fonts, components and copy; no new colors | This is the owner's explicit instruction: match the original, do not reinvent it. |
| Content | Real Hebrew copy from the app; empty states instead of fake users | Matches the product rule: only real people. |
