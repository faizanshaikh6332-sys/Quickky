import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { trendingProducts, products } from '@/data';
import ProductCard from '@/components/product/ProductCard';

export default function TrendingProducts() {
  const displayProducts = products.slice(0, 8);

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-orange-500" />
            <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest">Trending Now</p>
          </div>
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white">Most Loved</h2>
        </div>
        <Link
          to="/trending"
          className="flex items-center gap-1 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {displayProducts.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>
    </section>
  );
}
