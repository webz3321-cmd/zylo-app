import React, { useState, useEffect } from 'react';
import { Product, CartItem, User, Category } from './types';
import { EcommerceService } from './lib/ecommerceService';
import Header from './components/Header';
import Hero from './components/Hero';
import Filters from './components/Filters';
import ProductCard from './components/ProductCard';
import ProductDetailsModal from './components/ProductDetailsModal';
import CheckoutModal from './components/CheckoutModal';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import FAQ from './components/FAQ';
import { 
  ShoppingBag, Trash2, Heart, X, Check, Mail, MapPin, Shield, Star, Lock, Eye, Compass, Phone, Sparkles, Search
} from 'lucide-react';

export default function App() {
  // Navigation & Screens
  const [activeScreen, setActiveScreen] = useState<'storefront' | 'shop' | 'dashboard' | 'admin' | 'auth'>('storefront');
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Cart & Wishlist state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  
  // Drawer Toggles
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  // Search/Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [maxPrice, setMaxPrice] = useState(6000);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Focus modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Authentication Fields (Auth Screen)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Newsletter Subscription state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState('');

  // Initial loads
  useEffect(() => {
    loadProducts();
    loadUser();
    loadCartAndWishlist();
  }, []);

  const loadProducts = async () => {
    const list = await EcommerceService.getProducts();
    setProducts(list);
    const cats = await EcommerceService.getRichCategories();
    setCategories(cats);
  };

  const loadUser = async () => {
    const user = EcommerceService.getCurrentUser();
    if (user) {
      // Sync with firestore to ensure roles are up to date
      const syncedUser = await EcommerceService.syncUserToFirestore(user);
      setCurrentUser(syncedUser);
    }
  };

  const loadCartAndWishlist = () => {
    const localCart = localStorage.getItem('zylo_cart');
    const localWishlist = localStorage.getItem('zylo_wishlist');
    if (localCart) setCart(JSON.parse(localCart));
    if (localWishlist) setWishlist(JSON.parse(localWishlist));
  };

  // Redirect to shop page if user interacts with filters on storefront
  useEffect(() => {
    if (activeScreen === 'storefront' && (selectedCategory !== 'All' || searchQuery !== '' || maxPrice !== 6000 || inStockOnly !== false)) {
      setActiveScreen('shop');
    }
  }, [selectedCategory, searchQuery, maxPrice, inStockOnly, activeScreen]);

  // Sync state functions
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('zylo_cart', JSON.stringify(newCart));
  };

  const saveWishlist = (newWish: string[]) => {
    setWishlist(newWish);
    localStorage.setItem('zylo_wishlist', JSON.stringify(newWish));
  };

  // ----------------------------------------------------
  // E-COMMERCE MUTATIONS
  // ----------------------------------------------------
  const handleAddToCart = (item: CartItem) => {
    const existingIdx = cart.findIndex(c => c.id === item.id);
    const updated = [...cart];

    if (existingIdx >= 0) {
      updated[existingIdx].quantity += item.quantity;
    } else {
      updated.push(item);
    }

    saveCart(updated);
    setIsCartOpen(true); // Open drawer as direct positive confirmation
    
    // Alert or confirmation toast could be placed here
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.id === id) {
        const currentStock = item.selectedVariant?.stock || 10;
        const newQty = Math.max(1, Math.min(item.quantity + delta, currentStock));
        return { ...item, quantity: newQty };
      }
      return item;
    });
    saveCart(updated);
  };

  const handleRemoveFromCart = (id: string) => {
    const updated = cart.filter(item => item.id !== id);
    saveCart(updated);
  };

  const handleToggleWishlist = (productId: string) => {
    const exists = wishlist.includes(productId);
    let updated: string[];
    if (exists) {
      updated = wishlist.filter(id => id !== productId);
    } else {
      updated = [...wishlist, productId];
    }
    saveWishlist(updated);
  };

  const handleMoveWishlistToCart = (product: Product) => {
    const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : undefined;
    handleAddToCart({
      id: `${product.id}-${firstVariant?.id || 'std'}`,
      product,
      selectedVariant: firstVariant,
      quantity: 1
    });
    // Remove from wishlist
    handleToggleWishlist(product.id);
  };

  // ----------------------------------------------------
  // AUTHENTICATION LOGIC
  // ----------------------------------------------------
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!email || !password) {
      setAuthError('Please enter secure credential logs.');
      return;
    }

    if (authMode === 'register' && !displayName) {
      setAuthError('Please enter your full legal name for the registry.');
      return;
    }

    // Direct simulated registration/login with Firestore User object sync
    if (authMode === 'register') {
      const newUser: User = {
        uid: `user-${Date.now()}`,
        email: email.trim(),
        displayName: displayName.trim(),
        role: 'customer',
        createdAt: new Date().toISOString(),
        addresses: []
      };

      await EcommerceService.syncUserToFirestore(newUser);
      setCurrentUser(newUser);
      setAuthSuccess('Registration successful. Access granted to private chamber.');
      setTimeout(() => {
        setActiveScreen('storefront');
      }, 1500);
    } else {
      // Login simulation - default user credentials check or fallback creation
      const normalizedEmail = email.trim().toLowerCase();
      
      // Strict credentials check for zyloadmin@gmail.com
      if (normalizedEmail === 'zyloadmin@gmail.com' && password !== 'admin1234') {
        setAuthError('Incorrect security keycode for Curator administration.');
        return;
      }

      const isCustomAdmin = normalizedEmail === 'admin@zylo.com' || normalizedEmail === 'zyloadmin@gmail.com';
      
      const newUser: User = {
        uid: isCustomAdmin ? (normalizedEmail === 'zyloadmin@gmail.com' ? 'admin-zylo-002' : 'admin-001') : `user-${Math.floor(Math.random() * 90000)}`,
        email: email.trim(),
        displayName: isCustomAdmin ? 'Grand Atelier Curator' : email.split('@')[0],
        role: 'customer', // default, updated by sync
        createdAt: new Date().toISOString(),
        addresses: []
      };

      const loggedUser = await EcommerceService.syncUserToFirestore(newUser);
      setCurrentUser(loggedUser);
      setAuthSuccess('Credentials authorized. Welcome, Curator.');
      setTimeout(() => {
        setActiveScreen(loggedUser.role === 'admin' ? 'admin' : 'storefront');
      }, 1500);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthSuccess('');
    
    try {
      const { auth } = await import('./lib/firebase');
      if (auth) {
        const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        if (user) {
          const newUser: User = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'Patron',
            role: 'customer', // default, will be updated by sync
            createdAt: new Date().toISOString(),
            addresses: []
          };
          
          const loggedUser = await EcommerceService.syncUserToFirestore(newUser);
          setCurrentUser(loggedUser);
          setAuthSuccess('Credentials authorized via Google. Welcome!');
          setTimeout(() => {
            setActiveScreen(loggedUser.role === 'admin' ? 'admin' : 'storefront');
          }, 1500);
          return;
        }
      }
    } catch (error: any) {
      console.warn("Firebase Google popup authentication blocked or failed, falling back to simulated high-end secure federated auth.", error);
    }
    
    // Fallback for sandboxed iframe environments where popups/redirects are disabled
    const simulatedEmail = prompt("To bypass browser iframe security blocks, please confirm your Google Account email:", currentUser?.email || "webz3321@gmail.com");
    if (simulatedEmail && simulatedEmail.trim()) {
      const gEmail = simulatedEmail.trim();
      const isCustomAdmin = gEmail.toLowerCase() === 'admin@zylo.com' || gEmail.toLowerCase() === 'zyloadmin@gmail.com';
      const loggedUser: User = {
        uid: `google-${Math.floor(Math.random() * 90000)}`,
        email: gEmail,
        displayName: gEmail.split('@')[0],
        role: isCustomAdmin ? 'admin' : 'customer',
        createdAt: new Date().toISOString(),
        addresses: []
      };
      
      await EcommerceService.syncUserToFirestore(loggedUser);
      setCurrentUser(loggedUser);
      setAuthSuccess('Credentials authorized via Google Account. Welcome!');
      setTimeout(() => {
        setActiveScreen(isCustomAdmin ? 'admin' : 'storefront');
      }, 1500);
    }
  };

  const handleQuickLogin = (role: 'customer' | 'admin') => {
    const quickUser: User = role === 'admin' ? {
      uid: 'admin-001',
      email: 'curator@zylo.com',
      displayName: 'Grand Curator',
      role: 'admin',
      createdAt: new Date().toISOString(),
      addresses: [
        {
          fullName: 'Grand Curator',
          phone: '+1 (555) 991-001',
          addressLine1: '88 Rue de la Princesse',
          city: 'Monaco',
          state: 'Monaco-Ville',
          postalCode: '98000',
          country: 'Monaco'
        }
      ]
    } : {
      uid: 'cust-102',
      email: 'member@zylo.com',
      displayName: 'Elizabeth Vanderbilt',
      role: 'customer',
      createdAt: new Date().toISOString(),
      addresses: [
        {
          fullName: 'Elizabeth Vanderbilt',
          phone: '+1 (555) 234-990',
          addressLine1: '742 Park Avenue Penthouse 4B',
          city: 'New York',
          state: 'NY',
          postalCode: '10021',
          country: 'United States'
        }
      ]
    };

    EcommerceService.syncUserToFirestore(quickUser);
    setCurrentUser(quickUser);
    setActiveScreen(role === 'admin' ? 'admin' : 'storefront');
  };

  const handleLogout = () => {
    localStorage.removeItem('zylo_user');
    setCurrentUser(null);
    setActiveScreen('storefront');
  };

  // ----------------------------------------------------
  // NEWSLETTER & SEARCH UTILITIES
  // ----------------------------------------------------
  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSuccess('Your transmission has been logged. Welcome to the Inner Circle.');
    setNewsletterEmail('');
    setTimeout(() => setNewsletterSuccess(''), 4000);
  };

  // Filter and sort core product listings
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesPrice = p.price <= maxPrice;
    
    // In-stock criteria checks if any of the variants has stock > 0
    const matchesStock = !inStockOnly || p.variants.some(v => v.stock > 0);

    return matchesSearch && matchesCategory && matchesPrice && matchesStock;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    // Featured rating fallback
    return b.ratingCount - a.ratingCount;
  });

  const trendingProducts = products.filter(p => p.isTrending);
  const bestSellingProducts = products.filter(p => p.isBestSeller);

  // Calculate pricing summary for cart
  const subtotal = cart.reduce((sum, item) => {
    const base = item.product.price;
    const additional = item.selectedVariant?.additionalPrice || 0;
    return sum + (base + additional) * item.quantity;
  }, 0);

  // Generate unique dynamic categories list
  const dynamicCategories: string[] = Array.from(new Set([
    'All',
    ...categories.map(c => c.name),
    ...(products.map(p => p.category).filter(Boolean) as string[])
  ]));

  return (
    <div className="min-h-screen bg-[#030303] text-gray-100 flex flex-col justify-between">
      {/* GLOBAL BLURRED FLOATING HEADER */}
      <Header
        cart={cart}
        wishlist={wishlist}
        currentUser={currentUser}
        onOpenCartDrawer={() => setIsCartOpen(true)}
        onOpenWishlistDrawer={() => setIsWishlistOpen(true)}
        onAuthClick={() => setActiveScreen('auth')}
        onLogout={handleLogout}
        onDashboardClick={() => setActiveScreen('dashboard')}
        onAdminClick={() => setActiveScreen('admin')}
        onSearchToggle={() => setShowSearchOverlay(true)}
        onHomeClick={() => setActiveScreen('storefront')}
        onShopClick={() => {
          setSelectedCategory('All');
          setSearchQuery('');
          setActiveScreen('shop');
        }}
      />

      {/* ========================================================
          SCREEN 1: THE MAIN STOREFRONT
          ======================================================== */}
      {activeScreen === 'storefront' && (
        <main className="space-y-16">
          {/* HIGH-FIDELITY HERO SLIDER */}
          <Hero onExploreClick={() => {
            const el = document.getElementById('catalog-anchor');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }} />

          {/* Anchor hook for exploring catalog */}
          <div id="catalog-anchor" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 pt-8">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-mono tracking-[0.3em] text-amber-500 uppercase block">Curated Collection</span>
              <h2 className="text-3xl sm:text-4xl font-sans tracking-tight text-white font-light">
                Inspect Our Private <span className="italic font-serif text-amber-100">Vaults</span>
              </h2>
              <p className="text-xs text-gray-400 font-sans max-w-md mx-auto">
                Understated elegance, masterfully finished, carrying certified NFC credentials.
              </p>
              <div className="h-[1px] w-12 bg-amber-500/50 mx-auto mt-4" />
            </div>

            {/* CIRCULAR LUXURY COLLECTIONS SELECTOR */}
            <div className="pt-4 pb-4">
              <span className="text-[10px] font-mono tracking-[0.2em] text-amber-500/70 uppercase block text-center mb-6">Select Salon Exhibition</span>
              
              <div className="flex flex-row overflow-x-auto lg:flex-wrap lg:justify-center gap-6 sm:gap-10 pb-4 px-2 scrollbar-none snap-x snap-mandatory justify-start">
                {/* "All" Category Node */}
                <div 
                  onClick={() => {
                    setSelectedCategory('All');
                    setActiveScreen('shop');
                  }}
                  className="group flex flex-col items-center space-y-3 cursor-pointer text-center shrink-0 snap-center"
                >
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border transition-all duration-300 relative ${
                    selectedCategory === 'All'
                      ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'border-white/10 bg-white/5 hover:border-amber-500/40 hover:bg-white/10'
                  }`}>
                    <span className="text-xs font-mono tracking-widest text-white font-bold group-hover:text-amber-400 transition-colors">ALL</span>
                    {selectedCategory === 'All' && (
                      <span className="absolute -bottom-1 bg-amber-500 w-1.5 h-1.5 rounded-full shadow-[0_0_8px_#f59e0b]"></span>
                    )}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-mono tracking-wider uppercase transition-colors ${
                    selectedCategory === 'All' ? 'text-amber-400 font-medium' : 'text-gray-400 group-hover:text-white'
                  }`}>
                    All Vaults
                  </span>
                </div>

                {/* Rich Circular Category Items */}
                {categories.map((cat) => {
                  const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                  return (
                    <div 
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setActiveScreen('shop');
                      }}
                      className="group flex flex-col items-center space-y-3 cursor-pointer text-center shrink-0 snap-center"
                    >
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border transition-all duration-500 relative bg-black/40 ${
                        isSelected
                          ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-105'
                          : 'border-white/10 group-hover:border-amber-500/40 group-hover:scale-105'
                      }`}>
                        <img 
                          src={cat.image} 
                          alt={cat.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=150';
                          }}
                        />
                        {/* Smooth dark overlay on hover / active */}
                        <div className={`absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300 ${isSelected ? 'bg-transparent' : ''}`} />
                        
                        {isSelected && (
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 w-1.5 h-1.5 rounded-full shadow-[0_0_8px_#f59e0b] z-20"></span>
                        )}
                      </div>
                      <span className={`text-[10px] sm:text-xs font-mono tracking-wider uppercase transition-colors ${
                        isSelected ? 'text-amber-400 font-medium' : 'text-gray-400 group-hover:text-white'
                      }`}>
                        {cat.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DYNAMIC CATALOG GRID LAYOUT OR EXQUISITE LIGHT-THEMED SIDEBAR FILTER LAYOUT */}
            {(selectedCategory !== 'All' || searchQuery.trim() !== '') ? (
              <div 
                id="interactive-boutique-explorer" 
                className="bg-white text-gray-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_10px_50px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden"
              >
                {/* Header of the boutique */}
                <div className="border-b border-gray-150 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono tracking-[0.2em] text-amber-600 uppercase block font-semibold">Exhibition Hall</span>
                    <h3 className="text-2xl font-sans tracking-tight text-gray-900 font-light mt-1">
                      {searchQuery.trim() !== '' ? (
                        <>Search Results: <span className="italic font-serif text-amber-800 font-medium">"{searchQuery}"</span></>
                      ) : (
                        <>Salon Showcase: <span className="italic font-serif text-amber-800 font-medium">{selectedCategory}</span></>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 font-sans mt-1">
                      Showing {filteredProducts.length} certified luxury masterpieces matching your criteria.
                    </p>
                  </div>
                  
                  <div className="flex gap-4 text-xs font-mono">
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                      <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Total Matches</span>
                      <span className="text-gray-900 font-bold text-sm">{filteredProducts.length}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* SIDEBAR FILTERS (Column Span 3) */}
                  <div className="lg:col-span-3 bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-6 shrink-0 h-fit">
                    {/* Search query input */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-semibold block">Refined Search</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Type keyword..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Vertical categories selection with count */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-semibold block">Ateliers & Collections</label>
                      <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                        {['All', ...categories.map(c => c.name)].map((cat) => {
                          const count = cat === 'All' 
                            ? products.length 
                            : products.filter(p => p.category.toLowerCase() === cat.toLowerCase()).length;
                          const isSel = selectedCategory.toLowerCase() === cat.toLowerCase();
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setSelectedCategory(cat)}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-all flex justify-between items-center cursor-pointer ${
                                isSel
                                  ? 'bg-amber-500 text-black font-semibold shadow-sm'
                                  : 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                            >
                              <span className="truncate uppercase tracking-wider">{cat}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSel ? 'bg-black/10 text-black' : 'bg-gray-200 text-gray-600'}`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Price Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono text-gray-500 font-semibold uppercase">
                        <span>Max Price:</span>
                        <span className="text-amber-700 font-bold">${maxPrice}</span>
                      </div>
                      <input
                        type="range"
                        min={100}
                        max={6000}
                        step={50}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600 border border-transparent"
                      />
                    </div>

                    {/* Sort Order dropdown */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-semibold block">Sort Order</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 font-mono focus:outline-none focus:border-amber-500"
                      >
                        <option value="featured">⚜️ Featured</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="rating">Reviews: Highest Rating</option>
                      </select>
                    </div>

                    {/* Stock status checkbox toggle */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setInStockOnly(!inStockOnly)}
                        className="w-full flex items-center gap-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer text-xs text-gray-700 transition-colors"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          inStockOnly ? 'bg-amber-500 border-amber-600 text-black' : 'border-gray-300'
                        }`}>
                          {inStockOnly && <Check className="w-3 h-3 stroke-[3px]" />}
                        </div>
                        <span className="font-mono text-[10px] text-gray-600 uppercase tracking-wider font-semibold">Available Stock Only</span>
                      </button>
                    </div>

                    {/* Reset Filters button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('All');
                        }}
                        className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-mono tracking-widest uppercase rounded-xl transition-all cursor-pointer font-bold"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </div>

                  {/* PRODUCTS GRID (Column Span 9) */}
                  <div className="lg:col-span-9">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-20 border border-dashed border-gray-200 rounded-3xl text-gray-400">
                        <p className="text-sm font-sans font-light">No masterpieces matched your current criteria.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4">
                        {filteredProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onQuickView={(p) => setSelectedProduct(p)}
                            onAddToCart={handleAddToCart}
                            onToggleWishlist={handleToggleWishlist}
                            isInWishlist={wishlist.includes(product.id)}
                            lightMode={true}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* ADVANCED ADVOCATED FILTERS */}
                <Filters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  maxPrice={maxPrice}
                  setMaxPrice={setMaxPrice}
                  inStockOnly={inStockOnly}
                  setInStockOnly={setInStockOnly}
                  categories={dynamicCategories}
                />

                {/* PRODUCT RESULTS GRID */}
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl text-gray-500">
                    <p className="text-base font-sans font-light">No masterpieces matched your query filters.</p>
                  </div>
                ) : (
                  <div className="space-y-12">
                    <div className="space-y-12">
                      {/* ROW 1: Trending Now */}
                      {trendingProducts.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-white/15 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span className="text-xs sm:text-sm font-mono uppercase tracking-[0.2em] text-amber-500 font-bold">
                                Trending Now <span className="text-gray-500 font-normal font-sans tracking-normal">({trendingProducts.length} items)</span>
                              </span>
                            </div>
                            <span className="hidden sm:flex text-[10px] font-mono text-gray-400 tracking-wider items-center gap-1">
                              Swipe Horizontally <span className="animate-pulse">→</span>
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-row sm:overflow-x-auto sm:gap-6 pb-6 sm:snap-x sm:snap-mandatory sm:scrollbar-none sm:scroll-smooth">
                            {trendingProducts.map((product) => (
                              <div key={product.id} className="w-full sm:w-[280px] md:w-[calc(25%-18px)] shrink-0 sm:snap-start">
                                <ProductCard
                                  product={product}
                                  onQuickView={(p) => setSelectedProduct(p)}
                                  onAddToCart={handleAddToCart}
                                  onToggleWishlist={handleToggleWishlist}
                                  isInWishlist={wishlist.includes(product.id)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ROW 2: Best Sellers */}
                      {bestSellingProducts.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-white/15 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span className="text-xs sm:text-sm font-mono uppercase tracking-[0.2em] text-amber-500 font-bold">
                                Best Sellers <span className="text-gray-500 font-normal font-sans tracking-normal">({bestSellingProducts.length} items)</span>
                              </span>
                            </div>
                            <span className="hidden sm:flex text-[10px] font-mono text-gray-400 tracking-wider items-center gap-1">
                              Swipe Horizontally <span className="animate-pulse">→</span>
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-row sm:overflow-x-auto sm:gap-6 pb-6 sm:snap-x sm:snap-mandatory sm:scrollbar-none sm:scroll-smooth">
                            {bestSellingProducts.map((product) => (
                              <div key={product.id} className="w-full sm:w-[280px] md:w-[calc(25%-18px)] shrink-0 sm:snap-start">
                                <ProductCard
                                  product={product}
                                  onQuickView={(p) => setSelectedProduct(p)}
                                  onAddToCart={handleAddToCart}
                                  onToggleWishlist={handleToggleWishlist}
                                  isInWishlist={wishlist.includes(product.id)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ROW 3: Regular Collection */}
                      {filteredProducts.filter(p => !p.isTrending && !p.isBestSeller).length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-white/15 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span className="text-xs sm:text-sm font-mono uppercase tracking-[0.2em] text-amber-500 font-bold">
                                Elite Collections <span className="text-gray-500 font-normal font-sans tracking-normal">({filteredProducts.filter(p => !p.isTrending && !p.isBestSeller).length} items)</span>
                              </span>
                            </div>
                            <span className="hidden sm:flex text-[10px] font-mono text-gray-400 tracking-wider items-center gap-1">
                              Swipe Horizontally <span className="animate-pulse">→</span>
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-row sm:overflow-x-auto sm:gap-6 pb-6 sm:snap-x sm:snap-mandatory sm:scrollbar-none sm:scroll-smooth">
                            {filteredProducts.filter(p => !p.isTrending && !p.isBestSeller).map((product) => (
                              <div key={product.id} className="w-full sm:w-[280px] md:w-[calc(25%-18px)] shrink-0 sm:snap-start">
                                <ProductCard
                                  product={product}
                                  onQuickView={(p) => setSelectedProduct(p)}
                                  onAddToCart={handleAddToCart}
                                  onToggleWishlist={handleToggleWishlist}
                                  isInWishlist={wishlist.includes(product.id)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LUXURIOUS BRAND VALUE ACCENTS */}
          <div className="bg-[#060606] border-t border-b border-white/5 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full border border-amber-500/20 bg-amber-500/5 flex items-center justify-center mx-auto text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-sans font-medium text-white tracking-wide">Certified Provenance</h4>
                <p className="text-xs text-gray-400 leading-relaxed font-sans font-light max-w-xs mx-auto">
                  Each masterpiece is accompanied by individually numbered certificates and encrypted NFC tags.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full border border-amber-500/20 bg-amber-500/5 flex items-center justify-center mx-auto text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <Compass className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-sans font-medium text-white tracking-wide">White-Glove Courier</h4>
                <p className="text-xs text-gray-400 leading-relaxed font-sans font-light max-w-xs mx-auto">
                  Dispatched globally in secured thermal containers with continuous GPS tracking capabilities.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full border border-amber-500/20 bg-amber-500/5 flex items-center justify-center mx-auto text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-sans font-medium text-white tracking-wide">Bespoke Customization</h4>
                <p className="text-xs text-gray-400 leading-relaxed font-sans font-light max-w-xs mx-auto">
                  Access standard initial personalization, leather monogramming, or private decanter engraving.
                </p>
              </div>
            </div>
          </div>

          {/* DYNAMIC ACCORDION FAQS */}
          <FAQ />
        </main>
      )}

      {/* ========================================================
          SCREEN 1.5: THE BOUTIQUE SHOP (WHITE BACKGROUND & SIDEBAR FILTERS)
          ======================================================== */}
      {activeScreen === 'shop' && (
        <main className="min-h-screen bg-white text-gray-900 pt-28 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            {/* Breadcrumb / Back Navigation */}
            <div className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-wider">
              <button 
                onClick={() => {
                  setActiveScreen('storefront');
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="hover:text-amber-600 transition-colors cursor-pointer font-bold"
              >
                Home
              </button>
              <span>/</span>
              <span className="text-gray-900 font-bold">The Boutique Shop</span>
            </div>

            {/* Main Header inside the Shop Page */}
            <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono tracking-[0.25em] text-amber-600 uppercase block font-bold">Atelier Exhibition Hall</span>
                <h2 className="text-3xl font-sans tracking-tight text-gray-900 font-light mt-1">
                  {searchQuery.trim() !== '' ? (
                    <>Search Results for <span className="italic font-serif text-amber-800 font-semibold">"{searchQuery}"</span></>
                  ) : (
                    <>Salon Showcase: <span className="italic font-serif text-amber-800 font-semibold">{selectedCategory}</span></>
                  )}
                </h2>
                <p className="text-xs text-gray-500 font-sans mt-1">
                  Browse our certified luxury collections with real-time certified NFC credentials.
                </p>
              </div>
              
              <div className="flex gap-4 text-xs font-mono">
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 flex flex-col justify-center">
                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider font-semibold">Total Matches</span>
                  <span className="text-gray-900 font-bold text-sm text-center">{filteredProducts.length}</span>
                </div>
              </div>
            </div>

            {/* Grid Layout: Sidebar Filter Left + Products Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* SIDEBAR FILTERS (Column Span 3) */}
              <aside className="lg:col-span-3 bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-6 shrink-0 shadow-sm">
                
                {/* Refined Search Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold block">Refined Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl pl-4 pr-10 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-mono"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Vertical Category Selection with Counters */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold block">Ateliers & Collections</label>
                  <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                    {['All', ...categories.map(c => c.name)].map((cat) => {
                      const count = cat === 'All' 
                        ? products.length 
                        : products.filter(p => p.category.toLowerCase() === cat.toLowerCase()).length;
                      const isSel = selectedCategory.toLowerCase() === cat.toLowerCase();
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-all flex justify-between items-center cursor-pointer ${
                            isSel
                              ? 'bg-amber-500 text-black font-semibold shadow-sm'
                              : 'bg-transparent text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                          }`}
                        >
                          <span className="truncate uppercase tracking-wider">{cat}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSel ? 'bg-black/10 text-black' : 'bg-gray-200 text-gray-600'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-gray-500 font-bold uppercase">
                    <span>Max Price:</span>
                    <span className="text-amber-700 font-bold">${maxPrice}</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={6000}
                    step={50}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600 border border-transparent"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-gray-400">
                    <span>$100</span>
                    <span>$6,000</span>
                  </div>
                </div>

                {/* Sort Order dropdown */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold block">Sort Order</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-700 font-mono focus:outline-none focus:border-amber-600"
                  >
                    <option value="featured">⚜️ Featured</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Reviews: Highest Rating</option>
                  </select>
                </div>

                {/* Stock status checkbox toggle */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setInStockOnly(!inStockOnly)}
                    className="w-full flex items-center gap-3 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer text-xs text-gray-700 transition-colors"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      inStockOnly ? 'bg-amber-500 border-amber-600 text-black' : 'border-gray-300'
                    }`}>
                      {inStockOnly && <Check className="w-3 h-3 stroke-[3px]" />}
                    </div>
                    <span className="font-mono text-[10px] text-gray-600 uppercase tracking-wider font-bold">In-Stock Only</span>
                  </button>
                </div>

                {/* Reset Filters button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setMaxPrice(6000);
                      setInStockOnly(false);
                      setSortBy('featured');
                    }}
                    className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-mono tracking-widest uppercase rounded-xl transition-all cursor-pointer font-bold"
                  >
                    Reset All Filters
                  </button>
                </div>
              </aside>

              {/* PRODUCTS GRID (Column Span 9) */}
              <div className="lg:col-span-9">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-24 border border-dashed border-gray-300 rounded-3xl text-gray-400 bg-gray-50/50">
                    <p className="text-sm font-sans font-light">No masterpieces matched your current filters.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                        setMaxPrice(6000);
                        setInStockOnly(false);
                      }}
                      className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-mono text-[10px] tracking-wider uppercase rounded-xl font-bold transition-all"
                    >
                      Clear Selection
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onQuickView={(p) => setSelectedProduct(p)}
                        onAddToCart={handleAddToCart}
                        onToggleWishlist={handleToggleWishlist}
                        isInWishlist={wishlist.includes(product.id)}
                        lightMode={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================
          SCREEN 2: AUTHENTICATION SCREENS (LOGIN/REGISTER)
          ======================================================== */}
      {activeScreen === 'auth' && (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-24 max-w-md mx-auto">
          <div className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-mono tracking-[0.3em] text-amber-500 uppercase block">Private Cleared Registry</span>
              <h2 className="text-2xl font-sans text-white font-light">
                {authMode === 'login' ? 'Authenticate Credentials' : 'Request Registry Enlist'}
              </h2>
              <p className="text-xs text-gray-400">Unlock access to your historical ledger, addresses, and tracking.</p>
            </div>

            {authError && (
              <div className="border border-red-500/20 bg-red-950/20 rounded-xl p-3 text-xs text-red-400">
                {authError}
              </div>
            )}

            {authSuccess && (
              <div className="border border-emerald-500/20 bg-emerald-950/20 rounded-xl p-3 text-xs text-emerald-400 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            <div className="space-y-4 pt-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-4 bg-white text-black text-xs font-mono tracking-widest uppercase rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer hover:bg-gray-100 shadow-[0_10px_30px_rgba(255,255,255,0.05)] active:scale-[0.98]"
              >
                <svg className="w-5 h-5 fill-current text-black shrink-0" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.73 0 3.3.615 4.524 1.8l2.35-2.35A9.916 9.916 0 0012.24 2c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 10-4.06 10-10 0-.68-.06-1.345-.16-1.715H12.24z"/>
                </svg>
                Continue With Google
              </button>
            </div>

            <div className="text-center font-mono text-[9px] text-gray-600 border-t border-white/5 pt-6 leading-relaxed">
              By continuing, you agree to our terms of service and private registry protocols. All access is logged for security.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SCREEN 3: CUSTOMER PROFILE / CHAMBER
          ======================================================== */}
      {activeScreen === 'dashboard' && currentUser && (
        <Dashboard 
          currentUser={currentUser} 
          onBackToStore={() => setActiveScreen('storefront')} 
        />
      )}

      {/* ========================================================
          SCREEN 4: ADMINISTRATOR CONTROL DASHBOARD
          ======================================================== */}
      {activeScreen === 'admin' && currentUser?.role === 'admin' && (
        <AdminDashboard 
          onBackToStore={() => {
            loadProducts();
            setActiveScreen('storefront');
          }} 
        />
      )}

      {/* ========================================================
          GLOBAL SLIDEOUTS & FOCUS MODALS
          ======================================================== */}

      {/* 1. DYNAMIC PRODUCT DETAILS modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={true}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          isInWishlist={wishlist.includes(selectedProduct.id)}
          currentUser={currentUser}
          allProducts={products}
          onSelectRelated={(p) => setSelectedProduct(p)}
        />
      )}

      {/* 2. SECURITY DIRECT CHECKOUT MODAL */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        currentUser={currentUser}
        onOrderSuccess={(orderId) => {
          // Clear cart on successful order
          saveCart([]);
        }}
      />

      {/* 3. DYNAMIC SLIDEOUT: SHOPPING BAG DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#0a0a0a] border-l border-white/10 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] h-[100dvh] h-screen overflow-hidden">
            {/* FIXED HEADER */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/5 shrink-0 bg-[#0a0a0a] z-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  <h4 className="text-sm sm:text-base font-sans font-medium text-white uppercase tracking-wider">Shopping Cart ({cart.length})</h4>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white cursor-pointer active:bg-white/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar scroll-smooth overscroll-contain">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-gray-500 space-y-3">
                  <ShoppingBag className="w-10 h-10 mx-auto opacity-20 mb-2" />
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em]">Cart is Empty</p>
                  <p className="text-xs font-sans font-light max-w-[200px] mx-auto leading-relaxed">Your shopping cart is currently empty. Start exploring our collection.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {cart.map((item, idx) => {
                    const price = item.product.price + (item.selectedVariant?.additionalPrice || 0);

                    return (
                      <div key={idx} className="flex gap-4 items-start border-b border-white/5 pb-6 last:border-0 last:pb-0 text-xs relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black">
                          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between h-20 sm:h-24 py-0.5">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h5 className="text-white font-sans font-medium truncate tracking-wide text-xs sm:text-sm flex-1">{item.product.name}</h5>
                              <button 
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="text-gray-600 hover:text-red-400 p-1 -mt-1 -mr-1 cursor-pointer transition-colors shrink-0"
                                title="Discard Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {item.selectedVariant && (
                              <p className="text-[9px] font-mono text-gray-500 uppercase tracking-tighter mt-0.5">
                                {item.selectedVariant.name}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-auto">
                            <p className="text-xs sm:text-sm text-amber-500 font-mono font-bold">₹{price}</p>
                            
                            {/* Quantity control */}
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-0.5">
                              <button 
                                onClick={() => handleUpdateCartQuantity(item.id, -1)}
                                className="w-6 h-6 text-gray-400 hover:text-white flex items-center justify-center text-xs font-mono cursor-pointer active:bg-white/5 rounded-md"
                              >
                                -
                              </button>
                              <span className="font-mono text-white text-[10px] w-4 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => handleUpdateCartQuantity(item.id, 1)}
                                className="w-6 h-6 text-gray-400 hover:text-white flex items-center justify-center text-xs font-mono cursor-pointer active:bg-white/5 rounded-md"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FIXED FOOTER */}
            {cart.length > 0 && (
              <div className="px-4 sm:px-6 py-4 sm:py-6 border-t border-white/10 bg-black/95 backdrop-blur-md shrink-0 space-y-4 sm:space-y-5 z-10">
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between items-baseline font-mono text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-[0.2em]">
                    <span>Cart Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between items-center font-sans text-white">
                    <span className="text-xs sm:text-sm font-medium tracking-wide uppercase">Grand Total</span>
                    <span className="text-lg sm:text-xl font-bold font-mono text-amber-500">₹{subtotal}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:gap-3 pb-safe mb-safe">
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-bold cursor-pointer text-center block shadow-[0_10px_30px_rgba(245,158,11,0.2)] active:scale-[0.98]"
                  >
                    Proceed to Checkout
                  </button>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="w-full py-1.5 sm:py-2 text-gray-500 hover:text-white text-[8px] sm:text-[9px] font-mono tracking-[0.3em] uppercase transition-all cursor-pointer text-center block mb-2 sm:mb-0"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. DYNAMIC SLIDEOUT: WISHLIST / PRIVATE VAULT DRAWER */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsWishlistOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#0a0a0a] border-l border-white/10 p-6 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div className="space-y-6 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <h4 className="text-base font-sans font-medium text-white uppercase tracking-wider">Whistle Boutique ({wishlist.length})</h4>
                </div>
                <button onClick={() => setIsWishlistOpen(false)} className="p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {wishlist.length === 0 ? (
                <div className="text-center py-16 text-gray-500 space-y-2">
                  <p className="text-xs font-mono uppercase tracking-widest">Wishlist is Empty</p>
                  <p className="text-xs font-sans font-light">Saved items will appear here.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {(() => {
                    const saved = products.filter(p => wishlist.includes(p.id));
                    return saved.map((p) => (
                      <div key={p.id} className="flex gap-4 items-center border-b border-white/5 pb-4 last:border-0 last:pb-0 text-xs">
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-black shrink-0">
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h5 className="text-white font-sans font-medium truncate tracking-wide">{p.name}</h5>
                          <p className="text-[11px] text-amber-500 font-mono font-bold">₹{p.price}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleMoveWishlistToCart(p)}
                            className="p-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg cursor-pointer"
                            title="Move to Cart"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleWishlist(p.id)}
                            className="p-2 bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-900/30 rounded-lg cursor-pointer"
                            title="Discard Saved"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. SEARCH OVERLAY DRAWER */}
      {showSearchOverlay && (
        <div className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-md p-6 flex flex-col items-center justify-start pt-32 space-y-12">
          <button 
            onClick={() => setShowSearchOverlay(false)}
            className="absolute top-6 right-6 p-2 rounded-full border border-white/10 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-full max-w-2xl text-center space-y-6">
            <h3 className="text-xl sm:text-2xl font-sans font-light text-white uppercase tracking-widest">Search Our Private Archives</h3>
            
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Enter masterpiece keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShowSearchOverlay(false);
                    setActiveScreen('shop');
                  }
                }}
                className="w-full bg-white/5 border-b border-white/20 focus:border-amber-500 text-xl py-4 px-6 text-white text-center focus:outline-none transition-colors"
              />
            </div>

            {searchQuery.trim() !== '' && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    setShowSearchOverlay(false);
                    setActiveScreen('shop');
                  }}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-bold cursor-pointer"
                >
                  Explore in Boutique Salon View
                </button>
              </div>
            )}

            {/* Live match quick results */}
            {searchQuery.trim() !== '' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-h-[300px] overflow-y-auto text-left space-y-2.5 custom-scrollbar">
                {(() => {
                  const matches = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()));
                  if (matches.length === 0) return <p className="text-xs text-gray-500 font-mono text-center py-4">No archives found.</p>;
                  
                  return matches.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setSelectedProduct(p);
                        setShowSearchOverlay(false);
                      }}
                      className="flex gap-4 items-center p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black">
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs sm:text-sm text-white font-sans font-medium truncate tracking-wide">{p.name}</h5>
                        <p className="text-[10px] text-gray-400 font-mono">{p.category}</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-500">${p.price}</span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          GLOBAL FOOTER LAYOUT
          ======================================================== */}
      <footer className="border-t border-white/5 bg-[#050505] py-16 text-xs text-gray-400 font-sans mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Col 1: Brand details (4 cols) */}
          <div className="md:col-span-4 space-y-4 text-left">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center font-serif text-black font-extrabold text-xs">
                Z
              </div>
              <span className="font-sans font-light tracking-[0.25em] text-white uppercase text-sm">
                ZYLO <span className="text-[9px] text-amber-500 font-mono tracking-normal block -mt-0.5 font-bold">LUXURY ATELIER</span>
              </span>
            </div>
            <p className="leading-relaxed font-sans font-light text-gray-500 max-w-sm">
              An iconic luxury sanctuary fusing precision horology, olfactory maison craft, and Italian travel accessories with state-of-the-art secure logistics and certified NFC credentials.
            </p>
          </div>

          {/* Col 2: Ateliers (3 cols) */}
          <div className="md:col-span-3 space-y-3 text-left">
            <h5 className="text-white font-mono uppercase tracking-wider text-[10px] font-bold">Explore Ateliers</h5>
            <ul className="space-y-2 text-gray-500">
              <li><button onClick={() => { setSelectedCategory("Timepieces"); }} className="hover:text-amber-500 transition-colors">Fine Timepieces</button></li>
              <li><button onClick={() => { setSelectedCategory("Fragrances"); }} className="hover:text-amber-500 transition-colors">Maison Parfum</button></li>
              <li><button onClick={() => { setSelectedCategory("Leather Goods"); }} className="hover:text-amber-500 transition-colors">Signature Luggage</button></li>
              <li><button onClick={() => { setSelectedCategory("Accessories"); }} className="hover:text-amber-500 transition-colors">Luxury Accessories</button></li>
            </ul>
          </div>

          {/* Col 3: Assistance (2 cols) */}
          <div className="md:col-span-2 space-y-3 text-left">
            <h5 className="text-white font-mono uppercase tracking-wider text-[10px] font-bold">Assistance</h5>
            <ul className="space-y-2 text-gray-500">
              <li><button onClick={() => { const faq = document.getElementById('faq-section'); if(faq) faq.scrollIntoView({behavior:'smooth'}); }} className="hover:text-amber-500 transition-colors">Inquiries & FAQ</button></li>
              <li><span className="hover:text-amber-500 transition-colors block">Secure Delivery</span></li>
              <li><span className="hover:text-amber-500 transition-colors block">White-Glove Shipping</span></li>
              <li><span className="hover:text-amber-500 transition-colors block">NFC Certifications</span></li>
            </ul>
          </div>

          {/* Col 4: Newsletter (3 cols) */}
          <div className="md:col-span-3 space-y-4 text-left">
            <h5 className="text-white font-mono uppercase tracking-wider text-[10px] font-bold">Private Ledger</h5>
            <p className="text-gray-500 leading-relaxed font-light">
              Receive confidential dispatches on limited editions and seasonal allocations.
            </p>
            
            <form onSubmit={handleNewsletter} className="space-y-2">
              {newsletterSuccess && (
                <span className="text-[10px] text-emerald-400 block">{newsletterSuccess}</span>
              )}
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Private Email..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 flex-1"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-white hover:bg-gray-200 text-black font-mono text-[10px] uppercase font-bold rounded-lg cursor-pointer"
                >
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Brand trademark */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between text-gray-600 gap-4 font-mono text-[10px]">
          <span>© 2026 ZYLO LUXURY ATELIER. INC. ALL RIGHTS RESERVED.</span>
          <span className="flex gap-4">
            <span className="hover:text-amber-500 cursor-pointer">Security Ledger</span>
            <span>•</span>
            <span className="hover:text-amber-500 cursor-pointer">NFC Provenance</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
