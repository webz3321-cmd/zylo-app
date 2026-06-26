import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  addDoc
} from 'firebase/firestore';
import { Product, Order, Coupon, Review, User, CartItem, Category, Offer, HeroSlide, SiteSettings } from '../types';
import { INITIAL_PRODUCTS, INITIAL_COUPONS } from '../data/mockData';

// --- FIRESTORE ERROR HANDLING (as per skill) ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error Details: ', JSON.stringify(errInfo, null, 2));
  // We throw a descriptive error so the system can analyze it
  throw new Error(JSON.stringify(errInfo));
}

// Storage keys
const PRODUCTS_KEY = 'zylo_products';
const COUPONS_KEY = 'zylo_coupons';
const OFFERS_KEY = 'zylo_offers';
const HERO_KEY = 'zylo_hero';
const ORDERS_KEY = 'zylo_orders';
const REVIEWS_KEY = 'zylo_reviews';
const USER_KEY = 'zylo_user';
const CART_KEY = 'zylo_cart';
const WISHLIST_KEY = 'zylo_wishlist';
const SETTINGS_KEY = 'zylo_settings';
const DELETED_PRODUCTS_KEY = 'zylo_deleted_product_ids';
const DELETED_CATEGORIES_KEY = 'zylo_deleted_category_ids';

// Dual-mode Helper: Check if Firestore is active and reachable
async function isFirestoreActive(): Promise<boolean> {
  if (!db) return false;
  try {
    // Simple fast check using a public collection
    await getDocs(query(collection(db, 'products'), where('isActive', '==', true)));
    return true;
  } catch (e) {
    console.warn("Firestore connectivity check failed:", e);
    return false;
  }
}

// Initialise localStorage seeds if not already populated
function initLocalStore() {
  if (!localStorage.getItem(PRODUCTS_KEY)) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
  }
  if (!localStorage.getItem(COUPONS_KEY)) {
    localStorage.setItem(COUPONS_KEY, JSON.stringify(INITIAL_COUPONS));
  }
  if (!localStorage.getItem(ORDERS_KEY)) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify([]));
  }
  const existingReviewsRaw = localStorage.getItem(REVIEWS_KEY);
  let needsUpgrade = false;
  if (existingReviewsRaw) {
    try {
      const parsed = JSON.parse(existingReviewsRaw);
      if (parsed.length <= 2 || !parsed.some((r: any) => r.images && r.images.length > 0)) {
        needsUpgrade = true;
      }
    } catch {
      needsUpgrade = true;
    }
  }

  if (!existingReviewsRaw || needsUpgrade) {
    // Initial reviews seed with high-quality real product photos for premium look
    const initialReviews: Review[] = [
      {
        id: "rev-1",
        productId: "prod-1",
        userId: "user-1",
        userName: "Aarav Sharma",
        rating: 5,
        title: "Masterpiece of Horology!",
        comment: "The weight and luster of the obsidian steel casing are breathtaking. The Swiss movement is silent and absolutely flawless. Hands down the centerpiece of my collection.",
        date: "2026-05-12",
        images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800"],
        verified: true,
        likes: 18
      },
      {
        id: "rev-2",
        productId: "prod-2",
        userId: "user-2",
        userName: "Priya Singh",
        rating: 5,
        title: "Sublime Mysore Sandalwood",
        comment: "This has become my signature olfactive essence. Extremely long-lasting dry down with robust cardamom and iris notes. Truly luxurious presentation in the heavy crystal decanter.",
        date: "2026-06-01",
        images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800"],
        verified: true,
        likes: 34
      },
      {
        id: "rev-3",
        productId: "prod-3",
        userId: "user-3",
        userName: "Kabir Mehta",
        rating: 5,
        title: "Exceptional Saffiano Leather",
        comment: "The Saffiano cross-grain leather feels incredibly premium and resilient. I took it on a trans-Atlantic trip and it came back looking pristine. Hardware is stunning.",
        date: "2026-06-10",
        images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800"],
        verified: true,
        likes: 12
      },
      {
        id: "rev-4",
        productId: "prod-4",
        userId: "user-4",
        userName: "Ananya Iyer",
        rating: 5,
        title: "Monaco Classic Distinction",
        comment: "Beautiful gold filigree details along the temples. The polarized lenses are crystal clear under harsh Mediterranean sun. Comes in an exquisite leather magnetic hard case.",
        date: "2026-06-15",
        images: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800"],
        verified: true,
        likes: 21
      }
    ];
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(initialReviews));
  }
  if (!localStorage.getItem(OFFERS_KEY)) {
    const initialOffers: Offer[] = [
      {
        id: 'offer-1',
        title: 'New Arrivals 2026',
        description: 'Discover our latest premium collection.',
        image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=800',
        isActive: true
      }
    ];
    localStorage.setItem(OFFERS_KEY, JSON.stringify(initialOffers));
  }
  if (!localStorage.getItem(HERO_KEY)) {
    const initialHero: HeroSlide[] = [
      {
        id: 'hero-1',
        badge: 'NEW ARRIVALS',
        title: 'Premium Selection',
        description: 'Explore our curated range of luxury goods designed for quality.',
        image: 'https://images.unsplash.com/photo-1508685096489-7aac29145fe0?auto=format&fit=crop&q=80&w=2000',
        buttonText: 'SHOP NOW',
        link: '/shop',
        isActive: true
      }
    ];
    localStorage.setItem(HERO_KEY, JSON.stringify(initialHero));
  }
}

// Invoke seed setup
initLocalStore();

export const EcommerceService = {
  // Helper to check if initial seed was done to prevent re-seeding empty database collections
  async hasBeenSeeded(key: string): Promise<boolean> {
    if (!db) return false;
    try {
      const seedDoc = await getDoc(doc(db, 'settings', 'seed_status'));
      if (seedDoc.exists()) {
        const data = seedDoc.data();
        return !!data[key];
      }
    } catch (e) {
      console.warn("Error checking seed status:", e);
    }
    return false;
  },

  async setSeeded(key: string): Promise<void> {
    if (!db) return;
    try {
      await setDoc(doc(db, 'settings', 'seed_status'), { [key]: true }, { merge: true });
    } catch (e) {
      console.warn("Error setting seed status:", e);
    }
  },

  // ----------------------------------------------------
  // PRODUCTS SERVICE
  // ----------------------------------------------------
  async getProducts(): Promise<Product[]> {
    let fetchedProducts: Product[] = [];
    try {
      if (db) {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const products: Product[] = [];
        querySnapshot.forEach((doc) => {
          products.push({ id: doc.id, ...doc.data() } as Product);
        });

        const isSeeded = await this.hasBeenSeeded('products');
        if (products.length === 0 && !isSeeded) {
          // Empty firestore collection and has never been seeded before -> seed it with initial mock data
          const seedProducts = INITIAL_PRODUCTS;
          for (const p of seedProducts) {
            await setDoc(doc(db, 'products', p.id), p);
          }
          await this.setSeeded('products');
          fetchedProducts = seedProducts;
        } else {
          fetchedProducts = products;
        }
        // Always sync successfully fetched products to local storage to prevent deleted items from restoring
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(fetchedProducts));
      }
    } catch (e) {
      console.warn("Firestore products fetch failed. Utilizing localStorage backup.", e);
    }
    
    if (fetchedProducts.length === 0) {
      const localData = localStorage.getItem(PRODUCTS_KEY);
      fetchedProducts = localData ? JSON.parse(localData) : [...INITIAL_PRODUCTS];
    }

    return fetchedProducts;
  },

  async saveProduct(product: Product): Promise<void> {
    try {
      if (db) {
        await setDoc(doc(db, 'products', product.id), product);
      }
    } catch (e) {
      console.error("Firestore save product failed:", e);
    }
    
    // Always sync locally using localStorage directly to avoid stale Firestore reads
    const localData = localStorage.getItem(PRODUCTS_KEY);
    const products: Product[] = localData ? JSON.parse(localData) : [...INITIAL_PRODUCTS];
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  },

  async deleteProduct(productId: string): Promise<void> {
    try {
      if (db) {
        await deleteDoc(doc(db, 'products', productId));
      }
    } catch (e) {
      console.error("Firestore delete product failed:", e);
    }

    const localData = localStorage.getItem(PRODUCTS_KEY);
    const products: Product[] = localData ? JSON.parse(localData) : [...INITIAL_PRODUCTS];
    const updated = products.filter(p => p.id !== productId);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
  },

  // ----------------------------------------------------
  // REVIEWS SERVICE
  // ----------------------------------------------------
  async getReviews(productId?: string): Promise<Review[]> {
    try {
      if (db) {
        let q = collection(db, 'reviews');
        const querySnapshot = await getDocs(q);
        const reviews: Review[] = [];
        querySnapshot.forEach((doc) => {
          reviews.push({ id: doc.id, ...doc.data() } as Review);
        });
        if (reviews.length > 0) {
          return productId ? reviews.filter(r => r.productId === productId) : reviews;
        }
      }
    } catch (e) {
      console.warn("Firestore reviews failed. Falling back to local storage.", e);
    }

    const localData = localStorage.getItem(REVIEWS_KEY);
    const allReviews: Review[] = localData ? JSON.parse(localData) : [];
    return productId ? allReviews.filter(r => r.productId === productId) : allReviews;
  },

  async addReview(review: Review): Promise<void> {
    try {
      if (db) {
        await setDoc(doc(db, 'reviews', review.id), review);
      }
    } catch (e) {
      console.error("Firestore review add failed:", e);
    }

    const localData = localStorage.getItem(REVIEWS_KEY);
    const allReviews: Review[] = localData ? JSON.parse(localData) : [];
    allReviews.push(review);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));

    // Update product average rating
    const products = await this.getProducts();
    const product = products.find(p => p.id === review.productId);
    if (product) {
      const productReviews = allReviews.filter(r => r.productId === review.productId);
      const avgRating = parseFloat((productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1));
      product.rating = avgRating;
      product.ratingCount = productReviews.length;
      await this.saveProduct(product);
    }
  },

  async deleteReview(reviewId: string): Promise<void> {
    try {
      if (db) {
        await deleteDoc(doc(db, 'reviews', reviewId));
      }
    } catch (e) {
      console.error("Firestore delete review failed:", e);
    }

    const localData = localStorage.getItem(REVIEWS_KEY);
    const allReviews: Review[] = localData ? JSON.parse(localData) : [];
    const updated = allReviews.filter(r => r.id !== reviewId);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
  },

  // ----------------------------------------------------
  // COUPONS SERVICE
  // ----------------------------------------------------
  async getCoupons(): Promise<Coupon[]> {
    try {
      if (db) {
        const querySnapshot = await getDocs(collection(db, 'coupons'));
        if (!querySnapshot.empty) {
          const coupons: Coupon[] = [];
          querySnapshot.forEach((doc) => {
            coupons.push({ code: doc.id, ...doc.data() } as Coupon);
          });
          return coupons;
        } else {
          // Seed initial coupons
          for (const c of INITIAL_COUPONS) {
            await setDoc(doc(db, 'coupons', c.code), c);
          }
          return INITIAL_COUPONS;
        }
      }
    } catch (e) {
      console.warn("Firestore coupons failed. Utilizing localStorage fallback.", e);
    }

    const localData = localStorage.getItem(COUPONS_KEY);
    return localData ? JSON.parse(localData) : INITIAL_COUPONS;
  },

  async saveCoupon(coupon: Coupon): Promise<void> {
    try {
      if (db) {
        await setDoc(doc(db, 'coupons', coupon.code), coupon);
      }
    } catch (e) {
      console.error("Firestore save coupon failed:", e);
    }

    const coupons = await this.getCoupons();
    const index = coupons.findIndex(c => c.code.toUpperCase() === coupon.code.toUpperCase());
    if (index >= 0) {
      coupons[index] = coupon;
    } else {
      coupons.push(coupon);
    }
    localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
  },

  async deleteCoupon(code: string): Promise<void> {
    try {
      if (db) {
        await deleteDoc(doc(db, 'coupons', code));
      }
    } catch (e) {
      console.error("Firestore delete coupon failed:", e);
    }

    const coupons = await this.getCoupons();
    const updated = coupons.filter(c => c.code.toUpperCase() !== code.toUpperCase());
    localStorage.setItem(COUPONS_KEY, JSON.stringify(updated));
  },

  // ----------------------------------------------------
  // ORDERS SERVICE
  // ----------------------------------------------------
  // ----------------------------------------------------
  // ORDERS SERVICE
  // ----------------------------------------------------
  async getAddressDetailsByPincode(pincode: string): Promise<any | null> {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      if (data && data[0] && data[0].Status === 'Success') {
        return data[0].PostOffice[0];
      }
      return null;
    } catch (e) {
      console.error("Failed to fetch address details:", e);
      return null;
    }
  },

  async getOrders(userId?: string): Promise<Order[]> {
    try {
      if (db) {
        const ordersCollection = collection(db, 'orders');
        const q = userId ? query(ordersCollection, where('userId', '==', userId)) : ordersCollection;
        const querySnapshot = await getDocs(q);
        const orders: Order[] = [];
        querySnapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() } as Order);
        });
        return orders;
      }
    } catch (e) {
      console.warn("Firestore orders failed. Utilizing localStorage.", e);
    }

    const localData = localStorage.getItem(ORDERS_KEY);
    const allOrders: Order[] = localData ? JSON.parse(localData) : [];
    return userId ? allOrders.filter(o => o.userId === userId) : allOrders;
  },

  async createOrder(order: Order): Promise<void> {
    try {
      if (db) {
        try {
          await setDoc(doc(db, 'orders', order.id), order);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `orders/${order.id}`);
        }
      }
    } catch (e) {
      console.error("Firestore create order failed:", e);
    }

    const allOrders = await this.getOrders();
    allOrders.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(allOrders));

    // Deduct stock from products for each item purchased
    const products = await this.getProducts();
    for (const item of order.items) {
      const product = products.find(p => p.id === item.product.id);
      if (product && item.selectedVariant) {
        const variant = product.variants.find(v => v.id === item.selectedVariant?.id);
        if (variant) {
          variant.stock = Math.max(0, variant.stock - item.quantity);
          await this.saveProduct(product);
        }
      }
    }
  },

  async updateOrderItemStatus(orderId: string, itemId: string, status: CartItem['status']): Promise<void> {
    try {
      if (db) {
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDocs(collection(db, 'orders'));
        const orderData = docSnap.docs.find(d => d.id === orderId)?.data() as Order;
        if (orderData) {
          const items = orderData.items.map(i => i.id === itemId ? { ...i, status } : i);
          await setDoc(docRef, { items }, { merge: true });
        }
      }
    } catch (e) {
      console.error("Firestore update item status failed:", e);
    }

    const allOrders = await this.getOrders();
    const index = allOrders.findIndex(o => o.id === orderId);
    if (index >= 0) {
      allOrders[index].items = allOrders[index].items.map(i => i.id === itemId ? { ...i, status } : i);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(allOrders));
    }
  },

  async updateOrderStatus(orderId: string, status: Order['deliveryStatus'], trackingNumber?: string): Promise<void> {
    try {
      if (db) {
        const fields: Partial<Order> = { deliveryStatus: status };
        if (trackingNumber) fields.trackingNumber = trackingNumber;
        await setDoc(doc(db, 'orders', orderId), fields, { merge: true });
      }
    } catch (e) {
      console.error("Firestore update order status failed:", e);
    }

    const allOrders = await this.getOrders();
    const index = allOrders.findIndex(o => o.id === orderId);
    if (index >= 0) {
      allOrders[index].deliveryStatus = status;
      if (trackingNumber) {
        allOrders[index].trackingNumber = trackingNumber;
      }
      localStorage.setItem(ORDERS_KEY, JSON.stringify(allOrders));
    }
  },

  // ----------------------------------------------------
  // USER / AUTH SERVICE
  // ----------------------------------------------------
  getCurrentUser(): User | null {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  async syncUserToFirestore(user: User): Promise<User> {
    try {
      if (db) {
        // Skip check if primary admin
        let isAdmin = user.email.toLowerCase() === 'webz3321@gmail.com';
        
        if (!isAdmin) {
          try {
            // Check if user is in authorized admins list
            const adminDocPath = `authorized_admins/${user.email.toLowerCase()}`;
            const adminDoc = await getDoc(doc(db, 'authorized_admins', user.email.toLowerCase()));
            isAdmin = adminDoc.exists();
          } catch (e: any) {
            // If permission denied, they are likely just a customer
            if (e.message?.includes('permission') || e.code === 'permission-denied') {
              console.log("Customer login: Admin check restricted (intended behavior).");
              isAdmin = false;
            } else {
              handleFirestoreError(e, OperationType.GET, `authorized_admins/${user.email.toLowerCase()}`);
            }
          }
        }
        
        user.role = isAdmin ? 'admin' : 'customer';

        try {
          await setDoc(doc(db, 'users', user.uid), user, { merge: true });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
        }
      }
    } catch (e) {
      console.error("Firestore sync user failed:", e);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  async getAuthorizedAdmins(): Promise<string[]> {
    try {
      if (db) {
        const querySnapshot = await getDocs(collection(db, 'authorized_admins'));
        return querySnapshot.docs.map(doc => doc.id);
      }
    } catch (e) {
      console.warn("Firestore admin list fetch failed.", e);
    }
    return ['webz3321@gmail.com'];
  },

  async authorizeAdmin(email: string): Promise<void> {
    try {
      if (db) {
        await setDoc(doc(db, 'authorized_admins', email.toLowerCase()), { authorizedAt: new Date().toISOString() });
      }
    } catch (e) {
      console.error("Firestore authorize admin failed:", e);
    }
  },

  async revokeAdmin(email: string): Promise<void> {
    try {
      if (db) {
        await deleteDoc(doc(db, 'authorized_admins', email.toLowerCase()));
      }
    } catch (e) {
      console.error("Firestore revoke admin failed:", e);
    }
  },

  async saveUserAddresses(uid: string, addresses: User['addresses']): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.uid === uid) {
      currentUser.addresses = addresses;
      await this.syncUserToFirestore(currentUser);
    }
  },

  // ----------------------------------------------------
  // CATEGORIES SERVICE
  // ----------------------------------------------------
  async getCategories(): Promise<string[]> {
    const rich = await this.getRichCategories();
    return rich.map(c => c.name);
  },

  async getRichCategories(): Promise<Category[]> {
    const defaultCats: Category[] = [];

    let fetchedCats: Category[] = [];
    try {
      if (db) {
        const querySnapshot = await getDocs(collection(db, 'rich_categories'));
        const list: Category[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Category);
        });

        fetchedCats = list;
        // Always sync successfully fetched categories to localStorage to prevent deleted items from restoring
        localStorage.setItem('zylo_rich_categories', JSON.stringify(fetchedCats));
      }
    } catch (e) {
      console.warn("Firestore rich categories fetch failed.", e);
    }

    if (fetchedCats.length === 0) {
      const local = localStorage.getItem('zylo_rich_categories');
      if (local) {
        fetchedCats = JSON.parse(local);
      } else {
        localStorage.setItem('zylo_rich_categories', JSON.stringify([]));
        fetchedCats = [];
      }
    }

    return fetchedCats;
  },

  async saveCategory(category: string): Promise<void> {
    const formatted = category.trim();
    if (!formatted) return;
    const richCat: Category = {
      id: formatted.toLowerCase().replace(/\s+/g, '-'),
      name: formatted,
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=300',
      description: 'Newly curated boutique selection.'
    };
    await this.saveRichCategory(richCat);
  },

  async saveRichCategory(category: Category): Promise<void> {
    try {
      if (db) {
        await setDoc(doc(db, 'rich_categories', category.id), category, { merge: true });
      }
    } catch (e) {
      console.error("Firestore save rich category failed:", e);
    }
    
    const local = localStorage.getItem('zylo_rich_categories');
    const cats: Category[] = local ? JSON.parse(local) : [];
    
    const idx = cats.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      cats[idx] = category;
    } else {
      cats.push(category);
    }
    localStorage.setItem('zylo_rich_categories', JSON.stringify(cats));
  },

  async deleteCategory(id: string): Promise<void> {
    try {
      if (db) {
        await deleteDoc(doc(db, 'rich_categories', id));
      }
    } catch (e) {
      console.error("Firestore delete rich category failed:", e);
    }
    
    const local = localStorage.getItem('zylo_rich_categories');
    const cats: Category[] = local ? JSON.parse(local) : [];
    
    const filtered = cats.filter(c => c.id !== id);
    localStorage.setItem('zylo_rich_categories', JSON.stringify(filtered));
  },

  // ----------------------------------------------------
  // OFFERS SERVICE
  // ----------------------------------------------------
  async getOffers(): Promise<Offer[]> {
    try {
      if (db) {
        const querySnapshot = await getDocs(collection(db, 'offers'));
        if (!querySnapshot.empty) {
          const list: Offer[] = [];
          querySnapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as Offer);
          });
          return list;
        }
      }
    } catch (e) {
      console.warn("Firestore offers fetch failed.", e);
    }

    const local = localStorage.getItem(OFFERS_KEY);
    return local ? JSON.parse(local) : [];
  },

  async saveOffer(offer: Offer): Promise<void> {
    try {
      if (db) {
        await setDoc(doc(db, 'offers', offer.id), offer, { merge: true });
      }
    } catch (e) {
      console.error("Firestore save offer failed:", e);
    }
    const offers = await this.getOffers();
    const idx = offers.findIndex(o => o.id === offer.id);
    if (idx >= 0) {
      offers[idx] = offer;
    } else {
      offers.push(offer);
    }
    localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));
  },

  async deleteOffer(id: string): Promise<void> {
    try {
      if (db) {
        await deleteDoc(doc(db, 'offers', id));
      }
    } catch (e) {
      console.error("Firestore delete offer failed:", e);
    }
    const offers = await this.getOffers();
    const filtered = offers.filter(o => o.id !== id);
    localStorage.setItem(OFFERS_KEY, JSON.stringify(filtered));
  },

  // ----------------------------------------------------
  // HERO SLIDES SERVICE
  // ----------------------------------------------------
  async getHeroSlides(): Promise<HeroSlide[]> {
    try {
      if (db) {
        const querySnapshot = await getDocs(collection(db, 'hero'));
        if (!querySnapshot.empty) {
          const list: HeroSlide[] = [];
          querySnapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as HeroSlide);
          });
          return list;
        }
      }
    } catch (e) {
      console.warn("Firestore hero fetch failed.", e);
    }
    const local = localStorage.getItem(HERO_KEY);
    return local ? JSON.parse(local) : [];
  },

  async saveHeroSlide(slide: HeroSlide): Promise<void> {
    try {
      if (db) {
        await setDoc(doc(db, 'hero', slide.id), slide, { merge: true });
      }
    } catch (e) {
      console.error("Firestore save hero slide failed:", e);
    }
    const slides = await this.getHeroSlides();
    const idx = slides.findIndex(s => s.id === slide.id);
    if (idx >= 0) {
      slides[idx] = slide;
    } else {
      slides.push(slide);
    }
    localStorage.setItem(HERO_KEY, JSON.stringify(slides));
  },

  async deleteHeroSlide(id: string): Promise<void> {
    try {
      if (db) {
        await deleteDoc(doc(db, 'hero', id));
      }
    } catch (e) {
      console.error("Firestore delete hero slide failed:", e);
    }
    const slides = await this.getHeroSlides();
    const filtered = slides.filter(s => s.id !== id);
    localStorage.setItem(HERO_KEY, JSON.stringify(filtered));
  },

  async getSiteSettings(): Promise<SiteSettings> {
    const defaultSettings: SiteSettings = {
      logoUrl: 'https://images.unsplash.com/photo-1583391733956-6c7827447678?auto=format&fit=crop&q=80&w=100',
      faviconUrl: 'https://images.unsplash.com/photo-1583391733956-6c7827447678?auto=format&fit=crop&q=80&w=32',
      brandName: 'Zylo'
    };

    try {
      if (db) {
        const settingsDoc = await getDoc(doc(db, 'settings', 'site'));
        if (settingsDoc.exists()) {
          return settingsDoc.data() as SiteSettings;
        }
      }
    } catch (e) {
      console.warn("Firestore settings fetch failed.", e);
    }

    const local = localStorage.getItem(SETTINGS_KEY);
    return local ? JSON.parse(local) : defaultSettings;
  },

  async saveSiteSettings(settings: SiteSettings): Promise<void> {
    try {
      if (db) {
        await setDoc(doc(db, 'settings', 'site'), settings, { merge: true });
      }
    } catch (e) {
      console.error("Firestore save settings failed:", e);
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    
    // Dynamically update favicon if browser supports it
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    (link as HTMLLinkElement).rel = 'icon';
    (link as HTMLLinkElement).href = settings.faviconUrl;
    if (!document.head.contains(link)) {
      document.head.appendChild(link);
    }
    document.title = settings.brandName;
  }
};
