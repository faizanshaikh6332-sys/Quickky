import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Store, Users, Package, Tag, ShoppingBag, 
  Percent, Image as ImageIcon, UserCircle, Bell, 
  BarChart2, Settings, Activity, X
} from 'lucide-react';

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
  role: string | null;
}

const navSections = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'Commerce',
    items: [
      { label: 'Shops', path: '/admin/shops', icon: Store },
      { label: 'Sellers', path: '/admin/sellers', icon: Users },
      { label: 'Products', path: '/admin/products', icon: Package },
      { label: 'Categories', path: '/admin/categories', icon: Tag },
      { label: 'Orders', path: '/admin/orders', icon: ShoppingBag }
    ]
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Coupons', path: '/admin/coupons', icon: Percent },
      { label: 'Banners', path: '/admin/banners', icon: ImageIcon }
    ]
  },
  {
    title: 'Users',
    items: [
      { label: 'Customers', path: '/admin/customers', icon: UserCircle },
      { label: 'Notifications', path: '/admin/notifications', icon: Bell }
    ]
  },
  {
    title: 'System',
    items: [
      { label: 'Reports', path: '/admin/reports', icon: BarChart2 },
      { label: 'Settings', path: '/admin/settings', icon: Settings },
      { label: 'Admin Logs', path: '/admin/logs', icon: Activity }
    ]
  }
];

export function AdminSidebar({ open, onClose, role }: AdminSidebarProps) {
  const location = useLocation();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gray-950 w-64 border-r border-gray-900">
      <div className="flex items-center justify-between px-6 h-16 border-b border-gray-900 shrink-0">
        <div className="flex items-center">
          <img src="/logo.png" alt="Quickky" className="h-8 w-auto" />
          <span className="text-xs text-purple-400 ml-2 font-bold tracking-widest uppercase mt-1">Admin</span>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        {navSections.map((section, idx) => (
          <div key={idx} className="mb-6">
            <h3 className="px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item, itemIdx) => {
                const isActive = location.pathname.startsWith(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={itemIdx}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-purple-600/20 text-purple-400 border-l-2 border-purple-500' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800 border-l-2 border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-900 shrink-0">
        <p className="text-xs text-gray-600 font-medium">Quickky Admin v1.0.0</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block h-screen sticky top-0 shrink-0 z-20">
        {sidebarContent}
      </div>

      <AnimatePresence>
        {open && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative z-10 h-full"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AdminSidebar;
