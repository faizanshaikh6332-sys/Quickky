import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Handles the OAuth redirect callback (Google, etc).
 *
 * With PKCE flow, the URL contains a `code` query param that must be exchanged
 * for a session. Supabase JS v2 handles this automatically when
 * `detectSessionInUrl: true` is set, but we need to wait for the
 * `onAuthStateChange` event to fire before navigating away.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Check for error params in the URL hash (Supabase returns errors this way)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const urlParams = new URLSearchParams(window.location.search);

    const error = hashParams.get('error') || urlParams.get('error');
    const errorDescription =
      hashParams.get('error_description') ||
      urlParams.get('error_description');

    if (error) {
      setStatus('error');
      setErrorMsg(errorDescription || error || 'Authentication failed');
      return;
    }

    // Listen for the auth state change that fires when the code is exchanged
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Ensure a profile exists for the new user
          await ensureProfile(session.user);
          setStatus('success');
          // Check if user is an admin to redirect appropriately
          const redirectTarget = await getRedirectTarget(session.user.id);
          setTimeout(() => navigate(redirectTarget, { replace: true }), 800);
        }
      }
    );

    // Fallback: if Supabase already processed the code before the listener
    // was attached, check for an existing session after a brief wait
    const fallbackTimer = setTimeout(async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setStatus('error');
        setErrorMsg(sessionError.message);
      } else if (session) {
        await ensureProfile(session.user);
        setStatus('success');
        const redirectTarget = await getRedirectTarget(session.user.id);
        setTimeout(() => navigate(redirectTarget, { replace: true }), 800);
      } else {
        // No session and no error — might still be processing,
        // give it more time
        const extendedTimer = setTimeout(() => {
          setStatus('error');
          setErrorMsg('Sign-in timed out. Please try again.');
        }, 8000);
        return () => clearTimeout(extendedTimer);
      }
    }, 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800 max-w-sm w-full mx-4 text-center"
      >
        {status === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-cyan-500 via-purple-600 to-amber-500 shadow-lg animate-pulse">
                <img src="/logo.png" alt="Quickky" className="w-full h-full object-contain rounded-full bg-slate-900" />
              </div>
              <div className="absolute -inset-1 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Completing Sign In</h2>
              <p className="text-sm text-gray-500 mt-1">Securely verifying your identity...</p>
            </div>
            <div className="flex gap-1 mt-2">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-purple-500"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Welcome to Quickky! 🎉</h2>
              <p className="text-sm text-gray-500 mt-1">Redirecting you to the homepage...</p>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Sign-In Failed</h2>
              <p className="text-sm text-red-500 mt-1 leading-relaxed">{errorMsg}</p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => navigate('/', { replace: true })}
                className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                Go Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

/**
 * Ensures a profile row exists for the user.
 * The DB trigger should handle this, but if it hasn't fired yet
 * (e.g. race condition or trigger not deployed), we upsert one here.
 * Also syncs Google avatar_url and name if available.
 */
async function ensureProfile(user: { id: string; email?: string; phone?: string; user_metadata?: Record<string, any> }) {
  try {
    const meta = user.user_metadata ?? {};
    const fullName = meta.full_name || meta.name || null;
    const avatarUrl = meta.avatar_url || meta.picture || null;

    const { data: existing } = await supabase
      .from('profiles')
      .select('id, avatar_url, full_name')
      .eq('id', user.id)
      .single();

    if (!existing) {
      // Profile doesn't exist yet — insert
      await (supabase.from('profiles') as any).insert({
        id: user.id,
        full_name: fullName,
        email: user.email || null,
        phone: user.phone || null,
        avatar_url: avatarUrl,
      });
    } else {
      // Profile exists — update avatar/name if they came from Google and are currently empty
      const updates: Record<string, string> = {};
      if (!existing.avatar_url && avatarUrl) updates.avatar_url = avatarUrl;
      if (!existing.full_name && fullName) updates.full_name = fullName;

      if (Object.keys(updates).length > 0) {
        await (supabase.from('profiles') as any).update(updates).eq('id', user.id);
      }
    }
  } catch (err) {
    // Non-critical — profile will be created/updated on next page load
    console.warn('Profile sync warning:', err);
  }
}

/**
 * Determines where to redirect the user after OAuth callback.
 * Admins go to /admin/dashboard, everyone else goes to /.
 */
async function getRedirectTarget(userId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    if (data?.role) return '/admin/dashboard';
  } catch {
    // Not an admin — fall through
  }
  return '/';
}
