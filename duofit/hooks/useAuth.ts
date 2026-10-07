import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@lib/supabase';
import { authErrorMessage } from '@lib/authErrors';

export type Gender = 'M' | 'F' | 'Other';
export type FitnessLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  avatar?: string;
  gender?: Gender;
  fitnessLevel?: FitnessLevel;
  favoriteActivities: string[];
  createdAt: string;
}

// A signed-in user still has to finish the onboarding form (gender, level, activities).
export function isProfileComplete(user: User | null): boolean {
  return !!user && !!user.gender && !!user.fitnessLevel && user.favoriteActivities.length > 0;
}

interface ProfileRow {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  gender: Gender | null;
  fitness_level: FitnessLevel | null;
  favorite_activities: string[] | null;
  created_at: string;
}

function toUser(row: ProfileRow, email: string): User {
  return {
    id: row.id,
    email,
    name: row.display_name,
    bio: row.bio ?? undefined,
    avatar: row.avatar_url ?? undefined,
    gender: row.gender ?? undefined,
    fitnessLevel: row.fitness_level ?? undefined,
    favoriteActivities: row.favorite_activities ?? [],
    createdAt: row.created_at,
  };
}

export interface ProfileUpdate {
  name?: string;
  bio?: string;
  gender?: Gender;
  fitnessLevel?: FitnessLevel;
  favoriteActivities?: string[];
  // A local file/blob uri picked on this device; uploaded to storage on save.
  localAvatarUri?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  // false until the saved session (if any) has been restored on app start.
  isReady: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => () => void;
  signUp: (email: string, password: string, displayName: string) => Promise<{ needsEmailConfirmation: boolean } | null>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  // Permanently deletes the account and all of its data (App Store requirement).
  deleteAccount: () => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  resendConfirmation: (email: string) => Promise<boolean>;
  saveProfile: (update: ProfileUpdate) => Promise<boolean>;
  setError: (error: string | null) => void;
}

async function loadUser(session: Session | null): Promise<User | null> {
  if (!session) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
  if (error || !data) return null;
  return toUser(data as ProfileRow, session.user.email ?? '');
}

async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const bytes = await response.arrayBuffer();
  const path = `${userId}/avatar-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('avatars').upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

export const useAuth = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isReady: false,
  isLoading: false,
  error: null,

  // Restores the saved session once, then keeps the store in sync with Supabase.
  initialize: () => {
    const apply = async (session: Session | null) => {
      const user = await loadUser(session);
      set({ user, isAuthenticated: !!user, isReady: true });
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));

    // Don't call Supabase methods directly inside this callback (it can deadlock);
    // defer to the next tick.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        apply(session);
      }, 0);
    });

    return () => subscription.subscription.unsubscribe();
  },

  signUp: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: displayName.trim() } },
    });
    set({ isLoading: false });

    if (error) {
      set({ error: authErrorMessage(error) });
      return null;
    }
    // With email confirmation on (recommended: it blocks fake accounts) there is no
    // session until the user clicks the link in the email.
    return { needsEmailConfirmation: !data.session };
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    set({ isLoading: false });
    if (error) {
      set({ error: authErrorMessage(error) });
      return false;
    }
    return true;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, error: null });
  },

  // The server function checks who is calling from the session token and removes the picture files and
  // the account; the database then cascades to every row that belongs to the member.
  deleteAccount: async () => {
    set({ isLoading: true, error: null });
    const { error } = await supabase.functions.invoke('delete-account', { body: { confirm: true } });
    if (error) {
      set({ isLoading: false, error: 'לא הצלחנו למחוק את החשבון. נסה שוב בעוד רגע' });
      return false;
    }
    // The account no longer exists on the server: end the session on this phone only.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    return true;
  },

  sendPasswordReset: async (email) => {
    set({ isLoading: true, error: null });
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    set({ isLoading: false });
    if (error) {
      set({ error: authErrorMessage(error) });
      return false;
    }
    return true;
  },

  resendConfirmation: async (email) => {
    set({ isLoading: true, error: null });
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    set({ isLoading: false });
    if (error) {
      set({ error: authErrorMessage(error) });
      return false;
    }
    return true;
  },

  saveProfile: async (update) => {
    const current = get().user;
    if (!current) return false;
    set({ isLoading: true, error: null });

    try {
      const avatarUrl = update.localAvatarUri ? await uploadAvatar(current.id, update.localAvatarUri) : undefined;

      const row = {
        ...(update.name !== undefined && { display_name: update.name.trim() }),
        ...(update.bio !== undefined && { bio: update.bio.trim() || null }),
        ...(update.gender !== undefined && { gender: update.gender }),
        ...(update.fitnessLevel !== undefined && { fitness_level: update.fitnessLevel }),
        ...(update.favoriteActivities !== undefined && { favorite_activities: update.favoriteActivities }),
        ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
      };

      const { data, error } = await supabase.from('profiles').update(row).eq('id', current.id).select('*').single();
      if (error) throw error;

      set({ user: toUser(data as ProfileRow, current.email), isLoading: false });
      return true;
    } catch (err) {
      set({ isLoading: false, error: authErrorMessage(err as { message?: string }) });
      return false;
    }
  },

  setError: (error) => set({ error }),
}));
