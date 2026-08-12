import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, Eye, EyeOff, ArrowRight, Loader2, Zap, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import Logo from '@/components/ui/Logo';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Tab = 'phone' | 'email' | 'google';
type PhoneStep = 'number' | 'otp';

// 6-box OTP Input
function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, '').split('');

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = digits.map((d, idx) => idx === i ? '' : d).join('');
        onChange(next.slice(0, 6));
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
      }
    }
  };

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = digits.map((d, idx) => idx === i ? digit : d).join('');
    onChange(next.slice(0, 6));
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className="w-11 h-12 text-center text-lg font-black border-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/30 border-gray-200 dark:border-gray-700"
        />
      ))}
    </div>
  );
}

export default function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>('phone');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('number');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const resetState = () => {
    setPhone(''); setOtp(''); setEmail(''); setPassword('');
    setPhoneStep('number'); setTab('phone'); setIsSignUp(false); setFullName('');
  };

  const handleClose = () => { resetState(); onClose(); };

  // ── Phone OTP ─────────────────────────────────────
  const sendOTP = async () => {
    const formatted = phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`;
    if (formatted.length < 10) return toast.error('Enter a valid phone number');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setPhoneStep('otp');
      setResendTimer(30);
      toast.success('OTP sent! Check your messages.');
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    const formatted = phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: formatted,
      token: otp,
      type: 'sms',
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome to Quickky! 🎉');
      onSuccess?.();
      handleClose();
    }
  };

  // ── Email Auth ────────────────────────────────────
  const handleEmail = async () => {
    if (!email.trim() || !password) return toast.error('Please enter email and password');
    if (isSignUp && !fullName.trim()) return toast.error('Please enter your full name');

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role: 'customer',
            },
          },
        });
        setLoading(false);

        if (error) {
          toast.error(error.message);
        } else if (data?.session) {
          toast.success('Account created! Welcome to Quickky 🎉');
          onSuccess?.();
          handleClose();
        } else if (data?.user) {
          toast.success('Account created! Please check your email for a confirmation link.');
          handleClose();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        setLoading(false);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back! 👋');
          onSuccess?.();
          handleClose();
        }
      }
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || 'Authentication failed. Please try again.');
    }
  };

  // ── Google OAuth ──────────────────────────────────
  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('[Quickky Auth] Google sign-in error:', error);
        toast.error(error.message || 'Google sign-in failed. Please try again.');
        setLoading(false);
      }
      // If successful, user is redirected to Google — no need to setLoading(false)
    } catch (err: any) {
      console.error('[Quickky Auth] Unexpected Google sign-in error:', err);
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
          onClick={e => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-purple-600 to-blue-600 p-6 text-white">
              <Logo size="sm" variant="light" asLink={false} className="mb-2" />
              <h2 className="text-2xl font-black">Welcome back!</h2>
              <p className="text-white/70 text-sm">Sign in to access your account</p>
              <button onClick={handleClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              {/* Tab Selector */}
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6">
                {[{ id: 'phone' as const, label: '📱 Phone', icon: Phone }, { id: 'email' as const, label: '✉️ Email', icon: Mail }].map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setPhoneStep('number'); }}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      tab === t.id
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* ── PHONE TAB ── */}
                {tab === 'phone' && (
                  <motion.div key="phone" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                    {phoneStep === 'number' ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Mobile Number</label>
                          <div className="flex gap-2">
                            <div className="flex items-center gap-2 px-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200">
                              🇮🇳 +91
                            </div>
                            <input
                              type="tel"
                              value={phone}
                              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              placeholder="10-digit number"
                              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/30 transition-all"
                            />
                          </div>
                        </div>
                        <button
                          onClick={sendOTP}
                          disabled={loading || phone.length < 10}
                          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-sm hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                          {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="text-center">
                          <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-3">
                            <Phone size={24} className="text-green-500" />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            OTP sent to <span className="font-bold">+91 {phone}</span>
                          </p>
                        </div>
                        <OTPInput value={otp} onChange={setOtp} />
                        <button
                          onClick={verifyOTP}
                          disabled={loading || otp.length < 6}
                          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-sm hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                          {loading ? 'Verifying...' : 'Verify & Login'}
                        </button>
                        <div className="text-center">
                          {resendTimer > 0 ? (
                            <p className="text-xs text-gray-400">Resend OTP in {resendTimer}s</p>
                          ) : (
                            <button onClick={sendOTP} className="text-xs text-purple-600 font-semibold hover:underline">
                              Resend OTP
                            </button>
                          )}
                          <button onClick={() => { setPhoneStep('number'); setOtp(''); }} className="block mx-auto mt-2 text-xs text-gray-400 hover:text-gray-600">Change number</button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── EMAIL TAB ── */}
                {tab === 'email' && (
                  <motion.div key="email" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                      {[{ label: 'Sign In', v: false }, { label: 'Sign Up', v: true }].map(o => (
                        <button key={o.label} onClick={() => setIsSignUp(o.v)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSignUp === o.v ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'
                        }`}>{o.label}</button>
                      ))}
                    </div>
                    {isSignUp && (
                      <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all" />
                    )}
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all" />
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button
                      onClick={handleEmail}
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-sm hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                <span className="text-xs text-gray-400">or continue with</span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              </div>

              {/* Google */}
              <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <p className="text-center text-xs text-gray-400 mt-4">
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-purple-600 hover:underline">Terms</a> &{' '}
                <a href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</a>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
