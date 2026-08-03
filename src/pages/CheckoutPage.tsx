import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, CreditCard, Truck, ChevronRight, ChevronDown,
  CheckCircle2, Loader2, Tag, X, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import type { Database } from '@/lib/database.types';
import AuthModal from '@/components/auth/AuthModal';

type Address = Database['public']['Tables']['addresses']['Row'];
type Coupon = Database['public']['Tables']['coupons']['Row'];

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: '💳', desc: 'GPay, PhonePe, Paytm' },
  { id: 'card', label: 'Card', icon: '💰', desc: 'Credit/Debit Card' },
  { id: 'cod', label: 'Cash on Delivery', icon: '💵', desc: 'Pay on delivery' },
  { id: 'netbanking', label: 'Net Banking', icon: '🏦', desc: 'All major banks' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, getSubtotal, getDiscount, getTotal, clearCart, coupon: localCoupon, applyCoupon, removeCoupon } = useCartStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [couponCode, setCouponCode] = useState('');
  const [dbCoupon, setDbCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [step, setStep] = useState<'address' | 'payment' | 'review'>('address');

  const subtotal = getSubtotal();
  const localDiscount = getDiscount();
  const dbDiscount = dbCoupon
    ? dbCoupon.type === 'percentage'
      ? Math.min(Math.round(subtotal * Number(dbCoupon.value) / 100), dbCoupon.max_discount ?? Infinity)
      : Number(dbCoupon.value)
    : localDiscount;
  const deliveryFee = subtotal > 499 ? 0 : 49;
  const tax = Math.round((subtotal - dbDiscount) * 0.05);
  const total = Math.max(0, subtotal - dbDiscount + deliveryFee + tax);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .then(({ data }) => {
        setAddresses(data || []);
        const def = data?.find(a => a.is_default) || data?.[0];
        if (def) setSelectedAddressId(def.id);
      });
  }, [user]);

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .single();
    setCouponLoading(false);
    if (error || !data) {
      toast.error('Invalid or expired coupon');
      return;
    }
    if (subtotal < Number(data.min_order_value)) {
      toast.error(`Minimum order ₹${data.min_order_value} required`);
      return;
    }
    if (data.valid_until && new Date(data.valid_until) < new Date()) {
      toast.error('This coupon has expired');
      return;
    }
    setDbCoupon(data);
    toast.success(`Coupon applied! ${data.description}`);
  };

  const placeOrder = async () => {
    if (!user) { setShowAuthModal(true); return; }
    if (!selectedAddressId) { toast.error('Please select a delivery address'); return; }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }

    const address = addresses.find(a => a.id === selectedAddressId);
    if (!address) return;

    setPlacing(true);

    // Insert order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        address,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'pending' : 'completed',
        status: 'confirmed',
        subtotal,
        discount: dbDiscount,
        delivery_fee: deliveryFee,
        tax,
        total,
        coupon_code: dbCoupon?.code || null,
        estimated_delivery: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (orderErr || !order) {
      setPlacing(false);
      toast.error('Failed to place order. Please try again.');
      return;
    }

    // Insert order items
    const { error: itemsErr } = await supabase.from('order_items').insert(
      items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_snapshot: {
          name: item.product.name,
          brand: item.product.brand,
          images: item.product.images,
          price: item.product.price,
        },
        quantity: item.quantity,
        size: item.size,
        color_name: item.color.name,
        unit_price: item.product.price,
      }))
    );

    if (itemsErr) {
      setPlacing(false);
      toast.error('Order partially failed. Contact support.');
      return;
    }

    // Add notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'order',
      title: 'Order Confirmed! 🎉',
      message: `Your order #${order.id.slice(0, 8).toUpperCase()} has been confirmed. Delivering in ~30 minutes!`,
    });

    // Clear cart
    clearCart();
    await supabase.from('cart_items').delete().eq('user_id', user.id);

    setPlacing(false);
    toast.success('Order placed successfully! 🎉');
    navigate('/orders');
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Cart is Empty</h2>
        <p className="text-gray-500 mb-6">Add items before checking out.</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors">
          Shop Now
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Step 1: Address */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              <button
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => setStep(step === 'address' ? 'review' : 'address')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <MapPin size={16} className="text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-gray-900 dark:text-white text-sm">Delivery Address</p>
                    {selectedAddress && step !== 'address' && (
                      <p className="text-xs text-gray-500 truncate max-w-48">{selectedAddress.full_name}, {selectedAddress.city}</p>
                    )}
                  </div>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${step === 'address' ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {step === 'address' && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-5 pb-5 space-y-3">
                      {!user && (
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                          <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">Sign in to use saved addresses</p>
                          <button onClick={() => setShowAuthModal(true)} className="text-sm font-bold text-purple-600 hover:underline">
                            Sign In →
                          </button>
                        </div>
                      )}
                      {addresses.map(addr => (
                        <label
                          key={addr.id}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedAddressId === addr.id
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10'
                              : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            className="mt-1 accent-purple-600"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg text-gray-700 dark:text-gray-200">{addr.label}</span>
                              {addr.is_default && <span className="text-[10px] font-bold text-purple-600">Default</span>}
                            </div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{addr.full_name} · {addr.phone}</p>
                            <p className="text-xs text-gray-500">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}</p>
                          </div>
                        </label>
                      ))}
                      <button
                        onClick={() => navigate('/addresses')}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-500 hover:border-purple-400 hover:text-purple-600 rounded-xl transition-all"
                      >
                        <Plus size={15} /> Add New Address
                      </button>
                      {addresses.length > 0 && (
                        <button
                          onClick={() => setStep('payment')}
                          className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors"
                        >
                          Continue to Payment <ChevronRight size={15} className="inline" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step 2: Payment */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              <button
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => setStep(step === 'payment' ? 'review' : 'payment')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <CreditCard size={16} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-gray-900 dark:text-white text-sm">Payment Method</p>
                    {step !== 'payment' && <p className="text-xs text-gray-500 capitalize">{paymentMethod}</p>}
                  </div>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${step === 'payment' ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {step === 'payment' && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                      {PAYMENT_METHODS.map(pm => (
                        <label key={pm.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          paymentMethod === pm.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-100 dark:border-gray-800'
                        }`}>
                          <input type="radio" name="payment" className="accent-blue-600" checked={paymentMethod === pm.id} onChange={() => setPaymentMethod(pm.id)} />
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{pm.icon} {pm.label}</p>
                            <p className="text-xs text-gray-400">{pm.desc}</p>
                          </div>
                        </label>
                      ))}
                      <button onClick={() => setStep('review')} className="col-span-2 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
                        Review Order <ChevronRight size={15} className="inline" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right Column: Order Summary ── */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <h3 className="font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Truck size={16} className="text-purple-500" /> Order Summary
              </h3>

              {/* Items */}
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={`${item.product.id}-${item.size}-${item.color.name}`} className="flex items-center gap-3">
                    <img src={item.product.images[0]} alt={item.product.name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{item.product.name}</p>
                      <p className="text-[10px] text-gray-400">{item.size} · {item.color.name} · ×{item.quantity}</p>
                    </div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white flex-shrink-0">{formatPrice(item.product.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mb-4">
                {dbCoupon ? (
                  <div className="flex items-center gap-2 p-2.5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <Tag size={13} className="text-green-600" />
                    <span className="text-xs font-bold text-green-700 dark:text-green-300 flex-1">{dbCoupon.code}</span>
                    <button onClick={() => setDbCoupon(null)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      className="flex-1 px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-purple-500 transition-all"
                    />
                    <button
                      onClick={validateCoupon}
                      disabled={couponLoading || !couponCode}
                      className="px-3 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      {couponLoading ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 border-t border-gray-50 dark:border-gray-800 pt-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                </div>
                {dbDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span><span>−{formatPrice(dbDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>Delivery</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : ''}>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>Tax (5%)</span><span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between font-black text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span>Total</span><span className="text-purple-600">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Estimated delivery */}
              <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <Truck size={14} className="text-green-600" />
                <p className="text-xs text-green-700 dark:text-green-300 font-semibold">
                  Estimated delivery in <span className="font-black">~30 minutes</span>
                </p>
              </div>

              <button
                onClick={placeOrder}
                disabled={placing || !selectedAddressId}
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-black text-sm hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
              >
                {placing ? (
                  <><Loader2 size={16} className="animate-spin" /> Placing Order...</>
                ) : (
                  <><CheckCircle2 size={16} /> Place Order · {formatPrice(total)}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />
    </div>
  );
}
