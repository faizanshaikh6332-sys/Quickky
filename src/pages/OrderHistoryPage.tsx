import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronRight, Clock, CheckCircle2, Truck, MapPin, RotateCcw, X, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  confirmed:       { label: 'Confirmed',        color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',    icon: <CheckCircle2 size={12} /> },
  processing:      { label: 'Processing',       color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20', icon: <Clock size={12} /> },
  picked_up:       { label: 'Picked Up',        color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20', icon: <Package size={12} /> },
  out_for_delivery:{ label: 'Out for Delivery', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20', icon: <Truck size={12} /> },
  delivered:       { label: 'Delivered',        color: 'text-green-600 bg-green-50 dark:bg-green-900/20',   icon: <CheckCircle2 size={12} /> },
  cancelled:       { label: 'Cancelled',        color: 'text-red-600 bg-red-50 dark:bg-red-900/20',         icon: <X size={12} /> },
  returned:        { label: 'Returned',         color: 'text-gray-600 bg-gray-100 dark:bg-gray-800',        icon: <RotateCcw size={12} /> },
};

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  order_items: Array<{
    id: string;
    product_id: string;
    product_snapshot: any;
    quantity: number;
    size: string;
    color_name: string;
    unit_price: number;
  }>;
}

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) toast.error('Failed to load orders');
      else setOrders(data || []);
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <ShoppingBag size={48} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Sign in to view orders</h2>
        <p className="text-gray-500">Your order history will appear here after you sign in.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <Package size={56} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-6">Start shopping to see your orders here!</p>
        <Link to="/" className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-6">My Orders</h1>
        <div className="space-y-4">
          {orders.map((order, i) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.confirmed;
            const isExpanded = expandedId === order.id;
            const items = order.order_items || [];
            const firstItem = items[0];
            const snap = firstItem?.product_snapshot as any;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm"
              >
                <button
                  className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  {snap?.images?.[0] && (
                    <img src={snap.images[0]} alt={snap.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                      {snap?.name}{items.length > 1 ? ` + ${items.length - 1} more` : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-black text-gray-900 dark:text-white">{formatPrice(order.total)}</span>
                      <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-gray-100 dark:border-gray-800"
                    >
                      <div className="p-5 space-y-3">
                        {items.map(item => {
                          const s = item.product_snapshot as any;
                          return (
                            <div key={item.id} className="flex items-center gap-3">
                              {s?.images?.[0] && <img src={s.images[0]} alt={s.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{s?.name}</p>
                                <p className="text-xs text-gray-500">{item.size} · {item.color_name} · Qty {item.quantity}</p>
                              </div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white flex-shrink-0">{formatPrice(item.unit_price * item.quantity)}</p>
                            </div>
                          );
                        })}
                        <div className="pt-3 border-t border-gray-50 dark:border-gray-800 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Total</span>
                            <span className="font-black text-gray-900 dark:text-white">{formatPrice(order.total)}</span>
                          </div>
                        </div>
                        {order.status === 'delivered' && (
                          <Link
                            to={`/product/${firstItem?.product_id}`}
                            className="flex items-center justify-center gap-2 mt-2 py-2 text-sm text-purple-600 font-bold border border-purple-200 dark:border-purple-800 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                          >
                            Write a Review
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
