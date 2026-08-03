import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, ShoppingCart, Zap, Star, Share2, Shield,
  Package, RefreshCw, Truck, ChevronDown, ZoomIn,
  ChevronLeft, ChevronRight, Check, Info
} from 'lucide-react';
import { getProductBySlug, getRelatedProducts, reviews } from '@/data';
import { useCartStore, useWishlistStore, useUIStore } from '@/store';
import { formatPrice } from '@/lib/utils';
import { ProductColor } from '@/types';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';
import ProductCard from '@/components/product/ProductCard';
import ReviewSection from '@/components/product/ReviewSection';
import toast from 'react-hot-toast';

export default function ProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const product = getProductBySlug(slug || '');
  const relatedProducts = product ? getRelatedProducts(product) : [];
  const productReviews = reviews.filter(r => r.productId === product?.id);

  const { addItem } = useCartStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const { setCartOpen } = useUIStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'reviews' | 'faq'>('description');
  const [isZoomed, setIsZoomed] = useState(false);
  const [pincode, setPincode] = useState('');
  const [deliveryChecked, setDeliveryChecked] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors[0]);
      setSelectedSize(product.sizes[2] || product.sizes[0]);
      window.scrollTo(0, 0);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">Product Not Found</h2>
        <p className="text-gray-500 mb-6">This product doesn't exist or has been removed.</p>
        <Link to="/">
          <Button variant="primary">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = () => {
    if (!selectedSize) { toast.error('Please select a size'); return; }
    if (!selectedColor) { toast.error('Please select a color'); return; }
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedSize, selectedColor);
    }
    toast.success('Added to cart! 🛍️');
    setCartOpen(true);
  };

  const handleBuyNow = () => {
    handleAddToCart();
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: product.name, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  const checkDelivery = () => {
    if (pincode.length === 6) {
      setDeliveryChecked(true);
      toast.success('⚡ 30-minute delivery available at this location!');
    } else {
      toast.error('Enter a valid 6-digit pincode');
    }
  };

  const savings = product.mrp - product.price;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-purple-600 transition-colors">Home</Link>
          <span>/</span>
          <Link to={`/category/${product.category}`} className="hover:text-purple-600 transition-colors capitalize">{product.category}</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium line-clamp-1">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div
              className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 dark:bg-gray-900 cursor-zoom-in"
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <motion.img
                key={selectedImage}
                src={product.images[selectedImage]}
                alt={product.name}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full object-cover"
              />

              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isFlashSale && <Badge variant="sale">🔥 SALE</Badge>}
                {product.isNew && <Badge variant="new">✨ NEW</Badge>}
                {product.discount >= 30 && <Badge variant="discount">{product.discount}% OFF</Badge>}
              </div>

              <div className="absolute top-4 right-4">
                <div className="delivery-badge">
                  <Zap size={10} />
                  30 Min Delivery
                </div>
              </div>

              <button className="absolute bottom-4 right-4 w-10 h-10 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                <ZoomIn size={16} />
              </button>

              {/* Navigation arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(Math.max(0, selectedImage - 1)); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(Math.min(product.images.length - 1, selectedImage + 1)); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-purple-600 shadow-lg shadow-purple-200' : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'}`}
                >
                  <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand + Share */}
            <div className="flex items-center justify-between">
              <Link to={`/brand/${product.brand.toLowerCase()}`} className="text-purple-600 font-bold text-sm hover:underline uppercase tracking-wide">
                {product.brand}
              </Link>
              <div className="flex items-center gap-2">
                <button onClick={handleShare} className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Share2 size={15} />
                </button>
                <button
                  onClick={() => { toggleWishlist(product.id); toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️'); }}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${wishlisted ? 'border-pink-300 bg-pink-50 text-pink-500' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <Heart size={15} className={wishlisted ? 'fill-current' : ''} />
                </button>
              </div>
            </div>

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-xl">
                <span className="font-bold text-green-700 dark:text-green-400 text-sm">{product.rating}</span>
                <Star size={14} className="text-green-700 dark:text-green-400 fill-current" />
              </div>
              <span className="text-sm text-gray-500">{product.reviews.toLocaleString()} verified ratings</span>
              {product.inStock ? (
                <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                  <Check size={14} /> In Stock
                </span>
              ) : (
                <span className="text-sm text-red-500 font-medium">Out of Stock</span>
              )}
            </div>

            {/* Price */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5">
              <div className="flex items-end gap-3 mb-2">
                <span className="text-3xl font-black text-gray-900 dark:text-white">{formatPrice(product.price)}</span>
                <span className="text-lg text-gray-400 line-through pb-1">{formatPrice(product.mrp)}</span>
                <span className="text-lg font-bold text-green-600 pb-1">{product.discount}% off</span>
              </div>
              <p className="text-sm text-green-600 font-medium">You save {formatPrice(savings)}! 🎉</p>
              <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes • EMI from ₹{Math.round(product.price / 12)}/month</p>
            </div>

            {/* Color Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                  Color: <span className="text-purple-600">{selectedColor?.name}</span>
                </span>
              </div>
              <div className="flex gap-3">
                {product.colors.map(color => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    title={color.name}
                    className={`w-9 h-9 rounded-xl border-2 transition-all ${selectedColor?.name === color.name ? 'border-purple-600 scale-110 shadow-lg' : 'border-gray-200 dark:border-gray-600 hover:scale-105'}`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                  Size: <span className="text-purple-600">{selectedSize}</span>
                </span>
                <button className="text-xs text-purple-600 hover:underline flex items-center gap-1">
                  <Info size={12} /> Size Guide
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${selectedSize === size ? 'border-purple-600 bg-purple-600 text-white shadow-lg shadow-purple-200' : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 text-gray-700 dark:text-gray-200'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="font-bold text-gray-900 dark:text-white text-sm">Quantity:</span>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center hover:bg-purple-50 transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-gray-900 dark:text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center hover:bg-purple-50 transition-colors"
                >
                  +
                </button>
              </div>
              {product.stockCount < 10 && (
                <span className="text-xs text-orange-500 font-medium">Only {product.stockCount} left!</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                <ShoppingCart size={18} />
                Add to Cart
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={handleBuyNow}
                disabled={!product.inStock}
              >
                <Zap size={18} />
                Buy Now
              </Button>
            </div>

            {/* Delivery Check */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Truck size={16} className="text-purple-600" />
                <span className="font-bold text-gray-900 dark:text-white text-sm">Check Delivery</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Pincode"
                  maxLength={6}
                  value={pincode}
                  onChange={e => { setPincode(e.target.value.replace(/\D/g, '')); setDeliveryChecked(false); }}
                  className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500"
                />
                <Button size="sm" variant="outline" onClick={checkDelivery}>Check</Button>
              </div>
              {deliveryChecked && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-green-600 font-medium mt-2 flex items-center gap-1"
                >
                  <Zap size={12} /> ⚡ 30-minute delivery available! FREE delivery on this order.
                </motion.p>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Shield size={16} />, text: '100% Authentic' },
                { icon: <RefreshCw size={16} />, text: '30-Day Returns' },
                { icon: <Package size={16} />, text: 'Secure Packaging' },
              ].map(badge => (
                <div key={badge.text} className="flex flex-col items-center gap-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
                  <span className="text-purple-600">{badge.icon}</span>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 mb-8">
            {(['description', 'details', 'reviews', 'faq'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${activeTab === tab ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab === 'reviews' ? `Reviews (${productReviews.length})` : tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'description' && (
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{product.description}</p>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 dark:text-white">Fabric & Material</h3>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">{product.fabric}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 dark:text-white">Wash Care</h3>
                    <ul className="space-y-2">
                      {product.washCare.map((care, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <span className="text-purple-500 mt-0.5">✓</span>
                          {care}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <ReviewSection productId={product.id} />
              )}

              {activeTab === 'faq' && (
                <div className="space-y-4">
                  {[
                    { q: 'How fast will this be delivered?', a: 'Quickky guarantees delivery within 30 minutes of order placement. You can track your delivery in real-time.' },
                    { q: 'Is this product authentic?', a: 'Yes! All products on Quickky are 100% authentic and sourced directly from brand-authorized suppliers. We provide certification of authenticity with every purchase.' },
                    { q: 'What is the return policy?', a: 'We offer a hassle-free 30-day return policy. If you\'re not satisfied, simply initiate a return from your dashboard and we\'ll arrange a pickup.' },
                    { q: 'Can I exchange for a different size?', a: 'Yes, size exchanges are available within 30 days of delivery. The exchange will be delivered in 30 minutes as well!' },
                  ].map((faq, i) => (
                    <details key={i} className="group border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
                      <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer flex items-center justify-between list-none">
                        {faq.q}
                        <ChevronDown size={16} className="group-open:rotate-180 transition-transform text-gray-400" />
                      </summary>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 leading-relaxed">{faq.a}</p>
                    </details>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
