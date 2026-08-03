import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { categories } from '@/data';

export default function CategorySection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'right' ? 300 : -300, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest mb-1">Explore</p>
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white">Shop by Category</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll('left')} className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-purple-50 hover:border-purple-300 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => scroll('right')} className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-purple-50 hover:border-purple-300 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
      >
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="flex-shrink-0"
          >
            <Link to={`/category/${cat.slug}`} className="group block">
              <div className="relative w-32 h-40 rounded-2xl overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient} opacity-70`} />
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 text-white">
                  <span className="text-2xl mb-1">{cat.icon}</span>
                  <span className="text-sm font-bold">{cat.name}</span>
                  <span className="text-xs text-white/70">{cat.productCount.toLocaleString()}+</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
