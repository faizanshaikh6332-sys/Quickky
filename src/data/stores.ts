export interface Store {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logo: string;
  banner: string;
  ownerName: string;
  category: 'fashion' | 'footwear' | 'accessories' | 'jewellery' | 'kids' | 'sportswear' | 'medical' | 'ethnic';
  rating: number;
  totalRatings: number;
  deliveryTime: number; // minutes
  minOrder: number;
  city: string;
  address: string;
  pincode: string;
  lat: number;
  lng: number;
  productIds: string[];
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  isFeatured: boolean;
  isVerified: boolean;
  established: string;
  totalSales: number;
  about: string;
  tags: string[];
}

const BANNER_IMAGES = {
  fashion1: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=80',
  fashion2: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80',
  shoes: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80',
  luxury: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&q=80',
  ethnic: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200&q=80',
  sport: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=1200&q=80',
  medical: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&q=80',
  kids: 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=1200&q=80',
};

const LOGO_IMAGES = [
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&q=80',
  'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=200&q=80',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=200&q=80',
  'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=200&q=80',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&q=80',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80',
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&q=80',
  'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=200&q=80',
];

export const stores: Store[] = [
  {
    id: 'store-1',
    slug: 'the-fashion-hub',
    name: 'The Fashion Hub',
    tagline: 'Premium trends, 30-minute delivery',
    logo: LOGO_IMAGES[0],
    banner: BANNER_IMAGES.fashion1,
    ownerName: 'Rajesh Sharma',
    category: 'fashion',
    rating: 4.8,
    totalRatings: 2341,
    deliveryTime: 25,
    minOrder: 499,
    city: 'Chhatrapati Sambhaji Nagar, Aurangabad',
    address: '14, Nirala Bazar Main Road',
    pincode: '431001',
    lat: 19.8762,
    lng: 75.3433,
    productIds: ['p1', 'p3', 'p4', 'p8'],
    isOpen: true,
    openTime: '09:00',
    closeTime: '22:00',
    isFeatured: true,
    isVerified: true,
    established: '2021',
    totalSales: 48230,
    about: 'The Fashion Hub is Chhatrapati Sambhaji Nagar, Aurangabad\'s most loved multi-brand fashion store in Nirala Bazar. We curate the best from Nike, Zara, H&M, and more — delivered in under 30 minutes to your doorstep in Chhatrapati Sambhaji Nagar, Aurangabad.',
    tags: ['nike', 'zara', 'hm', 'levis', 'trending'],
  },
  {
    id: 'store-2',
    slug: 'sole-republic',
    name: 'Sole Republic',
    tagline: 'Every step, a statement',
    logo: LOGO_IMAGES[1],
    banner: BANNER_IMAGES.shoes,
    ownerName: 'Anika Mehta',
    category: 'footwear',
    rating: 4.7,
    totalRatings: 1892,
    deliveryTime: 28,
    minOrder: 699,
    city: 'Chhatrapati Sambhaji Nagar, Aurangabad',
    address: 'Shop 23, Prozone Mall Road, CIDCO',
    pincode: '431003',
    lat: 19.8715,
    lng: 75.3621,
    productIds: ['p2', 'p9', 'p11'],
    isOpen: true,
    openTime: '10:00',
    closeTime: '21:00',
    isFeatured: true,
    isVerified: true,
    established: '2020',
    totalSales: 32100,
    about: 'Sole Republic is Chhatrapati Sambhaji Nagar, Aurangabad\'s ultimate destination for sneakerheads at CIDCO. From Adidas Ultraboost to Nike Air Force 1, we stock the most coveted kicks delivered at lightning speed across Chhatrapati Sambhaji Nagar, Aurangabad.',
    tags: ['sneakers', 'adidas', 'nike', 'puma', 'running'],
  },
  {
    id: 'store-3',
    slug: 'luxe-collective',
    name: 'Luxe Collective',
    tagline: 'Luxury, redefined',
    logo: LOGO_IMAGES[2],
    banner: BANNER_IMAGES.luxury,
    ownerName: 'Priya Kapoor',
    category: 'accessories',
    rating: 4.9,
    totalRatings: 892,
    deliveryTime: 30,
    minOrder: 2999,
    city: 'Chhatrapati Sambhaji Nagar, Aurangabad',
    address: '8, Cannaught Place, CIDCO',
    pincode: '431003',
    lat: 19.8732,
    lng: 75.3654,
    productIds: ['p5', 'p6', 'p7', 'p10'],
    isOpen: true,
    openTime: '11:00',
    closeTime: '20:00',
    isFeatured: true,
    isVerified: true,
    established: '2019',
    totalSales: 18900,
    about: 'Luxe Collective brings the world\'s finest luxury brands to your doorstep in Chhatrapati Sambhaji Nagar, Aurangabad. From Gucci bags to Swiss watches, every item is 100% authentic.',
    tags: ['gucci', 'luxury', 'designer', 'watches', 'bags'],
  },
  {
    id: 'store-4',
    slug: 'kiddo-kingdom',
    name: 'Kiddo Kingdom',
    tagline: 'Little ones deserve the best',
    logo: LOGO_IMAGES[3],
    banner: BANNER_IMAGES.kids,
    ownerName: 'Sunita Joshi',
    category: 'kids',
    rating: 4.6,
    totalRatings: 1456,
    deliveryTime: 22,
    minOrder: 299,
    city: 'Chhatrapati Sambhaji Nagar, Aurangabad',
    address: '56, Samarth Nagar Main Road',
    pincode: '431001',
    lat: 19.8790,
    lng: 75.3340,
    productIds: ['p12'],
    isOpen: true,
    openTime: '09:00',
    closeTime: '20:00',
    isFeatured: false,
    isVerified: true,
    established: '2022',
    totalSales: 12300,
    about: 'Kiddo Kingdom specialises in premium kids fashion in Samarth Nagar, Chhatrapati Sambhaji Nagar, Aurangabad. Soft, safe, and stylish fashion for children delivered in 20 minutes.',
    tags: ['kids', 'children', 'baby', 'hm', 'zara-kids'],
  },
  {
    id: 'store-5',
    slug: 'sport-station',
    name: 'Sport Station',
    tagline: 'Gear up for greatness',
    logo: LOGO_IMAGES[4],
    banner: BANNER_IMAGES.sport,
    ownerName: 'Arjun Singh',
    category: 'sportswear',
    rating: 4.5,
    totalRatings: 2010,
    deliveryTime: 27,
    minOrder: 599,
    city: 'Chhatrapati Sambhaji Nagar, Aurangabad',
    address: '12, Jalna Road, Kranti Chowk',
    pincode: '431005',
    lat: 19.8690,
    lng: 75.3280,
    productIds: ['p2', 'p9', 'p11'],
    isOpen: true,
    openTime: '08:00',
    closeTime: '22:00',
    isFeatured: false,
    isVerified: true,
    established: '2020',
    totalSales: 28700,
    about: 'Sport Station Kranti Chowk is your go-to for all athletic gear in Chhatrapati Sambhaji Nagar, Aurangabad. Carrying Adidas, Puma, and Nike sportswear.',
    tags: ['sportswear', 'gym', 'running', 'adidas', 'nike'],
  },
  {
    id: 'store-6',
    slug: 'ethnic-roots',
    name: 'Ethnic Roots',
    tagline: 'Celebrate your culture in style',
    logo: LOGO_IMAGES[5],
    banner: BANNER_IMAGES.ethnic,
    ownerName: 'Kavita Desai',
    category: 'ethnic',
    rating: 4.7,
    totalRatings: 1230,
    deliveryTime: 30,
    minOrder: 799,
    city: 'Chhatrapati Sambhaji Nagar, Aurangabad',
    address: '88, Usmanpura Circle',
    pincode: '431005',
    lat: 19.8654,
    lng: 75.3210,
    productIds: ['p3', 'p8'],
    isOpen: true,
    openTime: '10:00',
    closeTime: '21:00',
    isFeatured: true,
    isVerified: true,
    established: '2021',
    totalSales: 19800,
    about: 'Ethnic Roots Usmanpura celebrates Himroo and Paithani tradition along with designer kurtas and sarees delivered fast across Chhatrapati Sambhaji Nagar, Aurangabad.',
    tags: ['ethnic', 'saree', 'kurta', 'indian', 'festive'],
  },
  {
    id: 'store-7',
    slug: 'medplus-pharmacy',
    name: 'MedPlus Pharmacy',
    tagline: 'Your health, our priority',
    logo: LOGO_IMAGES[6],
    banner: BANNER_IMAGES.medical,
    ownerName: 'Dr. Vinod Rao',
    category: 'medical',
    rating: 4.9,
    totalRatings: 4523,
    deliveryTime: 18,
    minOrder: 99,
    city: 'Chhatrapati Sambhaji Nagar, Aurangabad',
    address: '3, Seven Hills, Jalna Road',
    pincode: '431005',
    lat: 19.8700,
    lng: 75.3500,
    productIds: [],
    isOpen: true,
    openTime: '07:00',
    closeTime: '23:00',
    isFeatured: true,
    isVerified: true,
    established: '2018',
    totalSales: 89200,
    about: 'MedPlus Seven Hills is a trusted pharmacy delivering genuine medicines, supplements, and wellness products in 18 minutes in Chhatrapati Sambhaji Nagar, Aurangabad.',
    tags: ['medicines', 'pharmacy', 'health', 'wellness', 'supplements'],
  },
  {
    id: 'store-8',
    slug: 'golden-thread',
    name: 'Golden Thread',
    tagline: 'Where heritage meets haute couture',
    logo: LOGO_IMAGES[7],
    banner: BANNER_IMAGES.fashion2,
    ownerName: 'Meera Iyer',
    category: 'fashion',
    rating: 4.6,
    totalRatings: 987,
    deliveryTime: 30,
    minOrder: 999,
    city: 'Chhatrapati Sambhaji Nagar, Aurangabad',
    address: '45, Garkheda Parisar',
    pincode: '431009',
    lat: 19.8580,
    lng: 75.3520,
    productIds: ['p3', 'p8', 'p10'],
    isOpen: false,
    openTime: '11:00',
    closeTime: '20:00',
    isFeatured: false,
    isVerified: true,
    established: '2022',
    totalSales: 9800,
    about: 'Golden Thread Garkheda specialises in handcrafted fashion and Paithani artisan wear in Chhatrapati Sambhaji Nagar, Aurangabad.',
    tags: ['handcrafted', 'jewellery', 'fashion', 'statement', 'artisan'],
  },
];

export const storeReviews = [
  { id: 'sr1', storeId: 'store-1', userName: 'Priya S.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&q=80', rating: 5, text: 'Absolutely amazing store! Got my order in 22 minutes. The quality is unbelievable.', date: '2 days ago' },
  { id: 'sr2', storeId: 'store-1', userName: 'Rahul M.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&q=80', rating: 4, text: 'Great selection, quick delivery. Packaging was premium.', date: '4 days ago' },
  { id: 'sr3', storeId: 'store-2', userName: 'Anjali P.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&q=80', rating: 5, text: 'Best sneaker store in Chhatrapati Sambhaji Nagar, Aurangabad! Authentic products only.', date: '1 week ago' },
  { id: 'sr4', storeId: 'store-3', userName: 'Vikram K.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&q=80', rating: 5, text: 'Luxury items arrived in perfect condition. Certificate of authenticity included!', date: '3 days ago' },
];

export const getStoreBySlug = (slug: string): Store | undefined =>
  stores.find(s => s.slug === slug);

export const getNearbyStores = (limit = 4): Store[] =>
  stores.filter(s => s.isOpen).slice(0, limit);

export const getPopularStores = (limit = 4): Store[] =>
  [...stores].sort((a, b) => b.rating - a.rating).slice(0, limit);

export const getFashionStores = (limit = 4): Store[] =>
  stores.filter(s => ['fashion', 'footwear', 'accessories', 'jewellery', 'ethnic', 'kids', 'sportswear'].includes(s.category)).slice(0, limit);

export const getMedicalStores = (limit = 4): Store[] =>
  stores.filter(s => s.category === 'medical').slice(0, limit);

// Add storeId to product mapping
export const productToStore: Record<string, string> = {
  p1: 'store-1',
  p2: 'store-2',
  p3: 'store-1',
  p4: 'store-1',
  p5: 'store-3',
  p6: 'store-3',
  p7: 'store-3',
  p8: 'store-1',
  p9: 'store-5',
  p10: 'store-3',
  p11: 'store-2',
  p12: 'store-4',
};

export const getStoreForProduct = (productId: string): Store | undefined => {
  const storeId = productToStore[productId];
  return stores.find(s => s.id === storeId);
};
