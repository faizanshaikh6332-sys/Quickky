import { motion } from 'framer-motion';
import { Zap, MapPin, Phone, Package, CheckCircle, Truck, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

const TIMELINE = [
  { status: 'Order Confirmed', time: '2:34 PM', done: true, icon: <CheckCircle size={16} /> },
  { status: 'Processing at Warehouse', time: '2:36 PM', done: true, icon: <Package size={16} /> },
  { status: 'Picked up by Delivery Partner', time: '2:42 PM', done: true, icon: <Truck size={16} /> },
  { status: 'Out for Delivery', time: '2:45 PM', done: true, icon: <MapPin size={16} /> },
  { status: 'Delivered', time: 'Expected 3:04 PM', done: false, icon: <CheckCircle size={16} /> },
];

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Zap size={14} /> Live Tracking
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Track Your Order</h1>
          <p className="text-gray-500 mt-2">Order #QK789456 • Placed on 15 Feb 2025</p>
        </div>

        {/* ETA Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-6 text-white mb-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm mb-1">Estimated Arrival</p>
              <p className="text-4xl font-black">3:04 PM</p>
              <div className="flex items-center gap-1.5 mt-2 bg-white/20 px-3 py-1.5 rounded-full w-fit">
                <Clock size={13} />
                <span className="text-sm font-semibold">~19 minutes away</span>
              </div>
            </div>
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
              <Truck size={36} className="text-white" />
            </div>
          </div>
        </motion.div>

        {/* Delivery Partner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-5 mb-6 flex items-center gap-4 shadow-sm"
        >
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80"
            alt="Delivery Partner"
            className="w-14 h-14 rounded-2xl object-cover"
          />
          <div className="flex-1">
            <p className="font-black text-gray-900 dark:text-white">Ravi Kumar</p>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <span>4.9 • Honda Activa • KA05AB1234</span>
            </div>
          </div>
          <a href="tel:+919876543210" className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 hover:bg-purple-200 transition-colors">
            <Phone size={16} />
          </a>
        </motion.div>

        {/* Order Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-6 mb-6 shadow-sm"
        >
          <h3 className="font-black text-gray-900 dark:text-white mb-6">Order Timeline</h3>
          <div className="space-y-0">
            {TIMELINE.map((event, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    event.done ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}>
                    {event.icon}
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className={`w-0.5 h-10 mt-1 ${event.done ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                  )}
                </div>
                <div className={`pb-8 ${i === TIMELINE.length - 1 ? 'pb-0' : ''}`}>
                  <p className={`font-semibold text-sm ${event.done ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    {event.status}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-6 mb-8 shadow-sm"
        >
          <h3 className="font-black text-gray-900 dark:text-white mb-4">Items in this Order</h3>
          <div className="flex items-center gap-4">
            <img
              src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=100&q=80"
              alt="Nike Tee"
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div>
              <p className="text-xs text-purple-600 font-semibold">Nike</p>
              <p className="font-bold text-gray-900 dark:text-white text-sm">Nike Oversized Essential Tee</p>
              <p className="text-xs text-gray-500">Size: L • Color: Black • Qty: 1</p>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-3">
          <Link to="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full">View All Orders</Button>
          </Link>
          <Link to="/" className="flex-1">
            <Button variant="primary" className="w-full">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
