import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Eye, Star, Zap, Store } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore, useWishlistStore, useUIStore } from '@/store';
import { formatPrice } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { getStoreForProduct } from '@/data/stores';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { addItem } = useCartStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const { openQuickView, setCartOpen } = useUIStore();

  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultSize = product.sizes[2] || product.sizes[0];
    const defaultColor = product.colors[0];
    addItem(product, defaultSize, defaultColor);
    toast.success(`${product.name} added to cart!`);
    setCartOpen(true);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️');
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickView(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      className="group relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-800 shadow-sm hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-400 card-hover"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/product/${product.slug}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 dark:bg-gray-800">
          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            {product.isFlashSale && (
              <Badge variant="sale">🔥 SALE</Badge>
            )}
            {product.isNew && (
              <Badge variant="new">✨ NEW</Badge>
            )}
            {product.discount >= 30 && (
              <Badge variant="discount">{product.discount}% OFF</Badge>
            )}
          </div>

          {/* Delivery Badge */}
          <div className="absolute top-3 right-3 z-10">
            <div className="delivery-badge">
              <Zap size={10} />
              30 min
            </div>
          </div>

          {/* Images */}
          <motion.img
            src={product.images[0]}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
            animate={{ opacity: hovered && product.images[1] ? 0 : 1 }}
            transition={{ duration: 0.3 }}
            onLoad={() => setImageLoaded(true)}
          />
          {product.images[1] && (
            <motion.img
              src={product.images[1]}
              alt={`${product.name} alt`}
              className="absolute inset-0 w-full h-full object-cover"
              animate={{ opacity: hovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          )}

          {/* Overlay Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-3 left-3 right-3 flex gap-2"
          >
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-900/90 backdrop-blur-sm text-white rounded-xl text-xs font-bold hover:bg-purple-600 transition-colors"
            >
              <ShoppingCart size={13} />
              Add to Cart
            </button>
            <button
              onClick={handleQuickView}
              className="w-10 flex items-center justify-center bg-white/90 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-purple-600 hover:text-white transition-colors"
              title="Quick View"
            >
              <Eye size={14} />
            </button>
          </motion.div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Brand + Wishlist */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">{product.brand}</span>
            <button
              onClick={handleWishlist}
              className={`p-1.5 rounded-lg transition-all ${wishlisted ? 'text-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'text-gray-300 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20'}`}
            >
              <Heart size={14} className={wishlisted ? 'fill-current' : ''} />
            </button>
          </div>

          {/* Name */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors leading-tight">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={11}
                  className={i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700 fill-current'}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">({product.reviews.toLocaleString()})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white text-base">{formatPrice(product.price)}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-xs text-gray-400 line-through">{formatPrice(product.mrp)}</span>
                <span className="text-xs font-bold text-green-600">{product.discount}% off</span>
              </>
            )}
          </div>

          {/* Stock Warning */}
          {product.stockCount < 10 && product.inStock && (
            <p className="text-xs text-orange-500 font-medium mt-1">Only {product.stockCount} left!</p>
          )}

          {/* Sold By / View Store */}
          {(() => {
            const store = getStoreForProduct(product.id);
            return store ? (
              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-50 dark:border-gray-800">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Store size={10} className="text-gray-400 flex-shrink-0" />
                  <span className="text-[10px] text-gray-400">Sold by</span>
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 truncate">{store.name}</span>
                </div>
                <Link
                  to={`/store/${store.slug}`}
                  onClick={e => e.stopPropagation()}
                  className="text-[10px] font-bold text-purple-600 hover:text-purple-700 hover:underline flex-shrink-0 ml-1"
                >
                  View Store
                </Link>
              </div>
            ) : null;
          })()}
        </div>
      </Link>
    </motion.div>
  );
}
