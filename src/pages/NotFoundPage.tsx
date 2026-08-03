import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
      >
        <div className="relative mb-8">
          <div className="text-[150px] font-black text-gradient leading-none select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full bg-purple-500/10 blur-3xl" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <Zap size={20} className="text-purple-500" />
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Oops! Page Not Found</h1>
        </div>

        <p className="text-gray-500 max-w-md mb-8">
          Looks like this page took a detour. Even our 30-minute delivery can't find it!
          Let's get you back to great fashion.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button variant="primary" size="lg">
              <ArrowRight size={16} />
              Back to Home
            </Button>
          </Link>
          <Link to="/category/women">
            <Button variant="outline" size="lg">
              Browse Products
            </Button>
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6 text-sm text-gray-400">
          <Link to="/faq" className="hover:text-purple-600 transition-colors">FAQ</Link>
          <Link to="/contact" className="hover:text-purple-600 transition-colors">Contact Us</Link>
          <Link to="/track" className="hover:text-purple-600 transition-colors">Track Order</Link>
        </div>
      </motion.div>
    </div>
  );
}
