import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, Tag, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore, useUIStore } from '@/store';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function CartDrawer() {
  const { isCartOpen, setCartOpen } = useUIStore();
  const {
    items, removeItem, updateQuantity, getSubtotal, getDiscount,
    getTotal, getItemCount, applyCoupon, removeCoupon, coupon,
  } = useCartStore();
  const [couponCode, setCouponCode] = useState('');

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const deliveryFee = subtotal > 499 ? 0 : 49;
  const tax = Math.round((subtotal - discount) * 0.05);
  const total = getTotal();

  const handleApplyCoupon = () => {
    const result = applyCoupon(couponCode);
    if (result.success) {
      toast.success(result.message);
      setCouponCode('');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setCartOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-950 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center">
                  <ShoppingBag size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">Your Cart</h2>
                  <p className="text-xs text-gray-500">{getItemCount()} items</p>
                </div>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-24 h-24 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                    <ShoppingBag size={40} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Your cart is empty</h3>
                    <p className="text-sm text-gray-500">Start shopping to add items to your cart</p>
                  </div>
                  <Button onClick={() => setCartOpen(false)} variant="primary">
                    Start Shopping
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={`${item.product.id}-${item.size}-${item.color.name}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="flex gap-3 bg-gray-50 dark:bg-gray-900 rounded-2xl p-3"
                  >
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-purple-600 font-medium">{item.product.brand}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                        {item.product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                          {item.size}
                        </span>
                        <span
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: item.color.hex }}
                          title={item.color.name}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-gray-900 dark:text-white text-sm">
                          {formatPrice(item.product.price)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.size, item.color.name, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-purple-100 hover:text-purple-600 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.size, item.color.name, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-purple-100 hover:text-purple-600 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        removeItem(item.product.id, item.size, item.color.name);
                        toast.success('Item removed from cart');
                      }}
                      className="self-start text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4 space-y-4">
                {/* Coupon */}
                {coupon ? (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-green-600" />
                      <span className="text-sm font-semibold text-green-700 dark:text-green-400">{coupon.code}</span>
                      <span className="text-xs text-green-600">applied!</span>
                    </div>
                    <button onClick={removeCoupon} className="text-red-400 hover:text-red-600">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
                      <Tag size={14} className="text-gray-400" />
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                        className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
                      />
                    </div>
                    <Button size="sm" variant="outline" onClick={handleApplyCoupon}>Apply</Button>
                  </div>
                )}

                {/* Hint */}
                <p className="text-xs text-gray-400 text-center">
                  Try: <button onClick={() => setCouponCode('QUICKKY30')} className="text-purple-500 font-semibold">QUICKKY30</button>
                  {' '}or{' '}
                  <button onClick={() => setCouponCode('FASHION500')} className="text-purple-500 font-semibold">FASHION500</button>
                </p>

                {/* Order Summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Delivery</span>
                    <span>
                      {deliveryFee === 0
                        ? <span className="text-green-600 font-medium">FREE</span>
                        : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Tax (5%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <Link to="/checkout" onClick={() => setCartOpen(false)}>
                  <Button variant="primary" className="w-full" size="lg">
                    Proceed to Checkout
                    <ArrowRight size={16} />
                  </Button>
                </Link>

                <p className="text-xs text-center text-gray-400">
                  🚀 Delivered in 30 minutes • 🔒 100% Secure Payment
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
