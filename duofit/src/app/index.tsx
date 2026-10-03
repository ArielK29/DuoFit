import { Redirect } from 'expo-router';
import { useAuth, isProfileComplete } from '@hooks/useAuth';

export default function Index() {
  const user = useAuth((state) => state.user);

  if (!user) return <Redirect href="/login" />;
  return <Redirect href={isProfileComplete(user) ? '/discover' : '/profile-setup'} />;
}
