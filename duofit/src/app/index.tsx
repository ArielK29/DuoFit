import { Redirect } from 'expo-router';
import { useAuth, isProfileComplete, isVerified } from '@hooks/useAuth';
import { useIntroStore } from '@hooks/useIntroStore';
import { homeRoute } from '@lib/homeRoute';

export default function Index() {
  const user = useAuth((state) => state.user);
  const introSeen = useIntroStore((state) => state.introSeen);
  const introReady = useIntroStore((state) => state.hydrated);
  // Wait for the saved "intro seen" answer so a returning member never flashes the intro screens.
  if (!user && !introReady) return null;
  return (
    <Redirect
      href={homeRoute({ signedIn: !!user, profileComplete: isProfileComplete(user), verified: isVerified(user), introSeen })}
    />
  );
}
