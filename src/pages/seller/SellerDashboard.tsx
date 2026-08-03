import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart3,
  Tag, Settings, Zap, TrendingUp, TrendingDown, Eye, Edit,
  Plus, ChevronRight, Star, Bell, LogOut, Store,
  Loader2, AlertCircle, Check, X, RefreshCw
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Logo from '@/components/ui/Logo';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'products',  label: 'Products',   icon: Package },
  { id: 'orders',    label: 'Orders',     icon: ShoppingBag },
  { id: 'customers', label: 'Customers',  icon: Users },
  { id: 'analytics', label: 'Analytics',  icon: BarChart3 },
  { id: 'coupons',   label: 'Coupons',    icon: Tag },
  { id: 'settings',  label: 'Settings',   icon: Settings },
];

const STATUS_COLORS: Record<string, string> = {
  delivered:        'text-green-600 bg-green-50 dark:bg-green-900/20',
  out_for_delivery: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  processing:       'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
  confirmed:        'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  cancelled:        'text-red-600 bg-red-50 dark:bg-red-900/20',
  picked_up:        'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20',
  returned:         'text-gray-600 bg-gray-100 dark:bg-gray-800',
};

const STATUS_LABELS: Record<string, string> = {
  delivered:        'Delivered',
  out_for_delivery: 'Out for Delivery',
  processing:       'Processing',
  confirmed:        'Confirmed',
  cancelled:        'Cancelled',
  picked_up:        'Picked Up',
  returned:         'Returned',
};

// ── Mini bar-chart component (animated) ──────────────────────────────────────
function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-black text-gray-900 dark:text-white">Monthly Revenue</h3>
          <p className="text-xs text-gray-500">Last 6 months</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-black text-gray-900 dark:text-white">
            {formatPrice(data.reduce((s, d) => s + d.revenue, 0))}
          </div>
          <div className="text-xs text-green-600 font-semibold">Total</div>
        </div>
      </div>
      <div className="flex items-end gap-2 h-32">
        {data.map((d, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${(d.revenue / max) * 100}%` }}
            transition={{ delay: i * 0.07, duration: 0.5 }}
            className="flex-1 rounded-t-lg bg-gradient-to-t from-purple-600 to-blue-500 min-w-0"
          />
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        {data.map(d => (
          <div key={d.month} className="flex-1 text-center text-[9px] text-gray-400">{d.month}</div>
        ))}
      </div>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, change, up }: {
  label: string; value: string; icon: string; change: string; up: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
          up ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'
        }`}>
          {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {change}
        </span>
      </div>
      <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SellerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]   = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Auth + Shop ────────────────────────────────────────────────────────────
  const [user,    setUser]    = useState<any>(null);
  const [shop,    setShop]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ── Tab data ───────────────────────────────────────────────────────────────
  const [orders,    setOrders]    = useState<any[]>([]);
  const [products,  setProducts]  = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [coupons,   setCoupons]   = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);

  // ── Order filter ───────────────────────────────────────────────────────────
  const [orderFilter, setOrderFilter] = useState('All');

  // ── Settings form state ────────────────────────────────────────────────────
  const [shopForm, setShopForm] = useState<any>(null);
  const [savingShop, setSavingShop] = useState(false);

  // ── Add-product modal state ────────────────────────────────────────────────
  const [addProductForm, setAddProductForm] = useState<any>(null);
  const [addingProduct, setAddingProduct] = useState(false);

  // ─────────────────────────────────────────────────────────────────
  // FETCH: check auth + load seller shop
  // ─────────────────────────────────────────────────────────────────
  const bootstrap = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      navigate('/seller/login');
      return;
    }
    setUser(session.user);

    // Load seller's shop
    const { data: shopData } = await supabase
      .from('shops')
      .select('*')
      .eq('seller_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setShop(shopData);
    if (shopData) setShopForm(shopData);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  // ─────────────────────────────────────────────────────────────────
  // FETCH: Orders (for this seller's shop)
  // ─────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!shop) return;
    const { data } = await supabase
      .from('orders')
      .select(`*, order_items(*)`)
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setOrders(data || []);
  }, [shop]);

  // ─────────────────────────────────────────────────────────────────
  // FETCH: Products for this seller
  // ─────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });
    setProducts(data || []);
  }, [user]);

  // ─────────────────────────────────────────────────────────────────
  // FETCH: Unique customers who ordered from this shop
  // ─────────────────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    if (!shop) return;
    const { data: orderData } = await supabase
      .from('orders')
      .select('user_id, total, profiles(full_name, email, avatar_url)')
      .eq('shop_id', shop.id);

    if (!orderData) return;

    // Aggregate by user_id
    const map = new Map<string, any>();
    for (const o of orderData) {
      const uid = o.user_id;
      if (!uid) continue;
      if (!map.has(uid)) {
        map.set(uid, {
          ...(o.profiles as any),
          orders: 0,
          spent: 0,
        });
      }
      const entry = map.get(uid);
      entry.orders += 1;
      entry.spent  += Number(o.total);
    }
    setCustomers(Array.from(map.values()));
  }, [shop]);

  // ─────────────────────────────────────────────────────────────────
  // FETCH: Coupons for this shop
  // ─────────────────────────────────────────────────────────────────
  const fetchCoupons = useCallback(async () => {
    if (!shop) return;
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false });
    setCoupons(data || []);
  }, [shop]);

  // ─────────────────────────────────────────────────────────────────
  // FETCH: Revenue data (last 6 months)
  // ─────────────────────────────────────────────────────────────────
  const fetchRevenue = useCallback(async () => {
    if (!shop) return;
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        month: d.toLocaleString('default', { month: 'short' }),
        start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString(),
        end:   new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString(),
      });
    }
    const results = await Promise.all(
      months.map(async m => {
        const { data } = await supabase
          .from('orders')
          .select('total')
          .eq('shop_id', shop.id)
          .eq('status', 'delivered')
          .gte('created_at', m.start)
          .lte('created_at', m.end);
        const revenue = (data || []).reduce((s, o) => s + Number(o.total), 0);
        return { month: m.month, revenue };
      })
    );
    setRevenueData(results);
  }, [shop]);

  // Load data when tab changes
  useEffect(() => {
    if (!shop && !user) return;
    if (activeTab === 'dashboard') { fetchOrders(); fetchProducts(); fetchRevenue(); }
    if (activeTab === 'orders')    fetchOrders();
    if (activeTab === 'products')  fetchProducts();
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'coupons')   fetchCoupons();
  }, [activeTab, shop, user]);

  // ── Sign out ────────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/seller/login');
  };

  // ── Save shop settings ──────────────────────────────────────────────────────
  const saveShopSettings = async () => {
    if (!shop || !shopForm) return;
    setSavingShop(true);
    const { error } = await supabase
      .from('shops')
      .update({
        name:     shopForm.name,
        tagline:  shopForm.tagline,
        category: shopForm.category,
        city:     shopForm.city,
        phone:    shopForm.phone,
        email:    shopForm.email,
        about:    shopForm.about,
      })
      .eq('id', shop.id);
    setSavingShop(false);
    if (error) toast.error('Failed to save settings');
    else { toast.success('Settings saved!'); setShop({ ...shop, ...shopForm }); }
  };

  // ── Add product ─────────────────────────────────────────────────────────────
  const handleAddProduct = async () => {
    if (!addProductForm || !user || !shop) return;
    setAddingProduct(true);
    const slug = addProductForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    const { error } = await supabase.from('products').insert({
      seller_id:     user.id,
      shop_id:       shop.id,
      name:          addProductForm.name,
      slug,
      brand:         addProductForm.brand || null,
      description:   addProductForm.description || null,
      price:         Number(addProductForm.price),
      original_price: addProductForm.original_price ? Number(addProductForm.original_price) : null,
      stock:         Number(addProductForm.stock) || 0,
      category_slug: addProductForm.category_slug || null,
      images:        addProductForm.images ? [addProductForm.images] : [],
      sizes:         ['S', 'M', 'L', 'XL'],
      colors:        [{ name: 'Default', hex: '#000000' }],
      status:        'pending',
    });
    setAddingProduct(false);
    if (error) toast.error('Failed to add product: ' + error.message);
    else {
      toast.success('Product submitted for review!');
      setAddProductForm(null);
      fetchProducts();
    }
  };

  // ── Update order status ─────────────────────────────────────────────────────
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus as 'confirmed' | 'processing' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' })
      .eq('id', orderId);
    if (error) toast.error('Failed to update order');
    else { toast.success('Order status updated'); fetchOrders(); }
  };

  // ── Computed stats ──────────────────────────────────────────────────────────
  const totalRevenue     = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + Number(o.total), 0);
  const todayOrders      = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length;
  const avgRating        = shop?.rating || 0;
  const activeProducts   = products.filter(p => p.status === 'active').length;
  const pendingProducts  = products.filter(p => p.status === 'pending').length;

  const filteredOrders = orderFilter === 'All'
    ? orders
    : orders.filter(o => o.status.toLowerCase().replace(/_/g, ' ').includes(orderFilter.toLowerCase()));

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // ── No shop state ────────────────────────────────────────────────────────────
  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={36} className="text-orange-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No Shop Found</h2>
          <p className="text-gray-500 mb-6">
            {shop === null
              ? "Your shop application is under review. You'll be notified once approved."
              : 'You need to register as a seller first.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/seller/register">
              <button className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors">
                Register Store
              </button>
            </Link>
            <button
              onClick={handleSignOut}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* ── Sidebar ── */}
      <aside className={`${
        sidebarOpen ? 'w-60' : 'w-16'
      } transition-all duration-300 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col h-screen sticky top-0 flex-shrink-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800">
          <Logo size="md" showSubtitle={false} />
        </div>

        {/* Store Info */}
        {sidebarOpen && (
          <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                {shop.logo_url
                  ? <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover rounded-xl" />
                  : <Store size={18} className="text-white" />}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{shop.name}</p>
                <p className="text-xs text-gray-500">
                  ⭐ {Number(shop.rating).toFixed(1)} · {products.length} products
                </p>
                {shop.status !== 'active' && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    shop.status === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
                    shop.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {shop.status.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Eye size={18} />
            {sidebarOpen && <span>View Store</span>}
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
            >
              <div className="space-y-1">
                <div className="w-4 h-0.5 bg-gray-600" />
                <div className="w-4 h-0.5 bg-gray-600" />
                <div className="w-4 h-0.5 bg-gray-600" />
              </div>
            </button>
            <div>
              <h1 className="font-black text-gray-900 dark:text-white capitalize">{activeTab}</h1>
              <p className="text-xs text-gray-500">{shop.name} · {shop.city}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (activeTab === 'orders')   fetchOrders();
                if (activeTab === 'products') fetchProducts();
              }}
              className="w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
            >
              <RefreshCw size={16} className="text-gray-500" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {(user?.email?.[0] || 'S').toUpperCase()}
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >

              {/* ══════════════════════════════ DASHBOARD ══════════════════════════════ */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Revenue"   value={formatPrice(totalRevenue)}  icon="💰" change={shop.total_revenue > 0 ? '+live' : '₹0'} up={totalRevenue > 0} />
                    <StatCard label="Orders Today"    value={String(todayOrders)}        icon="📦" change={todayOrders > 0 ? '+' + todayOrders : '0'} up={todayOrders > 0} />
                    <StatCard label="Active Products" value={String(activeProducts)}     icon="👗" change={pendingProducts > 0 ? `${pendingProducts} pending` : 'All live'} up={activeProducts > 0} />
                    <StatCard label="Avg Rating"      value={`${Number(avgRating).toFixed(1)} ★`} icon="⭐" change={shop.total_ratings > 0 ? `${shop.total_ratings} reviews` : 'No reviews'} up={avgRating >= 4} />
                  </div>

                  {/* Revenue Chart */}
                  <RevenueChart data={revenueData.length ? revenueData : [
                    { month: 'Jan', revenue: 0 }, { month: 'Feb', revenue: 0 },
                    { month: 'Mar', revenue: 0 }, { month: 'Apr', revenue: 0 },
                    { month: 'May', revenue: 0 }, { month: 'Jun', revenue: 0 },
                  ]} />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Orders */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-gray-900 dark:text-white">Recent Orders</h3>
                        <button onClick={() => setActiveTab('orders')} className="text-xs text-purple-600 font-semibold hover:underline">View all</button>
                      </div>
                      {orders.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>
                      ) : (
                        <div className="space-y-3">
                          {orders.slice(0, 4).map(o => (
                            <div key={o.id} className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  #{o.id.slice(0, 8).toUpperCase()}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(o.created_at).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(Number(o.total))}</p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] || 'text-gray-600 bg-gray-100'}`}>
                                  {STATUS_LABELS[o.status] || o.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Top Products */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-gray-900 dark:text-white">Your Products</h3>
                        <button onClick={() => setActiveTab('products')} className="text-xs text-purple-600 font-semibold hover:underline">View all</button>
                      </div>
                      {products.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-400 mb-3">No products yet</p>
                          <button
                            onClick={() => { setActiveTab('products'); setAddProductForm({}); }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors"
                          >
                            Add First Product
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {products.slice(0, 4).map(p => (
                            <div key={p.id} className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                                {p.images?.[0]
                                  ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                                  : <Package size={16} className="m-auto mt-2.5 text-gray-400" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mt-1">
                                  <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" style={{ width: `${Math.min((p.stock / 100) * 100, 100)}%` }} />
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs font-bold text-green-600">{formatPrice(Number(p.price))}</p>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                  p.status === 'active'  ? 'bg-green-100 text-green-700'  :
                                  p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                                }`}>{p.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════ PRODUCTS ══════════════════════════════ */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {products.length} products · {activeProducts} active · {pendingProducts} pending review
                    </p>
                    <button
                      onClick={() => setAddProductForm({ name: '', price: '', stock: '', brand: '', description: '', images: '', category_slug: '' })}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors"
                    >
                      <Plus size={15} /> Add Product
                    </button>
                  </div>

                  {/* Add Product Modal */}
                  <AnimatePresence>
                    {addProductForm !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white dark:bg-gray-900 rounded-2xl border border-purple-200 dark:border-purple-800 p-6 shadow-lg"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-black text-gray-900 dark:text-white">Add New Product</h3>
                          <button onClick={() => setAddProductForm(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {[
                            { key: 'name',          label: 'Product Name *',  type: 'text' },
                            { key: 'brand',         label: 'Brand',           type: 'text' },
                            { key: 'price',         label: 'Price (₹) *',     type: 'number' },
                            { key: 'original_price',label: 'Original Price',  type: 'number' },
                            { key: 'stock',         label: 'Stock Qty *',     type: 'number' },
                            { key: 'category_slug', label: 'Category Slug',   type: 'text' },
                            { key: 'images',        label: 'Image URL',       type: 'url' },
                          ].map(f => (
                            <div key={f.key} className={f.key === 'images' || f.key === 'name' ? 'col-span-2' : ''}>
                              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">{f.label}</label>
                              <input
                                type={f.type}
                                value={addProductForm[f.key] || ''}
                                onChange={e => setAddProductForm({ ...addProductForm, [f.key]: e.target.value })}
                                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all"
                              />
                            </div>
                          ))}
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Description</label>
                            <textarea
                              rows={2}
                              value={addProductForm.description || ''}
                              onChange={e => setAddProductForm({ ...addProductForm, description: e.target.value })}
                              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all resize-none"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setAddProductForm(null)}
                            className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddProduct}
                            disabled={addingProduct || !addProductForm.name || !addProductForm.price}
                            className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {addingProduct ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : <><Check size={14} /> Submit for Review</>}
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">Products go live after admin approval (usually within 24h)</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {products.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 border border-gray-100 dark:border-gray-800 text-center">
                      <Package size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="font-bold text-gray-500">No products yet</p>
                      <p className="text-sm text-gray-400">Add your first product to get started</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            {['Product', 'Category', 'Price', 'Stock', 'Status', 'Rating', 'Actions'].map(h => (
                              <th key={h} className="text-left text-xs font-bold text-gray-500 px-4 py-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                          {products.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                                    {p.images?.[0]
                                      ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                                      : <Package size={14} className="m-auto mt-3 text-gray-400" />}
                                  </div>
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white max-w-[160px] truncate">{p.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-300">
                                  {p.category_slug || '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(Number(p.price))}</span></td>
                              <td className="px-4 py-3">
                                <span className={`text-sm font-semibold ${Number(p.stock) < 10 ? 'text-orange-500' : 'text-gray-700 dark:text-gray-200'}`}>
                                  {p.stock}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                                  p.status === 'active'  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  p.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-gray-100 text-gray-600'
                                }`}>{p.status}</span>
                              </td>
                              <td className="px-4 py-3"><span className="text-sm font-bold text-amber-500">★ {Number(p.rating).toFixed(1)}</span></td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                                    <Eye size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════ ORDERS ══════════════════════════════ */}
              {activeTab === 'orders' && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
                    <h3 className="font-black text-gray-900 dark:text-white">
                      All Orders <span className="text-gray-400 font-normal text-sm">({orders.length})</span>
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      {['All', 'Confirmed', 'Processing', 'Delivered', 'Cancelled'].map(f => (
                        <button
                          key={f}
                          onClick={() => setOrderFilter(f)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            orderFilter === f
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-purple-100 hover:text-purple-700'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  {filteredOrders.length === 0 ? (
                    <div className="p-12 text-center">
                      <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="font-bold text-gray-500">No orders found</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          {['Order ID', 'Date', 'Amount', 'Status', 'Payment', 'Actions'].map(h => (
                            <th key={h} className="text-left text-xs font-bold text-gray-500 px-4 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {filteredOrders.map(o => (
                          <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3 text-sm font-bold text-purple-600">
                              #{o.id.slice(0, 8).toUpperCase()}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                              {formatPrice(Number(o.total))}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${STATUS_COLORS[o.status] || 'text-gray-600 bg-gray-100'}`}>
                                {STATUS_LABELS[o.status] || o.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                                o.payment_status === 'completed' ? 'bg-green-100 text-green-700' :
                                o.payment_status === 'pending'   ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                              }`}>{o.payment_status}</span>
                            </td>
                            <td className="px-4 py-3">
                              {o.status === 'confirmed' && (
                                <button
                                  onClick={() => updateOrderStatus(o.id, 'processing')}
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 transition-colors"
                                >
                                  Process
                                </button>
                              )}
                              {o.status === 'processing' && (
                                <button
                                  onClick={() => updateOrderStatus(o.id, 'out_for_delivery')}
                                  className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-lg font-bold hover:bg-purple-200 transition-colors"
                                >
                                  Ship
                                </button>
                              )}
                              {o.status === 'out_for_delivery' && (
                                <button
                                  onClick={() => updateOrderStatus(o.id, 'delivered')}
                                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg font-bold hover:bg-green-200 transition-colors"
                                >
                                  Delivered
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ══════════════════════════════ CUSTOMERS ══════════════════════════════ */}
              {activeTab === 'customers' && (
                <div>
                  <p className="text-sm text-gray-500 mb-4">{customers.length} unique customers</p>
                  {customers.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 border border-gray-100 dark:border-gray-800 text-center">
                      <Users size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="font-bold text-gray-500">No customers yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customers.map((c, i) => (
                        <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 flex items-center gap-4 shadow-sm">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center text-xl font-black text-purple-600 flex-shrink-0">
                            {(c.full_name?.[0] || c.email?.[0] || '?').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white">{c.full_name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">{c.email}</p>
                            <div className="flex gap-3 mt-1">
                              <span className="text-xs text-gray-500">{c.orders} orders</span>
                              <span className="text-xs font-bold text-green-600">{formatPrice(c.spent)} lifetime</span>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-gray-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════ ANALYTICS ══════════════════════════════ */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Orders',   value: String(orders.length),               icon: '📦', change: orders.length + ' total',        up: orders.length > 0 },
                      { label: 'Delivered',      value: String(orders.filter(o => o.status === 'delivered').length), icon: '✅', change: 'completed', up: true },
                      { label: 'Avg Order Value',value: formatPrice(orders.length ? totalRevenue / Math.max(orders.filter(o => o.status === 'delivered').length, 1) : 0), icon: '💳', change: 'per order', up: true },
                      { label: 'Total Revenue',  value: formatPrice(totalRevenue),            icon: '💰', change: 'from delivered', up: totalRevenue > 0 },
                    ].map(s => (
                      <StatCard key={s.label} {...s} />
                    ))}
                  </div>
                  <RevenueChart data={revenueData.length ? revenueData : [
                    { month: 'Jan', revenue: 0 }, { month: 'Feb', revenue: 0 },
                    { month: 'Mar', revenue: 0 }, { month: 'Apr', revenue: 0 },
                    { month: 'May', revenue: 0 }, { month: 'Jun', revenue: 0 },
                  ]} />
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                    <h3 className="font-black text-gray-900 dark:text-white mb-4">Order Status Breakdown</h3>
                    <div className="space-y-3">
                      {['confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'].map(status => {
                        const count = orders.filter(o => o.status === status).length;
                        const pct = orders.length ? Math.round((count / orders.length) * 100) : 0;
                        const colors: Record<string, string> = {
                          delivered: 'from-green-500 to-emerald-500',
                          confirmed: 'from-blue-500 to-indigo-500',
                          processing: 'from-orange-500 to-amber-500',
                          out_for_delivery: 'from-purple-500 to-violet-500',
                          cancelled: 'from-red-500 to-rose-500',
                        };
                        return (
                          <div key={status} className="flex items-center gap-3">
                            <span className="text-sm text-gray-700 dark:text-gray-200 w-36 capitalize">{STATUS_LABELS[status] || status}</span>
                            <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8 }}
                                className={`h-full rounded-full bg-gradient-to-r ${colors[status] || 'from-gray-400 to-gray-500'}`}
                              />
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white w-14 text-right">{count} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════ COUPONS ══════════════════════════════ */}
              {activeTab === 'coupons' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors">
                      <Plus size={15} /> Create Coupon
                    </button>
                  </div>
                  {coupons.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 border border-gray-100 dark:border-gray-800 text-center">
                      <Tag size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="font-bold text-gray-500">No coupons for your shop yet</p>
                      <p className="text-xs text-gray-400 mt-1">Contact admin to create shop-specific coupons</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {coupons.map(c => (
                        <div key={c.id} className={`rounded-2xl p-5 border-2 ${c.is_active ? 'border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-70'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Tag size={16} className="text-purple-500" />
                              <span className="font-black text-gray-900 dark:text-white tracking-wide">{c.code}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${c.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                              {c.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="font-bold text-gray-900 dark:text-white">{c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Min Order</span><span className="font-semibold text-gray-700 dark:text-gray-200">₹{c.min_order_value}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Used</span><span className="font-bold text-purple-600">{c.usage_count} times</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════ SETTINGS ══════════════════════════════ */}
              {activeTab === 'settings' && shopForm && (
                <div className="max-w-2xl space-y-6">
                  {/* Shop status banner */}
                  {shop.status !== 'active' && (
                    <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                      shop.status === 'pending'   ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
                      shop.status === 'suspended' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : ''
                    }`}>
                      <AlertCircle size={18} className={shop.status === 'pending' ? 'text-yellow-600' : 'text-red-600'} />
                      <div>
                        <p className={`font-bold text-sm ${shop.status === 'pending' ? 'text-yellow-800 dark:text-yellow-300' : 'text-red-800 dark:text-red-300'}`}>
                          Shop Status: {shop.status.toUpperCase()}
                        </p>
                        {shop.status === 'pending'   && <p className="text-xs text-yellow-700 dark:text-yellow-400">Your shop is under review. You'll be notified once approved.</p>}
                        {shop.status === 'suspended' && <p className="text-xs text-red-700 dark:text-red-400">Your shop has been suspended. {shop.reject_reason || 'Contact support.'}</p>}
                      </div>
                    </div>
                  )}

                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                    <h3 className="font-black text-gray-900 dark:text-white mb-5">Store Information</h3>
                    <div className="space-y-4">
                      {[
                        { key: 'name',    label: 'Store Name',        type: 'text' },
                        { key: 'tagline', label: 'Tagline',           type: 'text' },
                        { key: 'category',label: 'Category',          type: 'text' },
                        { key: 'city',    label: 'City',              type: 'text' },
                        { key: 'phone',   label: 'Phone',             type: 'tel'  },
                        { key: 'email',   label: 'Business Email',    type: 'email'},
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">{f.label}</label>
                          <input
                            type={f.type}
                            value={shopForm[f.key] || ''}
                            onChange={e => setShopForm({ ...shopForm, [f.key]: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all"
                          />
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">About</label>
                        <textarea
                          rows={3}
                          value={shopForm.about || ''}
                          onChange={e => setShopForm({ ...shopForm, about: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all resize-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={saveShopSettings}
                      disabled={savingShop}
                      className="mt-5 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingShop ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save Changes</>}
                    </button>
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                    <h3 className="font-black text-gray-900 dark:text-white mb-2">Shop Statistics</h3>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {[
                        { label: 'Total Sales',   value: String(shop.total_sales) },
                        { label: 'Total Revenue', value: formatPrice(Number(shop.total_revenue)) },
                        { label: 'Rating',        value: `${Number(shop.rating).toFixed(1)} / 5` },
                        { label: 'Reviews',       value: String(shop.total_ratings) },
                      ].map(s => (
                        <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                          <p className="text-xs text-gray-500">{s.label}</p>
                          <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
