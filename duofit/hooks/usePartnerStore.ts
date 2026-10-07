import { create } from 'zustand';
import { supabase } from '@lib/supabase';
import { useAuth } from '@hooks/useAuth';
import type { Partner } from '@hooks/usePartnerMatching';
import type { FitnessLevel } from '@hooks/useAuth';

// Real members, loaded from the `profiles` table. Row-level security decides what
// comes back: only OTHER people's complete profiles, public columns only (see
// supabase/migrations/20261007_profiles_partner_discovery.sql).
interface DiscoverRow {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  gender: 'M' | 'F' | 'Other';
  fitness_level: FitnessLevel;
  favorite_activities: string[];
}

const COLUMNS = 'id, display_name, bio, avatar_url, gender, fitness_level, favorite_activities';
const PAGE_SIZE = 100;

function toPartner(row: DiscoverRow): Partner {
  return {
    id: row.id,
    name: row.display_name,
    gender: row.gender,
    bio: row.bio ?? '',
    fitnessLevel: row.fitness_level,
    activities: row.favorite_activities ?? [],
    avatar: row.avatar_url ?? undefined,
  };
}

interface PartnerStoreState {
  partners: Partner[];
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  load: () => Promise<void>;
  reset: () => void;
}

export const usePartnerStore = create<PartnerStoreState>()((set, get) => ({
  partners: [],
  isLoading: false,
  hasLoaded: false,
  error: null,

  load: async () => {
    const me = useAuth.getState().user?.id;
    if (!me || get().isLoading) return;
    set({ isLoading: true, error: null });
    // A member's own row is readable too (owner policy), so it is excluded here: nobody is their own partner.
    const { data, error } = await supabase
      .from('profiles')
      .select(COLUMNS)
      .neq('id', me)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (error) {
      set({ isLoading: false, hasLoaded: true, error: error.message });
      return;
    }
    set({ partners: (data as DiscoverRow[]).map(toPartner), isLoading: false, hasLoaded: true });
  },

  reset: () => set({ partners: [], isLoading: false, hasLoaded: false, error: null }),
}));
