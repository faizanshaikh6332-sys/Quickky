import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function PremiumBanner() {
  return (
    <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Banner 1 */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative overflow-hidden rounded-3xl h-72 cursor-pointer group"
        >
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=90"
            alt="Women's Collection"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center pl-8">
            <span className="text-xs text-amber-300 font-bold uppercase tracking-widest mb-2">New Season</span>
            <h3 className="text-3xl font-black text-white mb-1">Women's</h3>
            <p className="text-white/80 text-sm mb-4">2025 Collection • Up to 50% Off</p>
            <Link to="/category/women" className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2 rounded-xl font-bold text-sm hover:bg-purple-600 hover:text-white transition-all w-fit">
              Shop Now <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>

        {/* Banner 2 */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative overflow-hidden rounded-3xl h-72 cursor-pointer group"
        >
          <img
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=90"
            alt="Sneakers Collection"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center pl-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-amber-300" />
              <span className="text-xs text-amber-300 font-bold uppercase tracking-widest">Exclusive Drop</span>
            </div>
            <h3 className="text-3xl font-black text-white mb-1">Sneaker</h3>
            <p className="text-white/80 text-sm mb-4">Culture • Limited Edition</p>
            <Link to="/category/sneakers" className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2 rounded-xl font-bold text-sm hover:bg-purple-600 hover:text-white transition-all w-fit">
              Explore <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Full width luxury banner */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="relative overflow-hidden rounded-3xl h-64 mt-6 cursor-pointer group"
      >
        <img
          src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1400&q=90"
          alt="Luxury Collection"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 flex items-center pl-10">
          <div>
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">✨ Quickky Luxe</p>
            <h3 className="text-4xl font-black text-white mb-2">Luxury Collection</h3>
            <p className="text-white/70 mb-5">Gucci • Louis Vuitton • Chanel • Rolex</p>
            <Link to="/category/luxury" className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:from-amber-500 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/30">
              <Sparkles size={14} /> Explore Luxe
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
