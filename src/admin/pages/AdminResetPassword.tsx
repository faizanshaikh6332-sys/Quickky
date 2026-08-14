import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, AlertTriangle, Loader2, KeyRound, Mail } from 'lucide-react';
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

  // Manual OTP / Code verification fallback mode
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const navigate = useNavigate();

  // Helper to verify user is an authorized admin
  const verifyAdminRole = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        console.warn('[Quickky Admin Reset] User is not in admin_roles table:', userId);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    console.log('[Quickky Admin Reset 1/4] Component mounted.');
    console.log('[Quickky Admin Reset 2/4] URL Search:', window.location.search, '| URL Hash:', window.location.hash);

    // 1. Check for error parameters in URL hash or search (e.g. link expired / invalid token)
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

    // 2. Subscribe to Auth State Changes (captures PASSWORD_RECOVERY & SIGNED_IN events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Quickky Admin Reset 3/4] Auth Event:', event, '| Session present:', !!session, '| User ID:', session?.user?.id);

      if (!isMounted) return;

      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        // Verify admin authorization
        const isAdmin = await verifyAdminRole(session.user.id);
        if (!isAdmin) {
          console.warn('[Quickky Admin Reset] Session exists but user is not in admin_roles');
          setSessionError('Access denied. You are not authorized as an admin.');
          setHasValidSession(false);
          setVerifyingSession(false);
          await supabase.auth.signOut();
          return;
        }

        console.log('[Quickky Admin Reset] Valid admin recovery session confirmed via event:', event);
        setHasValidSession(true);
        setSessionError(null);
        setVerifyingSession(false);
      }
    });

    // 3. Process URL tokens / PKCE code / Session
    const initSessionCheck = async () => {
      try {
        // Check for token_hash or token parameter
        const tokenHash = urlParams.get('token_hash') || urlParams.get('token') || hashParams.get('token');
        const code = urlParams.get('code');

        if (tokenHash) {
          console.log('[Quickky Admin Reset] Found token_hash in URL. Verifying OTP...');
          const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          if (!verifyError && verifyData?.session) {
            const isAdmin = await verifyAdminRole(verifyData.session.user.id);
            if (isAdmin && isMounted) {
              setHasValidSession(true);
              setSessionError(null);
              setVerifyingSession(false);
              return;
            }
          }
        }

        if (code) {
          console.log('[Quickky Admin Reset] Found code in URL. Exchanging for session...');
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.warn('[Quickky Admin Reset] PKCE exchangeCodeForSession failed:', exchangeError.message);
            
            // Try verifyOtp fallback using code as token_hash
            const { data: fallbackOtpData, error: fallbackOtpErr } = await supabase.auth.verifyOtp({
              token_hash: code,
              type: 'recovery',
            });

            if (!fallbackOtpErr && fallbackOtpData?.session) {
              const isAdmin = await verifyAdminRole(fallbackOtpData.session.user.id);
              if (isAdmin && isMounted) {
                setHasValidSession(true);
                setSessionError(null);
                setVerifyingSession(false);
                return;
              }
            }

            // PKCE code verifier missing (cross-device/browser link click)
            if (isMounted) {
              console.warn('[Quickky Admin Reset] Enabling manual OTP fallback mode');
              setSessionError('Link opened in a different browser. Enter your admin email and 6-digit recovery code below.');
              setShowOtpInput(true);
              setHasValidSession(false);
              setVerifyingSession(false);
            }
            return;
          }

          if (exchangeData?.session) {
            const isAdmin = await verifyAdminRole(exchangeData.session.user.id);
            if (!isAdmin) {
              if (isMounted) {
                setSessionError('Access denied. You are not authorized as an admin.');
                setHasValidSession(false);
                setVerifyingSession(false);
              }
              await supabase.auth.signOut();
              return;
            }

            if (isMounted) {
              setHasValidSession(true);
              setSessionError(null);
              setVerifyingSession(false);
              return;
            }
          }
        }

        // Direct session check
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session) {
          const isAdmin = await verifyAdminRole(session.user.id);
          if (isAdmin && isMounted) {
            setHasValidSession(true);
            setSessionError(null);
            setVerifyingSession(false);
            return;
          }
        }

        if (sessionError && isMounted) {
          setSessionError(sessionError.message);
        }
      } catch (err: any) {
        console.error('[Quickky Admin Reset] Session check exception:', err);
        if (isMounted) {
          setSessionError(err.message || 'Session verification failed');
        }
      }
    };

    initSessionCheck();

    // Fallback timer
    const timer = setTimeout(() => {
      if (isMounted) {
        setVerifyingSession(false);
      }
    }, 2000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Handle Manual OTP / 6-digit Code verification
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!otpEmail.trim() || !otpCode.trim()) {
      const err = 'Please enter both your admin email and recovery code';
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    setVerifyingOtp(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: otpEmail.trim(),
        token: otpCode.trim(),
        type: 'recovery',
      });

      if (error) {
        console.error('[Quickky Admin Reset] verifyOtp error:', error);
        setErrorMessage(error.message || 'Invalid or expired recovery code');
        toast.error(error.message || 'Invalid or expired recovery code');
        setVerifyingOtp(false);
        return;
      }

      if (data?.session) {
        const isAdmin = await verifyAdminRole(data.session.user.id);
        if (!isAdmin) {
          const err = 'Access denied. You are not authorized as an admin.';
          setErrorMessage(err);
          toast.error(err);
          await supabase.auth.signOut();
          setVerifyingOtp(false);
          return;
        }

        toast.success('Recovery code verified!');
        setHasValidSession(true);
        setShowOtpInput(false);
        setSessionError(null);
      } else {
        setErrorMessage('Verification failed. Please check your email and code.');
        toast.error('Verification failed. Please check your email and code.');
      }
    } catch (err: any) {
      console.error('[Quickky Admin Reset] OTP Catch error:', err);
      setErrorMessage(err.message || 'Failed to verify recovery code');
      toast.error(err.message || 'Failed to verify recovery code');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    console.log('[Quickky Admin Reset] Form submitted. New password length:', newPassword.length);

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
        const errStr = 'Auth session missing or expired. Please request a new password reset link or enter your code.';
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
          ) : showOtpInput ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                  <KeyRound size={24} />
                </div>
                <h2 className="text-lg font-bold text-white">Enter Recovery Code</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Enter your admin email and the 6-digit code sent to your inbox to reset your password on this device.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle size={16} className="flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wide mb-1">
                    Admin Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder="faizanshaikh6332@gmail.com"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm outline-none focus:border-purple-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wide mb-1">
                    6-Digit Code / Token
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm outline-none focus:border-purple-500 transition-all font-mono tracking-wider"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifyingOtp}
                  className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {verifyingOtp ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Verifying Code...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  onClick={() => navigate('/admin/login', { replace: true })}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Back to Admin Login
                </button>
              </div>
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
              
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setShowOtpInput(true)}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-purple-600/30 border border-purple-500/50 hover:bg-purple-600/50 transition-all text-xs flex justify-center items-center gap-2"
                >
                  <KeyRound size={14} /> Enter 6-Digit Recovery Code
                </button>
                <button
                  onClick={() => navigate('/admin/login', { replace: true })}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-gray-300 border border-white/10 hover:bg-white/5 transition-all text-xs flex justify-center items-center gap-2"
                >
                  Back to Admin Login <ArrowRight size={14} />
                </button>
              </div>
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
