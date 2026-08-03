import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches profile for a given user. If profile doesn't exist yet
   * (first Google/OAuth login), creates one using auth metadata.
   */
  const fetchOrCreateProfile = useCallback(async (authUser: User) => {
    // Try to fetch existing profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (data) {
      setProfile(data);

      // Sync Google avatar/name if they're currently missing in the profile
      const meta = authUser.user_metadata ?? {};
      const googleAvatar = meta.avatar_url || meta.picture;
      const googleName = meta.full_name || meta.name;
      const updates: Record<string, string> = {};

      if (!data.avatar_url && googleAvatar) updates.avatar_url = googleAvatar;
      if (!data.full_name && googleName) updates.full_name = googleName;
      if (!data.email && authUser.email) updates.email = authUser.email;

      if (Object.keys(updates).length > 0) {
        const { data: updated } = await (supabase.from('profiles') as any)
          .update(updates)
          .eq('id', authUser.id)
          .select('*')
          .single();
        if (updated) setProfile(updated);
      }
      return;
    }

    // Profile doesn't exist — create one (handles case where DB trigger hasn't fired yet)
    if (error?.code === 'PGRST116') { // "no rows returned" from .single()
      const meta = authUser.user_metadata ?? {};
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          full_name: meta.full_name || meta.name || null,
          email: authUser.email || null,
          phone: authUser.phone || null,
          avatar_url: meta.avatar_url || meta.picture || null,
        })
        .select('*')
        .single();

      setProfile(newProfile);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchOrCreateProfile(user);
  }, [user, fetchOrCreateProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchOrCreateProfile(s.user);
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // On initial sign-in or token refresh, sync profile
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
            await fetchOrCreateProfile(newSession.user);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchOrCreateProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
