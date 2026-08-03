import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Grid, List } from 'lucide-react';
import { products, categories } from '@/data';
import { useFilterStore } from '@/store';
import ProductCard from '@/components/product/ProductCard';
import Button from '@/components/ui/Button';

const BRANDS = ['Nike', 'Adidas', 'Zara', "Levi's", 'H&M', 'Puma', 'Gucci'];
const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low_high', label: 'Price: Low to High' },
  { value: 'price_high_low', label: 'Price: High to Low' },
  { value: 'rating', label: 'Customer Rating' },
  { value: 'discount', label: 'Best Discount' },
];

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { filters, setFilter, resetFilters } = useFilterStore();

  const category = categories.find(c => c.slug === slug);

  const filteredProducts = useMemo(() => {
    let result = slug === 'luxury'
      ? products.filter(p => p.price > 10000)
      : slug
      ? products.filter(p => p.category === slug || p.subcategory === slug)
      : products;

    if (filters.brands.length > 0) {
      result = result.filter(p => filters.brands.includes(p.brand));
    }
    if (filters.minPrice > 0) result = result.filter(p => p.price >= filters.minPrice);
    if (filters.maxPrice < 100000) result = result.filter(p => p.price <= filters.maxPrice);
    if (filters.minRating > 0) result = result.filter(p => p.rating >= filters.minRating);
    if (filters.inStock) result = result.filter(p => p.inStock);

    switch (filters.sortBy) {
      case 'newest': return [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'price_low_high': return [...result].sort((a, b) => a.price - b.price);
      case 'price_high_low': return [...result].sort((a, b) => b.price - a.price);
      case 'rating': return [...result].sort((a, b) => b.rating - a.rating);
      case 'discount': return [...result].sort((a, b) => b.discount - a.discount);
      default: return [...result].sort((a, b) => b.reviews - a.reviews);
    }
  }, [slug, filters]);

  const toggleBrand = (brand: string) => {
    const brands = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand];
    setFilter('brands', brands);
  };

  const activeFilterCount = [
    filters.brands.length > 0,
    filters.minPrice > 0,
    filters.maxPrice < 100000,
    filters.minRating > 0,
    filters.inStock,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 to-purple-900 py-12">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(124,58,237,0.3) 0%, transparent 60%)' }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white capitalize">{slug || 'All Products'}</span>
          </nav>
          <h1 className="text-4xl font-black text-white capitalize">
            {category ? `${category.icon} ${category.name}` : slug || 'All Products'}
          </h1>
          {category && (
            <p className="text-gray-300 mt-1">{category.productCount.toLocaleString()}+ products</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:border-purple-400 transition-colors"
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <span className="text-sm text-gray-500">{filteredProducts.length} products</span>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filters.sortBy}
              onChange={e => setFilter('sortBy', e.target.value as any)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="hidden sm:flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'}`}
              >
                <Grid size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'}`}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 256, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex-shrink-0 overflow-hidden"
              >
                <div className="w-64 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">Filters</span>
                    <div className="flex items-center gap-2">
                      {activeFilterCount > 0 && (
                        <button onClick={resetFilters} className="text-xs text-red-500 hover:text-red-600">Clear all</button>
                      )}
                      <button onClick={() => setShowFilters(false)}>
                        <X size={16} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Brands */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Brand</h4>
                    <div className="space-y-2">
                      {BRANDS.map(brand => (
                        <label key={brand} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.brands.includes(brand)}
                            onChange={() => toggleBrand(brand)}
                            className="rounded border-gray-300 text-purple-600"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-300">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
                      Price: ₹{filters.minPrice.toLocaleString()} – ₹{filters.maxPrice.toLocaleString()}
                    </h4>
                    <input
                      type="range"
                      min={0} max={100000} step={500}
                      value={filters.maxPrice}
                      onChange={e => setFilter('maxPrice', Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-500">
                      {[[0, 999], [1000, 4999], [5000, 19999], [20000, 100000]].map(([min, max]) => (
                        <button
                          key={`${min}-${max}`}
                          onClick={() => { setFilter('minPrice', min); setFilter('maxPrice', max); }}
                          className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-400 hover:text-purple-600 transition-colors"
                        >
                          ₹{min === 0 ? '0' : `${min/1000}k`}–₹{max >= 100000 ? '100k+' : `${max/1000}k`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Min Rating</h4>
                    <div className="space-y-1">
                      {[4, 3, 2].map(r => (
                        <button
                          key={r}
                          onClick={() => setFilter('minRating', filters.minRating === r ? 0 : r)}
                          className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-colors ${filters.minRating === r ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'hover:bg-gray-50 dark:hover:bg-gray-900'}`}
                        >
                          {'★'.repeat(r)} & above
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Availability */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Availability</h4>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.inStock}
                        onChange={e => setFilter('inStock', e.target.checked)}
                        className="rounded border-gray-300 text-purple-600"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">In Stock Only</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Products */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-6xl mb-4">🔍</p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filters</p>
                <Button variant="outline" onClick={resetFilters}>Clear Filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
