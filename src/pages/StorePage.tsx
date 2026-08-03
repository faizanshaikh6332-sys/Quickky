import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star, Clock, MapPin, Shield, Package, ChevronRight,
  ExternalLink, Store, MessageSquare, Heart, Share2, Zap
} from 'lucide-react';
import { getStoreBySlug, storeReviews } from '@/data/stores';
import { products } from '@/data';
import ProductCard from '@/components/product/ProductCard';

function StarBar({ rating, totalRatings }: { rating: number; totalRatings: number }) {
  const bars = [5, 4, 3, 2, 1];
  const mockDistribution = [60, 25, 10, 3, 2];
  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      {/* Big rating */}
      <div className="flex flex-col items-center">
        <div className="text-6xl font-black text-gray-900 dark:text-white">{rating}</div>
        <div className="flex gap-0.5 my-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={16}
              className={i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500">{totalRatings.toLocaleString()} ratings</p>
      </div>
      {/* Bars */}
      <div className="flex-1 space-y-1.5 min-w-0 w-full sm:w-auto">
        {bars.map((star, i) => (
          <div key={star} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-6 text-right">{star}★</span>
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${mockDistribution[i]}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="h-full bg-amber-400 rounded-full"
              />
            </div>
            <span className="text-xs text-gray-400 w-8">{mockDistribution[i]}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const store = getStoreBySlug(slug || '');

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <Store size={48} className="text-gray-300 mb-4" />
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Store Not Found</h1>
        <p className="text-gray-500 mb-6">This store doesn't exist or may have been removed.</p>
        <Link to="/" className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors">
          Back to Home
        </Link>
      </div>
    );
  }

  const storeProducts = products.filter(p => store.productIds.includes(p.id));
  const reviews = storeReviews.filter(r => r.storeId === store.id);

  const CATEGORY_LABELS: Record<string, string> = {
    fashion: '👗 Fashion & Apparel',
    footwear: '👟 Footwear',
    accessories: '👜 Accessories',
    jewellery: '💎 Jewellery',
    kids: '🧒 Kids',
    sportswear: '🏋️ Sportswear',
    ethnic: '🪬 Ethnic Wear',
    medical: '💊 Medical & Pharmacy',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Banner ─────────────────────────────────────────────────── */}
      <div className="relative h-52 md:h-72 overflow-hidden">
        <img
          src={store.banner}
          alt={`${store.name} banner`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {/* Breadcrumb */}
        <nav className="absolute top-4 left-4 flex items-center gap-1.5 text-white/80 text-xs">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/stores" className="hover:text-white transition-colors">Stores</Link>
          <ChevronRight size={12} />
          <span className="text-white font-semibold">{store.name}</span>
        </nav>
      </div>

      {/* ── Store Identity Card ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-16 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-800"
          >
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Logo */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                  <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                </div>
                {store.isOpen && (
                  <div className="absolute -bottom-1.5 -right-1.5 flex items-center gap-1 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                    OPEN
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-2 mb-1">
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white">{store.name}</h1>
                  {store.isVerified && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                      <Shield size={10} /> Verified
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mb-3">{store.tagline}</p>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="font-bold text-gray-900 dark:text-white">{store.rating}</span>
                    <span className="text-gray-500">({store.totalRatings.toLocaleString()})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <Clock size={14} className="text-purple-500" />
                    <span className="font-semibold">{store.deliveryTime} min delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <Package size={14} className="text-blue-500" />
                    <span>Min ₹{store.minOrder}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <MapPin size={14} className="text-green-500" />
                    <span>{store.city}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {store.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col gap-2 flex-shrink-0">
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors">
                  <Zap size={14} /> Order Now
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Heart size={14} /> Follow
                </button>
                <button className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Share2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Products ─────────────────────────────────────────────── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              Products <span className="text-gray-400 font-normal text-lg">({storeProducts.length})</span>
            </h2>
          </div>
          {storeProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {storeProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
              <Package size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No products listed yet</p>
            </div>
          )}
        </section>

        {/* ── Reviews ─────────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
            Customer Reviews
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <div className="mb-6">
              <StarBar rating={store.rating} totalRatings={store.totalRatings} />
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-5">
              {reviews.length > 0 ? reviews.map(review => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <img src={review.avatar} alt={review.userName} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{review.userName}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={10} className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{review.date}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{review.text}</p>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-8">
                  <MessageSquare size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No reviews yet. Be the first!</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── About ─────────────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">About the Store</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-5">{store.about}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                {[
                  { label: 'Category', value: CATEGORY_LABELS[store.category] },
                  { label: 'Established', value: store.established },
                  { label: 'Total Sales', value: `${store.totalSales.toLocaleString()}+` },
                  { label: 'Products', value: `${store.productIds.length}+` },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-red-500" /> Location
              </h3>
              {/* Map placeholder */}
              <div className="w-full h-36 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl flex items-center justify-center mb-4 overflow-hidden relative">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'url("https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/72.8295,19.0596,14,0/400x200?access_token=pk.demo")',
                  backgroundSize: 'cover'
                }} />
                <div className="relative flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-300 animate-bounce">
                    <MapPin size={18} className="text-white" />
                  </div>
                  <div className="mt-1 px-3 py-1 bg-white dark:bg-gray-800 rounded-full shadow text-xs font-bold text-gray-700 dark:text-gray-200">
                    {store.name}
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">{store.address}, {store.city} - {store.pincode}</span>
                </div>
                <div className="flex gap-2">
                  <Clock size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">{store.openTime} – {store.closeTime}</span>
                </div>
              </div>
              <a
                href={`https://maps.google.com/?q=${store.lat},${store.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 text-sm text-purple-600 font-semibold hover:underline"
              >
                <ExternalLink size={13} /> Open in Google Maps
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
