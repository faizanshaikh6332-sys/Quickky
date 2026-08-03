import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, ChevronLeft, ChevronRight, MapPin, Shield, Zap } from 'lucide-react';
import type { Store } from '@/data/stores';

interface StoreCardProps {
  store: Store;
  index: number;
}

function StoreCard({ store, index }: StoreCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="flex-shrink-0 w-60"
    >
      <Link to={`/store/${store.slug}`} className="group block">
        <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-xl hover:shadow-purple-100/40 dark:hover:shadow-purple-900/20 transition-all duration-300">
          {/* Banner */}
          <div className="relative h-28 overflow-hidden">
            <img
              src={store.banner}
              alt={store.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            {/* Delivery time pill */}
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-[10px] font-black px-2 py-1 rounded-lg shadow">
              <Zap size={9} className="text-purple-500" />
              {store.deliveryTime} min
            </div>
            {/* Open/Closed */}
            {!store.isOpen && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-gray-900/80 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Currently Closed
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-3.5">
            <div className="flex items-start gap-2.5">
              {/* Logo */}
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 flex-shrink-0 -mt-6 relative z-10 shadow">
                <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 mt-0.5">
                <div className="flex items-center gap-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{store.name}</h3>
                  {store.isVerified && (
                    <Shield size={11} className="text-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-gray-500 truncate">{store.tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-gray-50 dark:border-gray-800">
              <div className="flex items-center gap-1">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-100">{store.rating}</span>
                <span className="text-[10px] text-gray-400">({store.totalRatings >= 1000 ? `${(store.totalRatings / 1000).toFixed(1)}k` : store.totalRatings})</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-gray-500">
                <MapPin size={10} className="text-gray-400" />
                {store.city}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-gray-500 ml-auto">
                <Clock size={10} className="text-gray-400" />
                {store.deliveryTime}m
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

interface StoresSectionProps {
  title: string;
  subtitle: string;
  accentColor?: string;
  stores: Store[];
  icon?: string;
}

export function StoresRow({ title, subtitle, accentColor = 'text-purple-600', stores, icon }: StoresSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'right' ? 280 : -280, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-10">
      <div className="flex items-end justify-between mb-5 px-4 sm:px-6">
        <div>
          <p className={`text-sm font-semibold uppercase tracking-widest mb-1 ${accentColor}`}>
            {icon} {subtitle}
          </p>
          <h2 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-purple-50 hover:border-purple-300 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-purple-50 hover:border-purple-300 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-4 sm:px-6"
      >
        {stores.map((store, i) => (
          <StoreCard key={store.id} store={store} index={i} />
        ))}
      </div>
    </div>
  );
}

export default function StoresSection() {
  return null; // Used via StoresRow exports
}
