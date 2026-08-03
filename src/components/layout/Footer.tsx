import { Link } from 'react-router-dom';
import { Zap, Mail, Phone, MapPin, ChevronRight } from 'lucide-react';
import Logo from '@/components/ui/Logo';

const FOOTER_LINKS = {
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Contact', href: '/contact' },
  ],
  Shop: [
    { label: 'Men', href: '/category/men' },
    { label: 'Women', href: '/category/women' },
    { label: 'Kids', href: '/category/kids' },
    { label: 'Luxury Collection', href: '/category/luxury' },
    { label: 'New Arrivals', href: '/new-arrivals' },
    { label: 'Sale', href: '/sale' },
  ],
  Support: [
    { label: 'FAQ', href: '/faq' },
    { label: 'Track Order', href: '/track' },
    { label: 'Return Policy', href: '/refund-policy' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

const PAYMENT_BADGES = ['VISA', 'Mastercard', 'UPI', 'Razorpay', 'GPay', 'PhonePe'];

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white mt-20">
      {/* Top section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Logo size="lg" variant="light" className="mb-4" />
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
              India's #1 premium fashion quick-commerce platform. Get the latest fashion delivered to your door in 30 minutes or less.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone size={14} className="text-purple-400" />
                <span>+91 1800-QUICKKY (toll free)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail size={14} className="text-purple-400" />
                <span>support@quickky.in</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={14} className="text-purple-400" />
                <span>Chhatrapati Sambhaji Nagar, Aurangabad</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                {
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  ),
                  href: '#',
                  color: 'hover:bg-pink-600',
                },
                {
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                    </svg>
                  ),
                  href: '#',
                  color: 'hover:bg-blue-500',
                },
                {
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  ),
                  href: '#',
                  color: 'hover:bg-blue-600',
                },
                {
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.56 49.56 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
                      <path d="m10 15 5-3-5-3z" />
                    </svg>
                  ),
                  href: '#',
                  color: 'hover:bg-red-600',
                },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className={`w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-all ${social.color}`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold text-white mb-4 text-sm tracking-wide uppercase">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="flex items-center gap-1 text-sm text-gray-400 hover:text-purple-400 transition-colors group"
                    >
                      <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 -ml-3 group-hover:ml-0 transition-all duration-300" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-12 border-t border-gray-800">
          <div className="max-w-xl">
            <h4 className="font-bold text-white mb-2">Subscribe to our newsletter</h4>
            <p className="text-sm text-gray-400 mb-4">Get exclusive offers, style tips and 10% off your first order</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-colors"
              />
              <button className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-blue-700 transition-all hover:-translate-y-0.5">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © 2025 Quickky Technologies Pvt. Ltd. All rights reserved. Made with ❤️ in India.
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs text-gray-600 mr-1">Accepted Payments:</span>
            {PAYMENT_BADGES.map(badge => (
              <span key={badge} className="px-2 py-1 bg-gray-800 rounded-md text-xs text-gray-300 font-medium">{badge}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
