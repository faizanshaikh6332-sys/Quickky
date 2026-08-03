import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Check, Search, Compass, Navigation, ShieldCheck } from 'lucide-react';
import { useLocationStore } from '@/store';
import toast from 'react-hot-toast';

interface LocationModalProps {
  open: boolean;
  onClose: () => void;
}

const SAMBHAJI_NAGAR_AREAS = [
  { area: 'Nirala Bazar', pincode: '431001', desc: 'Central Shopping District' },
  { area: 'CIDCO Cannaught', pincode: '431003', desc: 'Commercial & Fashion Hub' },
  { area: 'Samarth Nagar', pincode: '431001', desc: 'Residential & Retail Hub' },
  { area: 'Kranti Chowk', pincode: '431005', desc: 'Jalna Road Connectivity' },
  { area: 'Usmanpura', pincode: '431005', desc: 'Textile & Heritage Center' },
  { area: 'Seven Hills', pincode: '431005', desc: 'Medical & Lifestyle Zone' },
  { area: 'Garkheda Parisar', pincode: '431009', desc: 'South Hub' },
  { area: 'Padampura', pincode: '431001', desc: 'Railway Station Area' },
];

export default function LocationModal({ open, onClose }: LocationModalProps) {
  const { city, pincode, area, setCity } = useLocationStore();
  const [customPincode, setCustomPincode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectArea = (item: { area: string; pincode: string }) => {
    setCity('Chhatrapati Sambhaji Nagar, Aurangabad', item.pincode, item.area);
    toast.success(`Location set to ${item.area}, Chhatrapati Sambhaji Nagar, Aurangabad (${item.pincode})`);
    onClose();
  };

  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPincode.length === 6) {
      setCity('Chhatrapati Sambhaji Nagar, Aurangabad', customPincode, `Area ${customPincode}`);
      toast.success(`Delivery location updated to pincode ${customPincode}`);
      onClose();
    } else {
      toast.error('Please enter a valid 6-digit Pincode');
    }
  };

  const filteredAreas = SAMBHAJI_NAGAR_AREAS.filter(
    a => a.area.toLowerCase().includes(searchQuery.toLowerCase()) || a.pincode.includes(searchQuery)
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-gray-800 z-10"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={20} className="text-yellow-300 animate-bounce" />
                <span className="font-extrabold text-sm uppercase tracking-widest text-purple-200">Exclusive Delivery Hub</span>
              </div>
              <h2 className="text-2xl font-black">Chhatrapati Sambhaji Nagar, Aurangabad</h2>
              <p className="text-white/80 text-xs mt-1">Select your area for 30-minute instant fashion delivery</p>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Current Active Location */}
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                    <Navigation size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">Current Selected Location</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white">
                      {area}, {city} — {pincode}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex-shrink-0">ACTIVE</span>
              </div>

              {/* Enter Pincode Form */}
              <form onSubmit={handlePincodeSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={customPincode}
                    onChange={e => setCustomPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter Pincode (e.g. 431001)"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition-colors"
                >
                  Apply
                </button>
              </form>

              {/* Popular Areas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Compass size={16} className="text-purple-600" /> Sambhaji Nagar Delivery Zones
                  </h3>
                  <span className="text-xs text-purple-600 font-bold">30-Min Delivery</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredAreas.map(item => {
                    const isSelected = area === item.area;
                    return (
                      <button
                        key={item.area}
                        onClick={() => handleSelectArea(item)}
                        className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 shadow-md'
                            : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:border-purple-300'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                            {item.area}
                            {isSelected && <Check size={14} className="text-purple-600" />}
                          </p>
                          <p className="text-xs text-gray-500">{item.desc} ({item.pincode})</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exclusive Hub Notice */}
              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl flex items-center gap-3">
                <ShieldCheck size={24} className="text-purple-600 flex-shrink-0" />
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                  ⚡ Quickky operates exclusively in <strong>Chhatrapati Sambhaji Nagar, Aurangabad</strong>. All orders are packed and dispatched locally in under 30 minutes.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
