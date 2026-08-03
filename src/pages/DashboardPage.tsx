import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Package, Heart, MapPin, CreditCard, Bell,
  RefreshCw, Settings, ChevronRight, Edit, Star, Zap, CheckCircle, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '@/store';
import { products } from '@/data';
import { formatPrice } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Confirmed', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  processing: { label: 'Processing', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
  picked_up: { label: 'Picked Up', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
  out_for_delivery: { label: 'Out for Delivery', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' },
  delivered: { label: 'Delivered', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  cancelled: { label: 'Cancelled', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
  returned: { label: 'Returned', color: 'text-gray-600 bg-gray-100 dark:bg-gray-800' },
};

const NAV_ITEMS = [
  { id: 'profile', label: 'My Profile', icon: <User size={16} /> },
  { id: 'orders', label: 'My Orders', icon: <Package size={16} /> },
  { id: 'wishlist', label: 'Wishlist', icon: <Heart size={16} /> },
  { id: 'addresses', label: 'Saved Addresses', icon: <MapPin size={16} /> },
  { id: 'payments', label: 'Payment Methods', icon: <CreditCard size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
];

export default function DashboardPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const { productIds } = useWishlistStore();
  const wishlistProducts = products.filter(p => productIds.includes(p.id)).slice(0, 4);

  // Live state
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Profile Edit State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;

    // Fetch Orders
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setLoadingOrders(false);
      });

    // Fetch Addresses
    supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .then(({ data }) => {
        setAddresses(data || []);
        setLoadingAddresses(false);
      });
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone,
        avatar_url: avatarUrl,
      })
      .eq('id', user.id);

    setSavingProfile(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Profile updated successfully!');
      await refreshProfile();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      toast.loading('Uploading image...', { id: 'upload' });

      // First check if avatars bucket exists or default to local URL/base64 for demo fallback if storage bucket isn't set up
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        // Fallback to FileReader/Base64 if bucket fails
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const { error: updateErr } = await supabase
            .from('profiles')
            .update({ avatar_url: base64data })
            .eq('id', user.id);

          if (updateErr) throw updateErr;
          setAvatarUrl(base64data);
          toast.success('Avatar updated!', { id: 'upload' });
          await refreshProfile();
        };
        reader.readAsDataURL(file);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateErr) throw updateErr;
        setAvatarUrl(publicUrl);
        toast.success('Avatar uploaded successfully!', { id: 'upload' });
        await refreshProfile();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload avatar', { id: 'upload' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex flex-col items-center text-center gap-3 mb-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-purple-500"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-black">
                      {(fullName || user?.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center cursor-pointer shadow hover:bg-purple-700 transition-colors">
                    <Edit size={12} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white text-lg">{fullName || 'Quickky Shopper'}</h3>
                  <p className="text-xs text-gray-400 break-all">{user?.email || user?.phone}</p>
                  <div className="flex items-center justify-center gap-1 mt-1.5">
                    <Zap size={11} className="text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                      Quickky Gold Member
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center border-t border-gray-100 dark:border-gray-800 pt-4">
                {[
                  { value: orders.length, label: 'Orders' },
                  { value: productIds.length, label: 'Wishlist' },
                  { value: addresses.length, label: 'Addresses' },
                ].map(stat => (
                  <div key={stat.label}>
                    <div className="font-black text-gray-900 dark:text-white text-base">{stat.value}</div>
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nav */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-3 shadow-sm border border-gray-100 dark:border-gray-800">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all mb-1 last:mb-0 ${
                    activeTab === item.id
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.icon}
                  {item.label}
                  <ChevronRight size={14} className="ml-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">My Orders</h2>
                  <Link to="/orders" className="text-sm text-purple-600 font-bold hover:underline">View History</Link>
                </div>

                {loadingOrders ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-purple-600" size={24} />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <Package size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No orders placed yet</p>
                    <Link to="/" className="text-purple-600 text-sm font-semibold hover:underline mt-2 block">Start Shopping</Link>
                  </div>
                ) : (
                  orders.slice(0, 3).map(order => {
                    const items = order.order_items || [];
                    const firstItem = items[0];
                    const snap = firstItem?.product_snapshot as any;
                    return (
                      <div key={order.id} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">#{order.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${STATUS_LABELS[order.status]?.color}`}>
                            {STATUS_LABELS[order.status]?.label}
                          </span>
                        </div>

                        {items.map((item: any, i: number) => {
                          const s = item.product_snapshot as any;
                          return (
                            <div key={i} className="flex items-center gap-4 py-3 border-t border-gray-100 dark:border-gray-800">
                              {s?.images?.[0] && (
                                <img src={s.images[0]} alt={s.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{s?.name}</p>
                                <p className="text-xs text-gray-400">Size: {item.size} · Color: {item.color_name}</p>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">{formatPrice(item.unit_price)}</p>
                              </div>
                            </div>
                          );
                        })}

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                          <div className="font-bold text-gray-900 dark:text-white">Total: {formatPrice(order.total)}</div>
                          <div className="flex gap-2">
                            <Link to="/track" className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-1.5 shadow-md shadow-purple-500/20">
                              <Zap size={12} /> Track Order
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800"
              >
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6">My Profile</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-sm outline-none text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
                  >
                    {savingProfile ? <Loader2 size={16} className="animate-spin" /> : null}
                    {savingProfile ? 'Saving...' : 'Save Profile Details'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Wishlist ({productIds.length})</h2>
                  <Link to="/wishlist" className="text-sm text-purple-600 font-bold hover:underline">View All</Link>
                </div>
                {wishlistProducts.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <Heart size={40} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No items in wishlist</p>
                    <Link to="/" className="text-purple-600 text-sm font-semibold hover:underline mt-2 block">Start Shopping</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {wishlistProducts.map(product => (
                      <Link key={product.id} to={`/product/${product.slug}`} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden group shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="aspect-square overflow-hidden">
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="p-3">
                          <p className="text-[10px] text-purple-600 font-medium uppercase tracking-wider">{product.brand}</p>
                          <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 mt-0.5">{product.name}</p>
                          <p className="text-sm font-black text-purple-600 mt-1">{formatPrice(product.price)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Saved Addresses ({addresses.length})</h2>
                  <Link to="/addresses" className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 shadow-md shadow-purple-500/20">Manage Addresses</Link>
                </div>
                {loadingAddresses ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-purple-600" size={24} />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <MapPin size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No saved addresses found</p>
                  </div>
                ) : (
                  addresses.map((addr, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm flex items-start justify-between border border-gray-100 dark:border-gray-800">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900 dark:text-white">{addr.label}</span>
                          {addr.is_default && <Badge variant="delivery" className="text-[10px]">Default</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">{addr.full_name} · {addr.phone}</p>
                        <p className="text-sm text-gray-500">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                        <p className="text-sm text-gray-500">{addr.city}, {addr.state} - {addr.pincode}</p>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* Generic empty state for other tabs */}
            {!['orders', 'profile', 'wishlist', 'addresses'].includes(activeTab) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-3xl p-12 shadow-sm text-center border border-gray-100 dark:border-gray-800"
              >
                <div className="text-5xl mb-4 text-purple-500 flex justify-center">
                  {NAV_ITEMS.find(n => n.id === activeTab)?.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 capitalize">{activeTab}</h3>
                <p className="text-gray-500">This section is coming soon!</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
