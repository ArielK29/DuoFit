// Shared navigation contract between App.tsx and the login-flow screens.
// A discriminated union so the compiler enforces that `phoneNumber` is present
// exactly when the target screen requires it (VerifyOTP, Profile) and absent
// otherwise — no unchecked string casts, no stale-data footguns.
export type NavigateAction =
  | { screen: 'Login' }
  | { screen: 'VerifyOTP'; phoneNumber: string }
  | { screen: 'Profile'; phoneNumber: string }
  | { screen: 'Discover' };

export type OnNavigate = (action: NavigateAction) => void;
