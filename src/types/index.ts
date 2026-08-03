// Product Types
export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  mrp: number;
  discount: number;
  rating: number;
  reviews: number;
  images: string[];
  colors: ProductColor[];
  sizes: string[];
  description: string;
  fabric: string;
  washCare: string[];
  inStock: boolean;
  stockCount: number;
  tags: string[];
  isNew: boolean;
  isTrending: boolean;
  isFlashSale: boolean;
  deliveryTime: number; // in minutes
  createdAt: string;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  slug: string;
  productCount: number;
  featured: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  productCount: number;
  gradient: string;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color: ProductColor;
}

export interface Cart {
  items: CartItem[];
  coupon: Coupon | null;
  giftCard: string | null;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  orders: Order[];
  wishlist: string[];
  createdAt: string;
}

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet';
  label: string;
  last4?: string;
  upiId?: string;
  isDefault: boolean;
}

// Order Types
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  address: Address;
  payment: PaymentDetails;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  total: number;
  coupon?: Coupon;
  estimatedDelivery: string;
  deliveryPartner?: DeliveryPartner;
  timeline: OrderTimeline[];
  createdAt: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  size: string;
  color: ProductColor;
  price: number;
}

export type OrderStatus = 
  | 'confirmed' 
  | 'processing' 
  | 'picked_up' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'cancelled' 
  | 'returned';

export interface OrderTimeline {
  status: OrderStatus;
  message: string;
  timestamp: string;
  completed: boolean;
}

export interface DeliveryPartner {
  name: string;
  phone: string;
  rating: number;
  photo: string;
  vehicle: string;
}

export interface PaymentDetails {
  method: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
}

// Coupon Types
export interface Coupon {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  description: string;
  validUntil: string;
}

// Review Types
export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  helpful: number;
  verified: boolean;
  createdAt: string;
}

// Filter Types
export interface FilterState {
  brands: string[];
  minPrice: number;
  maxPrice: number;
  sizes: string[];
  colors: string[];
  minRating: number;
  inStock: boolean;
  materials: string[];
  sortBy: SortOption;
  discount: number;
}

export type SortOption = 
  | 'newest' 
  | 'popularity' 
  | 'price_low_high' 
  | 'price_high_low' 
  | 'rating' 
  | 'discount';

// Notification Types
export interface Notification {
  id: string;
  type: 'order' | 'offer' | 'system' | 'delivery';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Search Types
export interface SearchResult {
  products: Product[];
  brands: Brand[];
  categories: Category[];
  suggestions: string[];
}
