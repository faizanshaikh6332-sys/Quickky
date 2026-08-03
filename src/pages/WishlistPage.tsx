import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlistStore, useCartStore, useUIStore } from '@/store';
import { products } from '@/data';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { productIds, removeFromWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { setCartOpen } = useUIStore();
  const wishlistProducts = products.filter(p => productIds.includes(p.id));

  const moveToCart = (productId: string) => {
    const product = wishlistProducts.find(p => p.id === productId);
    if (product) {
      addItem(product, product.sizes[2] || product.sizes[0], product.colors[0]);
      removeFromWishlist(productId);
      toast.success('Moved to cart! 🛍️');
      setCartOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
            <Heart size={20} className="text-pink-500 fill-pink-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Wishlist</h1>
            <p className="text-sm text-gray-500">{wishlistProducts.length} items saved</p>
          </div>
        </div>

        {wishlistProducts.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 rounded-full bg-pink-50 dark:bg-pink-900/10 flex items-center justify-center mx-auto mb-6">
              <Heart size={40} className="text-pink-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 mb-6">Save items you love and come back to them anytime.</p>
            <Link to="/"><Button variant="primary">Start Shopping</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            <AnimatePresence>
              {wishlistProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all"
                >
                  <Link to={`/product/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3">
                      <div className="delivery-badge"><span>⚡</span> 30 min</div>
                    </div>
                    {product.discount > 0 && (
                      <div className="absolute top-3 left-3">
                        <span className="discount-badge">{product.discount}% OFF</span>
                      </div>
                    )}
                  </Link>
                  <div className="p-4">
                    <p className="text-xs text-purple-600 font-semibold mb-1">{product.brand}</p>
                    <Link to={`/product/${product.slug}`}>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 mb-2 hover:text-purple-600 transition-colors leading-tight">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-bold text-gray-900 dark:text-white">{formatPrice(product.price)}</span>
                      <span className="text-xs line-through text-gray-400">{formatPrice(product.mrp)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveToCart(product.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors"
                      >
                        <ShoppingCart size={12} /> Move to Cart
                      </button>
                      <button
                        onClick={() => { removeFromWishlist(product.id); toast.success('Removed from wishlist'); }}
                        className="w-9 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-xl hover:border-red-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
