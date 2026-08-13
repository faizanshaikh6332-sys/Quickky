import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import HomePage from '@/pages/Home';
import CategoryPage from '@/pages/CategoryPage';
import ProductDetails from '@/pages/ProductDetails';
import WishlistPage from '@/pages/WishlistPage';
import CheckoutPage from '@/pages/CheckoutPage';
import TrackOrderPage from '@/pages/TrackOrderPage';
import DashboardPage from '@/pages/DashboardPage';
import AboutPage from '@/pages/AboutPage';
import NotFoundPage from '@/pages/NotFoundPage';
import SellerRegister from '@/pages/seller/SellerRegister';
import SellerLogin from '@/pages/seller/SellerLogin';
import SellerDashboard from '@/pages/seller/SellerDashboard';
import StorePage from '@/pages/StorePage';
import OrderHistoryPage from '@/pages/OrderHistoryPage';
import AddressesPage from '@/pages/AddressesPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// ─── Admin Portal Imports ────────────────────────────────────────────────────
import AdminLogin from '@/admin/pages/AdminLogin';
import AdminResetPassword from '@/admin/pages/AdminResetPassword';
import AdminDashboard from '@/admin/pages/AdminDashboard';
import ShopsPage from '@/admin/pages/ShopsPage';
import SellersPage from '@/admin/pages/SellersPage';
import ProductsPage from '@/admin/pages/ProductsPage';
import CategoriesPage from '@/admin/pages/CategoriesPage';
import OrdersPage from '@/admin/pages/OrdersPage';
import CouponsPage from '@/admin/pages/CouponsPage';
import BannersPage from '@/admin/pages/BannersPage';
import CustomersPage from '@/admin/pages/CustomersPage';
import NotificationsPage from '@/admin/pages/NotificationsPage';
import SettingsPage from '@/admin/pages/SettingsPage';
import ReportsPage from '@/admin/pages/ReportsPage';
import AdminLogsPage from '@/admin/pages/AdminLogsPage';

// Simple inline pages for FAQ, Contact, Privacy, etc.
function FAQPage() {
  const faqs = [
    { q: 'How does 30-minute delivery work?', a: 'Quickky operates dark stores (mini-warehouses) stocked with thousands of fashion items across major cities. When you order, the nearest dark store picks, packs and dispatches instantly — delivering to your door in 30 minutes.' },
    { q: 'Is there a minimum order value?', a: 'No minimum order! Delivery is FREE on orders above ₹499. Orders below ₹499 have a ₹49 delivery fee.' },
    { q: 'Can I return or exchange products?', a: 'Yes! We offer a hassle-free 30-day return/exchange policy. Initiate from your dashboard and we\'ll arrange pickup within 24 hours.' },
    { q: 'Are the products 100% authentic?', a: 'Absolutely. All products are sourced directly from brands or authorized distributors and come with authenticity certificates where applicable.' },
    { q: 'Which cities are covered?', a: 'Quickky operates exclusively across all pincodes of Chhatrapati Sambhaji Nagar, Aurangabad with 30-minute instant delivery!' },
    { q: 'What payment methods do you accept?', a: 'UPI (GPay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, and Cash on Delivery.' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">Frequently Asked Questions</h1>
          <p className="text-gray-500 mt-2">Everything you need to know about Quickky</p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
              <summary className="font-bold text-gray-900 dark:text-white cursor-pointer flex items-center justify-between list-none text-sm">
                {faq.q}
                <span className="text-purple-500 text-xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">Contact Us</h1>
          <p className="text-gray-500 mt-2">We're here to help — 24/7</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8">
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6">Send us a message</h2>
            <div className="space-y-4">
              <input placeholder="Your Name" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500" />
              <input placeholder="Email Address" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500" />
              <select className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500">
                <option>Order Issue</option>
                <option>Return Request</option>
                <option>Product Query</option>
                <option>Other</option>
              </select>
              <textarea placeholder="Your message..." rows={4} className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 resize-none" />
              <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all">
                Send Message
              </button>
            </div>
          </div>
          <div className="space-y-5">
            {[
              { icon: '📞', title: 'Call Us', desc: '+91 1800-QUICKKY\nMon–Sun, 6 AM – 11 PM' },
              { icon: '💬', title: 'Live Chat', desc: 'Chat with us in the app\nAvailable 24/7' },
              { icon: '📧', title: 'Email', desc: 'support@quickky.in\nReply within 2 hours' },
              { icon: '📍', title: 'Head Office', desc: 'Quickky Towers, Nirala Bazar\nChhatrapati Sambhaji Nagar, Aurangabad - 431001' },
            ].map(c => (
              <div key={c.title} className="flex items-start gap-4 p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                <span className="text-3xl">{c.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{c.title}</h3>
                  <p className="text-sm text-gray-500 whitespace-pre-line">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PolicyPage({ title, content }: { title: string; content: string }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-8">{title}</h1>
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{content}</p>
        </div>
      </div>
    </div>
  );
}

const PRIVACY_CONTENT = `Last updated: January 2025

At Quickky, we take your privacy seriously. This policy outlines how we collect, use, and protect your personal information.

1. INFORMATION WE COLLECT
We collect information you provide directly to us including name, email, phone number, delivery address, and payment details. We also collect usage data to improve our services.

2. HOW WE USE YOUR INFORMATION
Your information is used to process orders, send delivery updates, personalize your shopping experience, and communicate offers relevant to you.

3. DATA SECURITY
All data is encrypted using industry-standard 256-bit SSL encryption. We never store complete card details on our servers.

4. YOUR RIGHTS
You have the right to access, update, or delete your personal data at any time from your account settings.

For questions, contact: privacy@quickky.in`;

// AdminPage removed — replaced by full admin portal at /admin/*, /admin/login

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ─── Seller Portal — full-screen, no customer layout ──────────────── */}
        <Route path="/seller/register" element={<SellerRegister />} />
        <Route path="/seller/login" element={<SellerLogin />} />
        <Route path="/seller/dashboard" element={<SellerDashboard />} />

        {/* ─── Admin Portal — full-screen, separate app ─────────────────────── */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/reset-password" element={<AdminResetPassword />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/shops" element={<ShopsPage />} />
        <Route path="/admin/sellers" element={<SellersPage />} />
        <Route path="/admin/products" element={<ProductsPage />} />
        <Route path="/admin/categories" element={<CategoriesPage />} />
        <Route path="/admin/orders" element={<OrdersPage />} />
        <Route path="/admin/coupons" element={<CouponsPage />} />
        <Route path="/admin/banners" element={<BannersPage />} />
        <Route path="/admin/customers" element={<CustomersPage />} />
        <Route path="/admin/notifications" element={<NotificationsPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
        <Route path="/admin/logs" element={<AdminLogsPage />} />

        {/* Auth callback for Google OAuth */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* ─── Customer Website — with Navbar/Footer layout ─────────────────── */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/new-arrivals" element={<CategoryPage />} />
          <Route path="/trending" element={<CategoryPage />} />
          <Route path="/sale" element={<CategoryPage />} />
          <Route path="/offers" element={<CategoryPage />} />
          <Route path="/brands" element={<CategoryPage />} />
          <Route path="/brand/:slug" element={<CategoryPage />} />
          <Route path="/categories" element={<CategoryPage />} />
          <Route path="/search" element={<CategoryPage />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/track" element={<TrackOrderPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PolicyPage title="Privacy Policy" content={PRIVACY_CONTENT} />} />
          <Route path="/terms" element={<PolicyPage title="Terms of Service" content="Please read our terms carefully before using Quickky. By using our platform you agree to these terms." />} />
          <Route path="/refund-policy" element={<PolicyPage title="Refund Policy" content="We offer a 30-day no-questions-asked return policy on all products. Refunds are processed within 5-7 business days to your original payment method." />} />
          {/* Store pages (within main layout) */}
          <Route path="/store/:slug" element={<StorePage />} />
          <Route path="/stores" element={<StorePage />} />
          <Route path="/orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
          <Route path="/addresses" element={<ProtectedRoute><AddressesPage /></ProtectedRoute>} />
        </Route>

        {/* ─── Catch-all 404 — MUST be last, outside Layout ─────────────────── */}
        <Route path="*" element={<Layout />}>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
