import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { brands } from '@/data';

export default function BrandsSection() {
  const featured = brands.filter(b => b.featured);

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-10">
        <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest mb-1">Authenticity Guaranteed</p>
        <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white">Top Brands</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">500+ premium brands, all 100% authentic</p>
      </div>

      <div className="overflow-hidden">
        <div className="flex gap-8 items-center animate-marquee whitespace-nowrap">
          {[...featured, ...featured].map((brand, i) => (
            <Link
              key={`${brand.id}-${i}`}
              to={`/brand/${brand.slug}`}
              className="flex-shrink-0 group"
            >
              <div className="h-16 w-36 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all hover:shadow-lg px-4">
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="max-h-8 max-w-24 object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300 opacity-60 group-hover:opacity-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                  }}
                />
                <span className="hidden font-black text-sm text-gray-700 dark:text-gray-200">{brand.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
