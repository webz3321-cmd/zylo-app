export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  subCategory: string;
  rating: number;
  ratingCount: number;
  variants: Variant[];
  features: string[];
  specs: Record<string, string>;
  isNew?: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
}

export interface Variant {
  id: string;
  name: string; // e.g. "Space Black", "Emerald Gold", "50ml", "100ml"
  type: 'color' | 'size' | 'volume';
  value: string; // e.g. "#111111", "#175A35", "50ml", "100ml"
  additionalPrice?: number;
  stock: number;
}

export interface CartItem {
  id: string; // unique item id (productId + variantId)
  product: Product;
  selectedVariant?: Variant;
  quantity: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  title: string;
  date: string;
  images?: string[];
  verified: boolean;
  likes: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: CartItem[];
  shippingAddress: Address;
  billingAddress: Address;
  couponCode?: string;
  discount: number;
  tax: number;
  shippingCharge: number;
  total: number;
  paymentMethod: 'stripe' | 'razorpay';
  paymentId: string;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  deliveryStatus: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  trackingNumber?: string;
  createdAt: string;
}

export interface Address {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minSpend?: number;
  expiryDate: string;
  isActive: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: 'customer' | 'admin';
  createdAt: string;
  addresses?: Address[];
  phone?: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  description?: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  image: string;
  code?: string;
  discountValue?: number;
  discountType?: 'percentage' | 'fixed';
  isActive: boolean;
  link?: string;
}

export interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  description: string;
  image: string;
  buttonText: string;
  link: string;
  isActive: boolean;
}
