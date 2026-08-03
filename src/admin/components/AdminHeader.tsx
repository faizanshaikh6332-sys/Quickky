import React, { useState } from 'react';
import { Menu, Bell, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '@supabase/supabase-js';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  user: User | null;
  role: string | null;
  onSignOut: () => void;
  onToggleSidebar: () => void;
}

export function AdminHeader({
  title,
  subtitle,
  actions,
  user,
  role,
  onSignOut,
  onToggleSidebar
}: AdminHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const initial = user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-black text-gray-900 dark:text-white leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions && (
          <div className="hidden sm:flex items-center gap-2 mr-2">
            {actions}
          </div>
        )}
        
        <button className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {initial}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setDropdownOpen(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-purple-600 font-semibold uppercase mt-1">
                      {role || 'Admin'}
                    </p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
