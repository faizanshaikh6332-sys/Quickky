import HeroSection from '@/components/home/HeroSection';
import CategorySection from '@/components/home/CategorySection';
import TrendingProducts from '@/components/home/TrendingProducts';
import FlashSale from '@/components/home/FlashSale';
import BrandsSection from '@/components/home/BrandsSection';
import PremiumBanner from '@/components/home/PremiumBanner';
import { StoresRow } from '@/components/home/StoresSection';
import { motion } from 'framer-motion';
import { newArrivals } from '@/data';
import { getNearbyStores, getPopularStores, getFashionStores, getMedicalStores } from '@/data/stores';
import ProductCard from '@/components/product/ProductCard';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <CategorySection />

      <TrendingProducts />

      <FlashSale />

      <PremiumBanner />

      {/* ── Marketplace Store Sections ─────────────────────────── */}
      <section className="py-12 bg-white dark:bg-gray-950">
        <StoresRow
          title="Nearby Stores"
          subtitle="Open Now"
          accentColor="text-green-600"
          icon="📍"
          stores={getNearbyStores(6)}
        />
        <StoresRow
          title="Popular Stores"
          subtitle="Most Loved"
          accentColor="text-amber-500"
          icon="⭐"
          stores={getPopularStores(6)}
        />
        <StoresRow
          title="Top Fashion Stores"
          subtitle="Style Forward"
          accentColor="text-purple-600"
          icon="👗"
          stores={getFashionStores(6)}
        />
        <StoresRow
          title="Medical Stores"
          subtitle="Health & Wellness"
          accentColor="text-blue-600"
          icon="💊"
          stores={getMedicalStores(4)}
        />
      </section>

      {/* New Arrivals */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-purple-500" />
                <p className="text-sm font-semibold text-purple-500 uppercase tracking-widest">Just Dropped</p>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white">New Arrivals</h2>
            </div>
            <Link
              to="/new-arrivals"
              className="flex items-center gap-1 text-sm font-semibold text-purple-600 hover:text-purple-700"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.slice(0, 4).map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </div>
      </section>

      <BrandsSection />

      {/* Instagram-style fashion stories */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-pink-500 uppercase tracking-widest mb-1">Style Inspo</p>
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white">Fashion Stories</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80', tag: 'Summer Vibes' },
            { image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&q=80', tag: 'Street Style' },
            { image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', tag: 'Sneaker Head' },
            { image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80', tag: 'Bag Goals' },
            { image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80', tag: 'Watch Game' },
          ].map((story, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group"
            >
              <img
                src={story.image}
                alt={story.tag}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-xs font-bold">#{story.tag.replace(' ', '')}</p>
              </div>
              <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 border-2 border-white" />
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* App Download Banner */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <div className="relative overflow-hidden rounded-3xl gradient-dark p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-600/30 rounded-full blur-[80px]" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-600/30 rounded-full blur-[60px]" />
          </div>
          <div className="relative z-10 text-white text-center md:text-left">
            <p className="text-purple-300 font-semibold text-sm mb-2">📱 Download the App</p>
            <h2 className="text-3xl md:text-4xl font-black mb-2">Fashion at your<br />fingertips</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-sm">Get exclusive app-only offers, track your orders live, and enjoy 30-minute delivery from the Quickky app.</p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button className="flex items-center gap-3 bg-white text-gray-900 rounded-2xl px-5 py-3 font-bold text-sm hover:bg-gray-100 transition-colors shadow-lg">
                <span className="text-2xl">🍎</span>
                <div className="text-left">
                  <div className="text-xs text-gray-500">Download on the</div>
                  <div className="text-sm font-black">App Store</div>
                </div>
              </button>
              <button className="flex items-center gap-3 bg-white text-gray-900 rounded-2xl px-5 py-3 font-bold text-sm hover:bg-gray-100 transition-colors shadow-lg">
                <span className="text-2xl">🤖</span>
                <div className="text-left">
                  <div className="text-xs text-gray-500">Get it on</div>
                  <div className="text-sm font-black">Google Play</div>
                </div>
              </button>
            </div>
          </div>
          <div className="relative z-10 hidden md:block">
            <img
              src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&q=80"
              alt="Quickky App"
              className="h-64 w-auto object-cover rounded-2xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500"
            />
          </div>
        </div>
      </section>
    </>
  );
}
