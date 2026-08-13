import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [verifyingSession, setVerifyingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    console.log('[Quickky Admin Reset 1/4] Component mounted.');
    console.log('[Quickky Admin Reset 2/4] URL Search:', window.location.search, '| URL Hash:', window.location.hash);

    // 1. Check for error params in URL hash or search (e.g. link expired / invalid token)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam =
      hashParams.get('error_description') ||
      urlParams.get('error_description') ||
      hashParams.get('error') ||
      urlParams.get('error');

    if (errorParam) {
      const decodedErr = decodeURIComponent(errorParam);
      console.warn('[Quickky Admin Reset] Found URL error param:', decodedErr);
      if (isMounted) {
        setSessionError(decodedErr);
        setHasValidSession(false);
        setVerifyingSession(false);
      }
      return;
    }

    // 2. Subscribe to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Quickky Admin Reset 3/4] Auth Event:', event, '| Session present:', !!session, '| User ID:', session?.user?.id);

      if (!isMounted) return;

      if (event === 'PASSWORD_RECOVERY' || (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED'))) {
        console.log('[Quickky Admin Reset] Valid recovery session confirmed via event:', event);
        setHasValidSession(true);
        setSessionError(null);
        setVerifyingSession(false);
      }
    });

    // 3. Process PKCE code or check existing session
    const initSessionCheck = async () => {
      try {
        const code = urlParams.get('code');
        if (code) {
          console.log('[Quickky Admin Reset] Found PKCE authorization code in URL. Exchanging for session...');
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('[Quickky Admin Reset] exchangeCodeForSession failed:', exchangeError);
            if (isMounted) {
              setSessionError(exchangeError.message);
              setHasValidSession(false);
              setVerifyingSession(false);
            }
            return;
          }
          if (exchangeData?.session && isMounted) {
            console.log('[Quickky Admin Reset] PKCE code exchanged successfully for user:', exchangeData.session.user.id);
            setHasValidSession(true);
            setSessionError(null);
            setVerifyingSession(false);
            return;
          }
        }

        // Fallback: check session directly
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('[Quickky Admin Reset] getSession error:', sessionError);
          if (isMounted) {
            setSessionError(sessionError.message);
            setHasValidSession(false);
            setVerifyingSession(false);
          }
          return;
        }

        if (session && isMounted) {
          console.log('[Quickky Admin Reset] Active session found for user:', session.user.id);
          setHasValidSession(true);
          setSessionError(null);
          setVerifyingSession(false);
        }
      } catch (err: any) {
        console.error('[Quickky Admin Reset] Unexpected session check error:', err);
        if (isMounted) {
          setSessionError(err.message || 'Session verification failed');
          setHasValidSession(false);
          setVerifyingSession(false);
        }
      }
    };

    initSessionCheck();

    // Fallback timer to stop spinner after 2 seconds if no event/code resolves
    const timer = setTimeout(() => {
      if (isMounted) {
        setVerifyingSession((prev) => {
          if (prev) {
            console.warn('[Quickky Admin Reset] Verification timer expired without session.');
          }
          return false;
        });
      }
    }, 2000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    console.log('[Quickky Admin Reset 4/4] Form submitted. New password length:', newPassword.length);

    if (!newPassword || newPassword.length < 8) {
      const err = 'Password must be at least 8 characters long';
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    if (newPassword !== confirmPassword) {
      const err = 'Passwords do not match';
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    setLoading(true);
    try {
      // Re-verify session is active immediately before updateUser()
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      
      console.log('[Quickky Admin Reset] Pre-update session check - Session active:', !!session, 'Error:', sessionErr?.message);

      if (sessionErr || !session) {
        const errStr = 'Auth session missing or expired. Please request a new password reset link.';
        console.error('[Quickky Admin Reset]', errStr);
        setErrorMessage(errStr);
        toast.error(errStr);
        setHasValidSession(false);
        setLoading(false);
        return;
      }

      // Execute updateUser
      console.log('[Quickky Admin Reset] Calling supabase.auth.updateUser({ password })...');
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      console.log('[Quickky Admin Reset] updateUser result - Data:', data, '| Error:', error);

      if (error) {
        console.error('[Quickky Admin Reset] updateUser failed:', error);
        setErrorMessage(error.message || 'Failed to update password');
        toast.error(error.message || 'Failed to update password');
      } else if (data?.user) {
        console.log('[Quickky Admin Reset] Password updated successfully for user:', data.user.id);
        toast.success('Password updated successfully');
        setSuccess(true);
        
        // Sign out recovery session so user logs in cleanly with new password
        await supabase.auth.signOut();

        setTimeout(() => {
          navigate('/admin/login', { replace: true });
        }, 2000);
      } else {
        const errStr = 'Failed to update password. No user returned.';
        console.error('[Quickky Admin Reset]', errStr);
        setErrorMessage(errStr);
        toast.error(errStr);
      }
    } catch (err: any) {
      console.error('[Quickky Admin Reset] Unexpected catch block error:', err);
      const msg = err.message || 'An unexpected error occurred while resetting password.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md"
      >
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight">Set New Password</h1>
            <p className="text-purple-400 mt-1 font-medium text-sm text-center">
              Quickky Admin Security
            </p>
          </div>

          {verifyingSession ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
              <p className="text-sm text-gray-300">Verifying password reset link...</p>
            </div>
          ) : !hasValidSession ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-white">Invalid or Expired Link</h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                {sessionError || 'This password reset link is invalid or has expired. Please request a new link from the login page.'}
              </p>
              <button
                onClick={() => navigate('/admin/login', { replace: true })}
                className="mt-4 w-full py-3 px-4 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all flex justify-center items-center gap-2"
              >
                Back to Admin Login <ArrowRight size={16} />
              </button>
            </div>
          ) : success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 text-green-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-white">Password Updated Successfully</h2>
              <p className="text-sm text-gray-400">Redirecting to Admin Login...</p>
              <button
                onClick={() => navigate('/admin/login', { replace: true })}
                className="mt-4 w-full py-3 px-4 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all flex justify-center items-center gap-2"
              >
                Go to Sign In <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle size={16} className="flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wide">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wide">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
