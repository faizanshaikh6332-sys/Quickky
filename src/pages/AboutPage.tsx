import { motion } from 'framer-motion';
import { Zap, Shield, Truck, RefreshCw, Users, Award, Globe, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

const STATS = [
  { value: '2M+', label: 'Happy Customers' },
  { value: '500+', label: 'Premium Brands' },
  { value: '28 Min', label: 'Avg Delivery Time' },
  { value: '50+', label: 'Cities Covered' },
];

const VALUES = [
  { icon: <Zap size={24} />, title: 'Speed First', desc: '30-minute delivery isn\'t a promise, it\'s our standard.' },
  { icon: <Shield size={24} />, title: '100% Authentic', desc: 'Every product verified directly from brand sources.' },
  { icon: <RefreshCw size={24} />, title: 'Easy Returns', desc: 'No-questions 30-day return policy on all orders.' },
  { icon: <Heart size={24} />, title: 'Customer Obsessed', desc: 'Your satisfaction is our only metric of success.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-purple-950 to-blue-950 py-24 text-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-[80px]" />
        </div>
        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-2xl font-black text-white">Quickky</span>
            </div>
            <h1 className="text-5xl font-black text-white mb-4">India's Fastest Fashion</h1>
            <p className="text-xl text-gradient font-bold mb-6">Fashion Delivered in 30 Minutes</p>
            <p className="text-gray-300 leading-relaxed">
              We're reimagining fashion retail. Combining the world's best brands with lightning-fast delivery infrastructure, Quickky brings premium fashion to your doorstep in 30 minutes or less.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm"
              >
                <div className="text-3xl font-black text-gradient mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-bold text-purple-600 uppercase tracking-widest mb-2">Our Story</p>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-6">Born from a simple frustration</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>It started in 2022 when our founders realized that while groceries could be delivered in 10 minutes, fashion still took 3-7 days. Why?</p>
              <p>Fashion is personal. When you want something to wear, you want it now — for that dinner, that meeting, that moment. We built Quickky to solve exactly that.</p>
              <p>Today, we operate dark stores (mini-warehouses) across India's major cities, stocking thousands of products from 500+ brands, enabling genuine 30-minute delivery.</p>
            </div>
            <Link to="/category/women" className="inline-block mt-8">
              <Button variant="primary" size="lg">
                Shop Now <Zap size={16} />
              </Button>
            </Link>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80"
              alt="Our Store"
              className="rounded-3xl w-full object-cover aspect-[4/3]"
            />
            <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Truck size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="font-black text-gray-900 dark:text-white">28 min avg</p>
                  <p className="text-xs text-gray-500">Delivery time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">What We Stand For</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 text-center shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-2xl gradient-purple flex items-center justify-center text-white mx-auto mb-4">
                  {v.icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
