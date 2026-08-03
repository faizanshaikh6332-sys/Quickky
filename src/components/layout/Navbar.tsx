import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, Heart, Bell, User, Sun, Moon, Menu, X,
  ChevronDown, Zap, Tag, Sparkles, Package, ShieldCheck, Truck, Store,
  LogIn, LogOut, ShoppingBag, MapPin, ClipboardList
} from 'lucide-react';
import { useCartStore, useWishlistStore, useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import AuthModal from '@/components/auth/AuthModal';
import Logo from '@/components/ui/Logo';
import LocationModal from '@/components/layout/LocationModal';
import { useLocationStore } from '@/store';
import { useSyncStore, usePersistCart, usePersistWishlist } from '@/hooks/useSyncStore';

const NAV_LINKS = [
  { label: 'Categories', icon: <ChevronDown size={14} />, dropdown: true, href: '/categories' },
  { label: 'Offers', icon: <Tag size={14} />, href: '/offers' },
  { label: 'New Arrivals', icon: <Sparkles size={14} />, href: '/new-arrivals' },
  { label: 'Brands', href: '/brands' },
];

const CATEGORY_MENU = [
  { label: 'Men', href: '/category/men', emoji: '👔' },
  { label: 'Women', href: '/category/women', emoji: '👗' },
  { label: 'Kids', href: '/category/kids', emoji: '🧒' },
  { label: 'Shoes', href: '/category/shoes', emoji: '👟' },
  { label: 'Sneakers', href: '/category/sneakers', emoji: '👟' },
  { label: 'Watches', href: '/category/watches', emoji: '⌚' },
  { label: 'Perfumes', href: '/category/perfumes', emoji: '🌸' },
  { label: 'Bags', href: '/category/bags', emoji: '👜' },
  { label: 'Jewellery', href: '/category/jewellery', emoji: '💎' },
  { label: 'Accessories', href: '/category/accessories', emoji: '🕶️' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const location = useLocation();

  const { city, area, pincode } = useLocationStore();
  const { user, profile, signOut } = useAuth();
  const { notifications: dbNotifs, unreadCount, markAllRead } = useNotifications();

  const { getItemCount } = useCartStore();
  const { productIds: wishlistIds } = useWishlistStore();
  const {
    isDarkMode, toggleDarkMode,
    isSearchOpen, setSearchOpen,
    isCartOpen, setCartOpen,
    isMobileMenuOpen, setMobileMenuOpen,
  } = useUIStore();

  // Sync Supabase ↔ local stores
  useSyncStore();
  usePersistCart();
  usePersistWishlist();

  const cartCount = getItemCount();
  const wishlistCount = wishlistIds.length;
  const unreadNotifs = unreadCount;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setCategoryOpen(false);
    setProfileOpen(false);
  }, [location]);

  return (
    <>
      {/* Top Banner */}
      <div className="gradient-purple text-white text-center py-2 text-xs font-medium relative overflow-hidden">
        <div className="flex items-center justify-center gap-6 animate-marquee whitespace-nowrap">
          <span className="flex items-center gap-1.5"><Truck size={12} /> FREE delivery on orders above ₹499</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><Zap size={12} /> ⚡ 30-Minute Delivery Guaranteed in {city}</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> 100% Authentic Products</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><Package size={12} /> Easy 30-Day Returns</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><Truck size={12} /> FREE delivery on orders above ₹499</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><Zap size={12} /> ⚡ 30-Minute Delivery Guaranteed in {city}</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> 100% Authentic Products</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><Package size={12} /> Easy 30-Day Returns</span>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={cn(
          'sticky top-0 z-40 transition-all duration-300',
          scrolled
            ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl shadow-lg shadow-black/5'
            : 'bg-white dark:bg-gray-950'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 h-16">
            {/* Logo */}
            <Logo size="md" />

            {/* Location Selector Pill */}
            <button
              onClick={() => setLocationModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all text-xs font-bold border border-purple-100 dark:border-purple-800/40 group flex-shrink-0"
              title="Click to change location"
            >
              <MapPin size={14} className="text-purple-600 dark:text-purple-400 flex-shrink-0 group-hover:bounce" />
              <div className="flex flex-col text-left hidden sm:flex">
                <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium leading-none">Deliver to</span>
                <span className="truncate max-w-[120px] font-black leading-tight text-gray-900 dark:text-white">
                  {area ? `${area}, ${city}` : city}
                </span>
              </div>
              <span className="sm:hidden font-black text-gray-900 dark:text-white">{city}</span>
              <ChevronDown size={12} className="text-purple-500 flex-shrink-0" />
            </button>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1 ml-4">
              {NAV_LINKS.map(link => (
                <div key={link.label} className="relative">
                  {link.dropdown ? (
                    <button
                      onMouseEnter={() => setCategoryOpen(true)}
                      onMouseLeave={() => setCategoryOpen(false)}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                    >
                      {link.label}
                      <ChevronDown size={14} className={cn('transition-transform', categoryOpen && 'rotate-180')} />
                    </button>
                  ) : (
                    <Link
                      to={link.href || '/'}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                    >
                      {link.icon && <span>{link.icon}</span>}
                      {link.label}
                    </Link>
                  )}

                  {/* Category Dropdown */}
                  {link.dropdown && (
                    <AnimatePresence>
                      {categoryOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          onMouseEnter={() => setCategoryOpen(true)}
                          onMouseLeave={() => setCategoryOpen(false)}
                          className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
                        >
                          <div className="p-3 grid grid-cols-2 gap-1">
                            {CATEGORY_MENU.map(cat => (
                              <Link
                                key={cat.label}
                                to={cat.href}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
                              >
                                <span className="text-base">{cat.emoji}</span>
                                {cat.label}
                              </Link>
                            ))}
                          </div>
                          <div className="border-t border-gray-100 dark:border-gray-800 p-3">
                            <Link
                              to="/category/luxury"
                              className="flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 text-amber-700 dark:text-amber-400 text-sm font-bold hover:opacity-80 transition-opacity"
                            >
                              ✨ Luxury Collection
                              <ChevronDown className="-rotate-90" size={14} />
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </div>

            {/* Search Bar (Desktop) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex flex-1 max-w-sm items-center gap-2.5 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-all"
            >
              <Search size={15} />
              <span>Search products, brands...</span>
              <kbd className="ml-auto hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-gray-200 dark:bg-gray-700 text-gray-500">
                ⌘K
              </kbd>
            </button>

            {/* Right Actions */}
            <div className="flex items-center gap-1 ml-auto">
              {/* Search Mobile */}
              <button
                onClick={() => setSearchOpen(true)}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
              >
                <Search size={18} />
              </button>

              {/* Dark Mode */}
              <button
                onClick={toggleDarkMode}
                className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isDarkMode ? 'dark' : 'light'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                  </motion.div>
                </AnimatePresence>
              </button>

              {/* Notifications */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markAllRead(); }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300 relative"
                >
                  <Bell size={18} />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                        <button onClick={markAllRead} className="text-xs text-purple-600 font-medium">Mark all read</button>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {dbNotifs.length === 0 ? (
                          <div className="p-6 text-center text-sm text-gray-400">No notifications yet</div>
                        ) : (
                          dbNotifs.map(n => (
                            <div key={n.id} className={cn('px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0', !n.is_read && 'bg-purple-50 dark:bg-purple-900/10')}>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300 relative"
              >
                <Heart size={18} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={() => setCartOpen(!isCartOpen)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-purple-50 hover:text-purple-600 transition-colors text-gray-600 dark:text-gray-300"
              >
                <ShoppingCart size={18} />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Profile / Auth */}
              <div className="relative hidden sm:block">
                {user ? (
                  <>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 h-9 px-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          {(profile?.full_name || user.email || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-bold text-gray-900 dark:text-white max-w-20 truncate hidden md:block">
                        {profile?.full_name?.split(' ')[0] || 'Account'}
                      </span>
                    </button>
                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
                        >
                          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{profile?.full_name || 'User'}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email || user.phone}</p>
                          </div>
                          {[
                            { to: '/dashboard', icon: <User size={14} />, label: 'My Profile' },
                            { to: '/orders', icon: <ClipboardList size={14} />, label: 'My Orders' },
                            { to: '/wishlist', icon: <Heart size={14} />, label: 'Wishlist' },
                            { to: '/addresses', icon: <MapPin size={14} />, label: 'Addresses' },
                            { to: '/seller/dashboard', icon: <Store size={14} />, label: 'Seller Dashboard' },
                          ].map(item => (
                            <Link key={item.to} to={item.to} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-purple-600 transition-colors">
                              {item.icon} {item.label}
                            </Link>
                          ))}
                          <div className="border-t border-gray-100 dark:border-gray-800">
                            <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                              <LogOut size={14} /> Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 transition-colors text-sm font-bold text-gray-700 dark:text-gray-200"
                  >
                    <LogIn size={15} /> Sign In
                  </button>
                )}
              </div>

              {/* Become a Seller */}
              <Link
                to="/seller/register"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 whitespace-nowrap"
              >
                <Store size={13} />
                Sell on Quickky
              </Link>

              {/* Mobile Menu */}
              <button
                onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
              >
                {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {CATEGORY_MENU.map(cat => (
                  <Link
                    key={cat.label}
                    to={cat.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-200 font-medium"
                  >
                    <span>{cat.emoji}</span>
                    {cat.label}
                  </Link>
                ))}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-3 grid grid-cols-2 gap-2">
                  <Link to="/wishlist" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-600 font-medium text-sm">
                    <Heart size={14} /> Wishlist ({wishlistCount})
                  </Link>
                  <button onClick={toggleDarkMode} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium text-sm">
                    {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <Link to="/seller/register" className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm hover:opacity-90 transition-opacity">
                    <Store size={14} /> Sell on Quickky
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Auth Modal */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {/* Location Modal */}
      <LocationModal open={locationModalOpen} onClose={() => setLocationModalOpen(false)} />
    </>
  );
}
