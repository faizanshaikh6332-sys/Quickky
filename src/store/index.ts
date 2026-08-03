import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product, ProductColor, Coupon, FilterState, Notification } from '@/types';
import { coupons } from '@/data';

// ─── Cart Store ───────────────────────────────────────────────────────────────
interface CartStore {
  items: CartItem[];
  coupon: Coupon | null;
  addItem: (product: Product, size: string, color: ProductColor) => void;
  removeItem: (productId: string, size: string, colorName: string) => void;
  updateQuantity: (productId: string, size: string, colorName: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      addItem: (product, size, color) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          i => i.product.id === product.id && i.size === size && i.color.name === color.name
        );
        if (existingIndex >= 0) {
          const newItems = [...items];
          newItems[existingIndex].quantity += 1;
          set({ items: newItems });
        } else {
          set({ items: [...items, { product, quantity: 1, size, color }] });
        }
      },
      removeItem: (productId, size, colorName) => {
        set(state => ({
          items: state.items.filter(
            i => !(i.product.id === productId && i.size === size && i.color.name === colorName)
          ),
        }));
      },
      updateQuantity: (productId, size, colorName, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId, size, colorName);
          return;
        }
        set(state => ({
          items: state.items.map(i =>
            i.product.id === productId && i.size === size && i.color.name === colorName
              ? { ...i, quantity }
              : i
          ),
        }));
      },
      clearCart: () => set({ items: [], coupon: null }),
      applyCoupon: (code) => {
        const coupon = coupons.find(c => c.code === code.toUpperCase());
        if (!coupon) return { success: false, message: 'Invalid coupon code' };
        const subtotal = get().getSubtotal();
        if (subtotal < coupon.minOrderValue) {
          return { success: false, message: `Minimum order value ₹${coupon.minOrderValue} required` };
        }
        set({ coupon });
        return { success: true, message: `Coupon applied! ${coupon.description}` };
      },
      removeCoupon: () => set({ coupon: null }),
      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      },
      getDiscount: () => {
        const { coupon, getSubtotal } = get();
        if (!coupon) return 0;
        const subtotal = getSubtotal();
        if (coupon.type === 'percentage') {
          const discount = Math.round(subtotal * coupon.value / 100);
          return coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
        }
        return coupon.value;
      },
      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const deliveryFee = subtotal > 499 ? 0 : 49;
        const tax = Math.round((subtotal - discount) * 0.05);
        return subtotal - discount + deliveryFee + tax;
      },
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: 'quickky-cart', storage: createJSONStorage(() => localStorage) }
  )
);

// ─── Wishlist Store ───────────────────────────────────────────────────────────
interface WishlistStore {
  productIds: string[];
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      addToWishlist: (id) => set(state => ({ productIds: [...state.productIds, id] })),
      removeFromWishlist: (id) => set(state => ({ productIds: state.productIds.filter(p => p !== id) })),
      toggleWishlist: (id) => {
        if (get().isWishlisted(id)) {
          get().removeFromWishlist(id);
        } else {
          get().addToWishlist(id);
        }
      },
      isWishlisted: (id) => get().productIds.includes(id),
    }),
    { name: 'quickky-wishlist', storage: createJSONStorage(() => localStorage) }
  )
);

// ─── UI Store ─────────────────────────────────────────────────────────────────
interface UIStore {
  isDarkMode: boolean;
  isSearchOpen: boolean;
  isCartOpen: boolean;
  isMobileMenuOpen: boolean;
  isQuickViewOpen: boolean;
  quickViewProductId: string | null;
  notifications: Notification[];
  toggleDarkMode: () => void;
  setSearchOpen: (v: boolean) => void;
  setCartOpen: (v: boolean) => void;
  setMobileMenuOpen: (v: boolean) => void;
  openQuickView: (productId: string) => void;
  closeQuickView: () => void;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAllRead: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      isSearchOpen: false,
      isCartOpen: false,
      isMobileMenuOpen: false,
      isQuickViewOpen: false,
      quickViewProductId: null,
      notifications: [
        {
          id: 'n1',
          type: 'offer',
          title: 'Flash Sale is LIVE! 🔥',
          message: 'Up to 70% off on top brands. Limited time only!',
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'n2',
          type: 'delivery',
          title: 'Order Delivered! 🎉',
          message: 'Your Nike Air Force 1 has been delivered.',
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
      toggleDarkMode: () => {
        const isDark = !get().isDarkMode;
        set({ isDarkMode: isDark });
        document.documentElement.classList.toggle('dark', isDark);
      },
      setSearchOpen: (v) => set({ isSearchOpen: v }),
      setCartOpen: (v) => set({ isCartOpen: v }),
      setMobileMenuOpen: (v) => set({ isMobileMenuOpen: v }),
      openQuickView: (id) => set({ isQuickViewOpen: true, quickViewProductId: id }),
      closeQuickView: () => set({ isQuickViewOpen: false, quickViewProductId: null }),
      addNotification: (n) => set(state => ({
        notifications: [
          {
            ...n,
            id: `n${Date.now()}`,
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...state.notifications,
        ],
      })),
      markAllRead: () => set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
      })),
    }),
    {
      name: 'quickky-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isDarkMode: state.isDarkMode }),
    }
  )
);

// ─── Filter Store ─────────────────────────────────────────────────────────────
const DEFAULT_FILTERS: FilterState = {
  brands: [],
  minPrice: 0,
  maxPrice: 100000,
  sizes: [],
  colors: [],
  minRating: 0,
  inStock: false,
  materials: [],
  sortBy: 'popularity',
  discount: 0,
};

interface FilterStore {
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterStore>()((set) => ({
  filters: DEFAULT_FILTERS,
  setFilter: (key, value) =>
    set(state => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));

// ─── Compare Store ────────────────────────────────────────────────────────────
interface CompareStore {
  productIds: string[];
  addToCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
}

export const useCompareStore = create<CompareStore>()((set) => ({
  productIds: [],
  addToCompare: (id: string) => set((state: CompareStore) => {
    if (state.productIds.includes(id) || state.productIds.length >= 3) return state;
    return { productIds: [...state.productIds, id] };
  }),
  removeFromCompare: (id: string) => set((state: CompareStore) => ({ productIds: state.productIds.filter((p: string) => p !== id) })),
  clearCompare: () => set({ productIds: [] }),
}));

// ─── Location Store ───────────────────────────────────────────────────────────
interface LocationState {
  city: string;
  pincode: string;
  area: string;
  stateName: string;
  setCity: (city: string, pincode?: string, area?: string) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      city: 'Chhatrapati Sambhaji Nagar, Aurangabad',
      pincode: '431001',
      area: 'Nirala Bazar',
      stateName: 'Maharashtra',
      setCity: (city, pincode = '431001', area = 'Nirala Bazar') =>
        set({ city, pincode, area, stateName: 'Maharashtra' }),
    }),
    {
      name: 'quickky-location',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

