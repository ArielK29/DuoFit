# 🏋️ DuoFit
**Fitness Buddy Matching App · Hebrew-First · React Native + Expo**

---

## Overview
DuoFit connects fitness enthusiasts for real-time workout pairing using location-based matching, streaks, and social gamification.

---

## Branches
- `main` — Production-ready design system & core implementation
- `feature/login` — Authentication flow (phone → OTP → profile)
- `feature/discover` — Partner discovery & matching
- `feature/checkout` — Workout scheduling & check-in

---

## Design System
All design specs are in the root directory:
- `01-DESIGN-TOKENS.json` — Color palette, typography, spacing
- `02-COMPONENT-STATES.md` — Button, input, card states
- `03-EDGE-CASES.md` — Error handling & empty states
- `04-DARK-MODE.md` — Dark-only design validation
- `05-MOTION-SPECS.md` — Animation timing & easing
- `06-RTL-ICONS-SPEC.md` — Hebrew RTL layout & icons
- `07-RESPONSIVE-DECISION.md` — Mobile-only (375-428px)
- `08-DESIGN-SIGN-OFF.md` — Approval for development

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- React Native 0.73+

### Installation
```bash
npx create-expo-app duofit
cd duofit
npm install
npm start
```

---

## Tech Stack
- **Frontend:** React Native + Expo
- **Navigation:** React Navigation
- **State:** Context API (or Zustand)
- **Backend:** TBD (Firebase, Supabase, or custom)
- **Icons:** Lucide React Native
- **Styling:** NativeWind + custom theme

---

## Language
- **Interface:** Hebrew (RTL)
- **Code:** English
- **Documentation:** Both

---

## Status
✅ Design System Complete  
🔄 Development In Progress  
⏳ Testing  
📱 Launch

---

**Built with ❤️ for fitness enthusiasts**
