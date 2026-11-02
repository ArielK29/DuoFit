import { Redirect } from 'expo-router';
import { useAuth, isProfileComplete, isVerified } from '@hooks/useAuth';
import { homeRoute } from '@lib/homeRoute';

export default function Index() {
  const user = useAuth((state) => state.user);
  return <Redirect href={homeRoute({ signedIn: !!user, profileComplete: isProfileComplete(user), verified: isVerified(user) })} />;
}
