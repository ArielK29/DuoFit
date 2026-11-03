// Where the app root ("/") sends the member. Every screen the member may reach has to be open for them: the screens
// are guarded in _layout.tsx (login, profile form, identity check, then the app), and sending a member to a closed one
// leaves a blank screen. This is what happened after a password reset: that screen stays open while signed in, so the
// router has no "fallback" to jump to.
export type HomeRoute = '/welcome' | '/login' | '/profile-setup' | '/verify-identity' | '/discover';

// A signed-out member who has not seen the three intro screens yet starts there (introSeen defaults to true: not asked).
export function homeRoute(state: { signedIn: boolean; profileComplete: boolean; verified: boolean; introSeen?: boolean }): HomeRoute {
  if (!state.signedIn) return state.introSeen === false ? '/welcome' : '/login';
  if (!state.profileComplete) return '/profile-setup';
  if (!state.verified) return '/verify-identity';
  return '/discover';
}
