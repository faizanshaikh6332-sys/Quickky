import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Store, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function SellerLogin() {
  const navigate = useNavigate();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message || 'Login failed. Check your credentials.');
      setLoading(false);
      return;
    }

    // Check if this user has a seller profile / shop
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle() as { data: { role: string } | null };

    if (profile?.role === 'admin') {
      toast.error('Please use the Admin portal at /admin');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    toast.success('Welcome back! Loading your dashboard…');
    navigate('/seller/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Logo */}
          <Logo size="lg" className="justify-center mb-8" />

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-gray-800">
            {/* Header */}
            <div className="flex items-center gap-3 mb-7">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center">
                <Store size={22} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 dark:text-white">Seller Login</h1>
                <p className="text-xs text-gray-500">Access your seller dashboard</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seller@yourstore.com"
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/30 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) { toast.error('Enter your email first'); return; }
                      const { error } = await supabase.auth.resetPasswordForEmail(email);
                      if (error) toast.error(error.message);
                      else toast.success('Password reset email sent!');
                    }}
                    className="text-xs text-purple-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/30 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                size="lg"
                loading={loading}
              >
                Login to Dashboard <ArrowRight size={16} />
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-sm text-gray-500">
                Don't have a seller account?{' '}
                <Link to="/seller/register" className="text-purple-600 font-bold hover:underline">
                  Register Now
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            <Link to="/" className="hover:text-purple-600 transition-colors">← Back to Quickky</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
