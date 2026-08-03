import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchOverlay from '@/components/search/SearchOverlay';
import { useUIStore } from '@/store';

export default function Layout() {
  const { isDarkMode } = useUIStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col">
      <Navbar />
      <SearchOverlay />
      <CartDrawer />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: isDarkMode ? '#1a1a2e' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#111827',
            borderRadius: '12px',
            border: '1px solid',
            borderColor: isDarkMode ? '#374151' : '#E5E7EB',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            padding: '12px 16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#7C3AED', secondary: '#fff' },
          },
        }}
      />
    </div>
  );
}
