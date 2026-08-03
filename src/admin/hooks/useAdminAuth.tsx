import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export type AdminRole = 'super_admin' | 'admin' | 'moderator';

interface AdminAuthState {
  isAdmin: boolean;
  isLoading: boolean;
  user: User | null;
  role: AdminRole | null;
  signOut: () => Promise<void>;
}

export function useAdminAuth(redirectOnFail = true): AdminAuthState {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);

  const checkAdminRole = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setIsAdmin(false);
      setUser(null);
      setRole(null);
      setIsLoading(false);
      if (redirectOnFail) navigate('/admin/login', { replace: true });
      return;
    }

    setUser(authUser);

    const { data, error } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', authUser.id)
      .single();

    if (error || !data) {
      setIsAdmin(false);
      setRole(null);
      setIsLoading(false);
      if (redirectOnFail) navigate('/admin/login', { replace: true });
      return;
    }

    setIsAdmin(true);
    setRole(data.role as AdminRole);
    setIsLoading(false);
  }, [navigate, redirectOnFail]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAdminRole(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAdminRole(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [checkAdminRole]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUser(null);
    setRole(null);
    navigate('/admin/login', { replace: true });
  }, [navigate]);

  return { isAdmin, isLoading, user, role, signOut };
}
