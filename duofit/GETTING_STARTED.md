# DuoFit - Getting Started

Welcome to DuoFit! This guide will help you set up and run the project locally.

---

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Expo CLI** installed globally
- **npm** or **yarn** package manager

---

## Installation

### 1. Install dependencies
```bash
cd duofit
npm install
```

### 2. Install Expo CLI globally (if not already)
```bash
npm install -g expo-cli
```

### 3. Create environment file
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

---

## Running the App

### Start the development server
```bash
npm start
```

This opens the Expo dashboard in your terminal. You can:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app (iOS/Android)

### Run on specific platform
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

---

## Project Structure

```
duofit/
├── screens/              # App screens
│   ├── login/           # Authentication flows
│   ├── discover/        # Partner discovery
│   ├── dashboard/       # User dashboard
│   └── chat/            # Messaging
│
├── components/          # Reusable components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── ...
│
├── hooks/               # Custom React hooks
│   ├── useAuth.ts
│   ├── useLocation.ts
│   └── ...
│
├── constants/           # App constants
│   ├── colors.ts        # Design tokens
│   ├── spacing.ts
│   └── typography.ts
│
├── styles/              # Global styles
│   └── theme.ts         # Theme configuration
│
├── utils/               # Utility functions
│   └── ...
│
└── app.json            # Expo configuration
```

---

## Design System

**All UI must follow the design specification:**
- Reference: `../01-DESIGN-TOKENS.json`
- Colors: Dark mode only (#050505 bg, #F5F5F5 text)
- Typography: Anton, Heebo (Hebrew), Space Grotesk
- Layout: RTL (Right-to-Left) for Hebrew
- Spacing: 8px base unit
- Animations: 300ms standard, ease-out

---

## Development Guidelines

### Code Style
- **Language:** English (code), Hebrew (UI text)
- **Naming:** PascalCase for components, camelCase for functions/hooks
- **Type Safety:** Use TypeScript for all files

### Testing
Run before committing:
```bash
npm run lint
npx tsc --noEmit
```

### Git Workflow
1. Create feature branch: `git checkout -b feature/xyz`
2. Make changes
3. Commit: `git commit -m "feat: add xyz"`
4. Push: `git push origin feature/xyz`
5. Create Pull Request on GitHub

---

## Troubleshooting

### Port 8081 already in use
```bash
# Kill the process
lsof -ti:8081 | xargs kill -9

# Or use different port
expo start --localhost
```

### Dependencies out of sync
```bash
npm install --fix
expo doctor
```

### Simulator/Emulator issues
- Restart the simulator/emulator
- Clear Expo cache: `expo start --clear`
- Reinstall node_modules: `rm -rf node_modules && npm install`

---

## Next Steps

1. ✅ Set up local environment
2. ✅ Run `npm start`
3. 📝 Open `screens/login/LoginScreen.tsx` to start editing
4. 🎨 Reference design tokens in `constants/colors.ts`
5. 🚀 Build features following the design spec

---

**Need Help?**
- Expo Docs: https://docs.expo.dev/
- React Native: https://reactnative.dev/
- Design Spec: Check `../01-DESIGN-TOKENS.json` in parent directory
