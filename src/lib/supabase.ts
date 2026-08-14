import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
// Strip /rest/v1/ suffix if it exists so auth, storage, and realtime sub-clients work correctly
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

if (!supabaseUrl || supabaseUrl.includes('placeholder') || !supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
  console.warn(
    '⚠️  Supabase credentials not configured.\n' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
);

export type SupabaseClient = typeof supabase;
