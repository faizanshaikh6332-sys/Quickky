import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, Eye, EyeOff, ArrowRight, CheckCircle2, Upload } from 'lucide-react';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

const schema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters'),
  ownerName: z.string().min(2, 'Owner name required'),
  email:     z.string().email('Invalid email'),
  phone:     z.string().min(10, 'Valid 10-digit phone required'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
  category:  z.string().min(1, 'Select a category'),
  city:      z.string().min(2, 'City required'),
  pincode:   z.string().length(6, 'Valid 6-digit pincode required'),
  gstin:     z.string().optional(),
  agree:     z.boolean().refine((v) => v === true, { message: 'You must agree to terms' }),
});

type FormData = z.infer<typeof schema>;

const CATEGORIES = [
  'Fashion & Apparel', 'Footwear', 'Bags & Accessories',
  'Jewellery & Watches', 'Kids Fashion', 'Sportswear',
  'Ethnic Wear', 'Medical & Pharmacy',
];

const PERKS = [
  { icon: '⚡', title: 'Instant Payouts',    desc: 'Get paid within 24 hours of delivery' },
  { icon: '📦', title: 'Easy Logistics',     desc: 'We handle last-mile delivery in 30 minutes' },
  { icon: '📊', title: 'Powerful Analytics', desc: 'Real-time sales & customer insights' },
  { icon: '🛡️', title: 'Seller Protection', desc: 'Full fraud protection & dispute resolution' },
];

export default function SellerRegister() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, trigger, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const nextStep = async () => {
    const valid = await trigger(['storeName', 'ownerName', 'email', 'phone', 'password']);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: FormData) => {
    try {
      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email:    data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.ownerName,
            role:      'seller',
          },
        },
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        toast.error('Registration failed — please try again.');
        return;
      }

      // 2. Upsert profile with seller role
      await (supabase.from('profiles') as any).upsert({
        id:        userId,
        full_name: data.ownerName,
        email:     data.email,
        phone:     data.phone,
        role:      'seller',
      });

      // 3. Create shop with status = 'pending'
      const slug = data.storeName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        + '-' + Date.now();

      const { error: shopError } = await (supabase.from('shops') as any).insert({
        seller_id: userId,
        name:      data.storeName,
        slug,
        category:  data.category,
        city:      data.city,
        pincode:   data.pincode,
        phone:     data.phone,
        email:     data.email,
        gstin:     data.gstin || null,
        status:    'pending',
      });

      if (shopError) {
        console.error('Shop creation error:', shopError);
        // Auth user created — still show success, admin can fix shop later
        toast.error('Account created but shop setup failed. Contact support.');
      } else {
        toast.success('Application submitted! We will review within 24 hours.');
      }

      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.');
    }
  };

  // ── Success Screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Application Submitted! 🎉</h1>
          <p className="text-gray-500 mb-2">
            Your seller application is under review. We'll contact you within 24 hours on your registered email.
          </p>
          <p className="text-sm text-purple-600 mb-6">
            Check your email to confirm your account, then login below.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/">
              <Button variant="secondary">Back to Home</Button>
            </Link>
            <Link to="/seller/login">
              <Button variant="primary">Seller Login</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Registration Form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Left — Perks */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block sticky top-8"
          >
            <Logo size="lg" className="mb-8" />
            <h1 className="text-4xl font-black text-gray-900 dark:text-white leading-tight mb-4">
              Sell on Quickky
              <br />
              <span className="text-gradient">Reach Millions</span>
            </h1>
            <p className="text-gray-500 mb-8 text-lg leading-relaxed">
              Join 10,000+ sellers delivering fashion in 30 minutes. No listing fees. No monthly charges. Just grow.
            </p>
            <div className="space-y-4">
              {PERKS.map(perk => (
                <div key={perk.title} className="flex items-start gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-xl flex-shrink-0">{perk.icon}</div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{perk.title}</h3>
                    <p className="text-sm text-gray-500">{perk.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl text-white">
              <p className="font-bold text-lg">Already a seller?</p>
              <p className="text-white/80 text-sm mb-3">Access your seller dashboard</p>
              <Link to="/seller/login">
                <button className="w-full py-2.5 bg-white text-purple-700 rounded-xl font-bold text-sm hover:bg-purple-50 transition-colors">
                  Seller Login →
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Right — Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl gradient-purple flex items-center justify-center">
                  <Store size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Seller Registration</h2>
                  <p className="text-xs text-gray-500">Step {step} of 2</p>
                </div>
              </div>

              {/* Progress */}
              <div className="flex gap-2 mb-8">
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* ── Step 1: Account ── */}
                {step === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Store Name *</label>
                      <input {...register('storeName')} placeholder="e.g. The Fashion Hub" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/30 transition-all" />
                      {errors.storeName && <p className="text-xs text-red-500 mt-1">{errors.storeName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Owner / Business Name *</label>
                      <input {...register('ownerName')} placeholder="Your full name" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/30 transition-all" />
                      {errors.ownerName && <p className="text-xs text-red-500 mt-1">{errors.ownerName.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Email *</label>
                        <input {...register('email')} type="email" placeholder="you@store.com" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all" />
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Phone *</label>
                        <input {...register('phone')} type="tel" placeholder="10-digit number" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all" />
                        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Password *</label>
                      <div className="relative">
                        <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all pr-10" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                    </div>
                    <Button type="button" onClick={nextStep} variant="primary" className="w-full" size="lg">
                      Continue <ArrowRight size={16} />
                    </Button>
                  </motion.div>
                )}

                {/* ── Step 2: Store Details ── */}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Business Category *</label>
                      <select {...register('category')} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all">
                        <option value="">Select category</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">City *</label>
                        <input {...register('city')} placeholder="Aurangabad" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all" />
                        {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Pincode *</label>
                        <input {...register('pincode')} maxLength={6} placeholder="431001" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all" />
                        {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode.message}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">GSTIN (Optional)</label>
                      <input {...register('gstin')} placeholder="22AAAAA0000A1Z5" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Store Logo</label>
                      <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400 transition-colors">
                        <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Click to upload logo</p>
                        <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
                      </div>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input {...register('agree')} type="checkbox" className="mt-1 accent-purple-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        I agree to Quickky's{' '}
                        <Link to="/terms"   className="text-purple-600 hover:underline">Seller Terms</Link> and{' '}
                        <Link to="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>
                      </span>
                    </label>
                    {errors.agree && <p className="text-xs text-red-500">{errors.agree.message}</p>}
                    <div className="flex gap-3">
                      <Button type="button" onClick={() => setStep(1)} variant="secondary" className="flex-1" size="lg">
                        Back
                      </Button>
                      <Button type="submit" variant="primary" className="flex-1" size="lg" loading={isSubmitting}>
                        Submit Application
                      </Button>
                    </div>
                  </motion.div>
                )}
              </form>

              <p className="text-center text-xs text-gray-400 mt-6">
                Already registered?{' '}
                <Link to="/seller/login" className="text-purple-600 font-semibold hover:underline">Seller Login</Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
