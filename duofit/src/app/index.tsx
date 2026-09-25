import { Redirect } from 'expo-router';
import { useAuth } from '@hooks/useAuth';

export default function Index() {
  const isAuthenticated = useAuth((state) => state.isAuthenticated);

  return <Redirect href={isAuthenticated ? '/discover' : '/login'} />;
}
