import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, ShoppingBag, Star, Shield } from 'lucide-react';
import Button from '@/components/ui/Button';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=90';

const FLOATING_CARDS = [
  {
    icon: '⚡',
    title: '30 Min Delivery',
    subtitle: 'Guaranteed',
    bg: 'from-purple-900/80 to-blue-900/80',
    delay: '0s',
  },
  {
    icon: '⭐',
    title: '4.9 Rated',
    subtitle: '2M+ Happy Customers',
    bg: 'from-amber-900/80 to-orange-900/80',
    delay: '2s',
  },
  {
    icon: '🛡️',
    title: '100% Authentic',
    subtitle: 'Certified Products',
    bg: 'from-green-900/80 to-emerald-900/80',
    delay: '4s',
  },
];

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[90vh] flex items-center overflow-hidden"
    >
      {/* Background */}
      <motion.div style={{ y }} className="absolute inset-0 z-0">
        <img
          src={HERO_IMAGE}
          alt="Hero Fashion"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </motion.div>

      {/* Animated background orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-float" />
        <div
          className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-[80px] animate-float"
          style={{ animationDelay: '3s' }}
        />
      </div>

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full py-20"
      >
        <div className="max-w-2xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-white text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <Zap size={14} className="text-purple-300" />
            India's #1 30-Minute Fashion Delivery
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-4 hero-text-shadow"
          >
            Fashion
            <br />
            <span className="text-gradient">in 30 Minutes</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg text-gray-300 mb-8 leading-relaxed max-w-lg"
          >
            Shop premium fashion from top global brands — Nike, Gucci, Zara, Levi's and more — delivered to your door in 30 minutes.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 mb-10"
          >
            <Link to="/category/women">
              <Button size="lg" variant="primary" className="shadow-2xl shadow-purple-500/40">
                <ShoppingBag size={18} />
                Shop Now
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/category/luxury">
              <button className="inline-flex items-center gap-2 px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 rounded-xl font-semibold transition-all">
                ✨ Luxury Collection
              </button>
            </Link>
          </motion.div>

          {/* Trust Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex items-center gap-6 flex-wrap"
          >
            {[
              { value: '2M+', label: 'Happy Customers' },
              { value: '500+', label: 'Top Brands' },
              { value: '30 Min', label: 'Avg Delivery' },
              { value: '4.9★', label: 'App Rating' },
            ].map(stat => (
              <div key={stat.value} className="text-center">
                <div className="text-xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Floating Cards */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4">
          {FLOATING_CARDS.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.15 }}
              className={`glass bg-gradient-to-br ${card.bg} px-5 py-4 rounded-2xl flex items-center gap-3 min-w-[180px] animate-float`}
              style={{ animationDelay: card.delay }}
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
                {card.icon}
              </div>
              <div>
                <div className="text-white font-bold text-sm">{card.title}</div>
                <div className="text-gray-300 text-xs">{card.subtitle}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-gray-400 uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-5 h-8 border-2 border-white/30 rounded-full flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 bg-white rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
