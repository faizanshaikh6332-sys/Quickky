import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { flashSaleProducts } from '@/data';
import ProductCard from '@/components/product/ProductCard';

function useCountdown(targetHours: number) {
  const [time, setTime] = useState(() => {
    const now = new Date();
    const end = new Date();
    end.setHours(end.getHours() + targetHours, 0, 0, 0);
    return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  });

  useEffect(() => {
    const interval = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;
  return { hours, minutes, seconds };
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center">
        <span className="text-2xl font-black text-white dark:text-gray-900 tabular-nums">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function FlashSale() {
  const { hours, minutes, seconds } = useCountdown(4);

  return (
    <section className="py-16 bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-10 gap-6">
          <div className="text-white text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
              <Zap size={24} className="fill-white" />
              <span className="text-xl font-black tracking-wider uppercase">Flash Sale</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black mb-1">Up to 70% OFF</h2>
            <p className="text-white/80 text-lg">Limited time offers on premium brands</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-white/80 text-sm font-medium mr-2">Ends in:</span>
            <TimeBlock value={hours} label="Hrs" />
            <span className="text-white text-3xl font-bold mb-5">:</span>
            <TimeBlock value={minutes} label="Min" />
            <span className="text-white text-3xl font-bold mb-5">:</span>
            <TimeBlock value={seconds} label="Sec" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {flashSaleProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/sale"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-orange-600 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-xl"
          >
            <Zap size={16} />
            View All Flash Deals
          </Link>
        </div>
      </div>
    </section>
  );
}
