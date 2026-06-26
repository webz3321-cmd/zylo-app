import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Heart, User, Search, Settings, LogOut, Menu, HelpCircle, ChevronDown, Tag } from 'lucide-react';
import { CartItem, Product, Category } from '../types';
import { ZyloLogo } from './ZyloLogo';

interface HeaderProps {
  cart: CartItem[];
  wishlist: string[];
  currentUser: any;
  logoUrl?: string;
  brandName?: string;
  onOpenCartDrawer: () => void;
  onOpenWishlistDrawer: () => void;
  onAuthClick: () => void;
  onLogout: () => void;
  onDashboardClick: () => void;
  onAdminClick: () => void;
  onSearchToggle: () => void;
  onHomeClick?: () => void;
  onShopClick?: (keepSearch?: boolean) => void;
  onAboutClick?: () => void;
  onHelpClick?: () => void;

  // Search and Category props for integration
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onCategorySelect?: (category: string) => void;

  // New products props for hover menu
  products?: Product[];
  onProductClick?: (product: Product) => void;

  // Dynamic categories
  categories?: Category[];
}

export default function Header({
  cart,
  wishlist,
  currentUser,
  logoUrl,
  brandName = 'Zylo',
  onOpenCartDrawer,
  onOpenWishlistDrawer,
  onAuthClick,
  onLogout,
  onDashboardClick,
  onAdminClick,
  onSearchToggle,
  onHomeClick,
  onShopClick,
  onAboutClick,
  onHelpClick,
  searchQuery = '',
  setSearchQuery,
  onCategorySelect,
  products = [],
  onProductClick,
  categories = []
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPromoBanner, setShowPromoBanner] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getProductsForCategory = (catName: string) => {
    if (!products) return [];
    const lower = catName.toLowerCase();
    
    // Check exact matches or loose inclusion matches (case-insensitive)
    return products.filter(p => {
      const pCat = (p.category || '').toLowerCase();
      return pCat === lower || lower.includes(pCat) || pCat.includes(lower);
    });
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const activeCategories = useMemo(() => {
    let list: string[] = [];
    if (categories && categories.length > 0) {
      list = categories.map(c => c.name);
    } else if (products && products.length > 0) {
      list = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
    }
    
    // Fallback to local storage cache if available
    if (list.length === 0) {
      try {
        const cached = localStorage.getItem('zylo_rich_categories');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed.map((c: any) => c.name);
          }
        }
      } catch (e) {
        console.warn("Header failed to load categories from cache:", e);
      }
    }
    
    // Hardcoded high-end luxury fallback list if database is loading and cache is clear
    if (list.length === 0) {
      list = [
        'Timepieces',
        'Fragrances',
        'Leather Goods',
        'Accessories'
      ];
    }
    
    // Always append 'OFFERS' to the end
    return [...list, 'OFFERS'];
  }, [categories, products]);

  const handleCategoryClick = (label: string) => {
    if (label === 'OFFERS') {
      setShowPromoBanner(true);
      setTimeout(() => setShowPromoBanner(false), 5000);
      return;
    }

    if (!onCategorySelect) return;
    onCategorySelect(label);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (setSearchQuery) {
      setSearchQuery(val);
    }
    if (val.trim() !== '' && onShopClick) {
      onShopClick(true);
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex flex-col shadow-sm transition-all duration-300">
      
      {/* 1. TOP ANNOUNCEMENT BAR (Nykaa Man Deep Teal Style) */}
      <div className={`w-full bg-[#003e44] text-white flex items-center border-b border-white/5 font-sans transition-all duration-300 ease-in-out origin-top ${
        isScrolled ? 'h-0 opacity-0 overflow-hidden border-b-0' : 'h-10'
      }`}>
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center text-[11px] sm:text-xs font-semibold tracking-wide">
          <div className="flex items-center gap-2 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Great Offers From The Best Brands</span>
          </div>
          <div className="flex items-center gap-4 text-white/90">
            <button 
              onClick={onHelpClick}
              className="hover:text-white flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer text-[11px] font-sans font-semibold"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER (Nykaa Man Minimal Luxury Aesthetic) */}
      <div className={`w-full h-20 bg-white border-b border-neutral-200 flex items-center relative transition-all duration-300 ${
        isScrolled ? 'shadow-md bg-white/95 backdrop-blur-md' : ''
      }`}>
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
          
          {/* Logo Side */}
          <div className="flex items-center gap-6">
            <button
              onClick={onHomeClick}
              className="flex items-baseline bg-transparent border-none p-0 cursor-pointer text-left focus:outline-none group"
            >
              {logoUrl && logoUrl !== 'https://images.unsplash.com/photo-1583391733956-6c7827447678?auto=format&fit=crop&q=80&w=100' ? (
                <div className="h-12 transition-transform group-hover:scale-[1.02]">
                  <img src={logoUrl} alt={brandName} className="h-full w-auto object-contain" />
                </div>
              ) : (
                <ZyloLogo className="h-11 sm:h-12 md:h-13 text-black hover:text-[#003e44] transition-colors" />
              )}
            </button>

            {/* Desktop Center Links */}
            <nav className="hidden lg:flex items-center gap-6 font-sans text-xs font-bold text-neutral-800">
              <button
                onClick={() => handleCategoryClick('Luxe')}
                className="hover:text-[#003e44] transition-colors cursor-pointer flex items-center gap-1 uppercase"
              >
                <span>Categories</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>
              <button
                onClick={onShopClick}
                className="hover:text-[#003e44] transition-colors cursor-pointer uppercase"
              >
                Brands
              </button>
              <button
                onClick={onAboutClick}
                className="hover:text-[#003e44] transition-colors cursor-pointer uppercase text-neutral-500 font-medium"
              >
                Grooming Advice
              </button>
            </nav>
          </div>

          {/* Interactive Search Bar (Nykaa Man Grey Style) */}
          <div className="flex-1 max-w-[240px] hidden md:block">
            <div className="w-full bg-neutral-100 hover:bg-neutral-150/80 border border-neutral-200/60 rounded-md flex items-center px-2.5 py-1.5 transition-all group focus-within:ring-2 focus-within:ring-[#003e44]/15 focus-within:border-[#003e44]">
              <Search className="w-4 h-4 text-neutral-400 mr-2.5 shrink-0" />
              <input
                type="text"
                placeholder={`Search on ${brandName}...`}
                value={searchQuery}
                onChange={handleSearchChange}
                className="bg-transparent border-none outline-none w-full text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 font-sans"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery && setSearchQuery('')}
                  className="text-neutral-400 hover:text-black text-xs font-bold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Action Icons Panel */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Wishlist Icon */}
            <button
              onClick={onOpenWishlistDrawer}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer relative"
              title="My Registry"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#003e44] animate-pulse" />
              )}
            </button>

            {/* Cart Icon */}
            <button
              onClick={onOpenCartDrawer}
              className="p-1.5 text-neutral-600 hover:text-[#003e44] transition-colors cursor-pointer relative flex items-center"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-[#003e44] text-white text-[9px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center font-sans">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Auth Dropdown / Button (Nykaa style block button) */}
            {currentUser ? (
              <div className="flex items-center gap-2.5">
                {currentUser.role === 'admin' && (
                  <button
                    onClick={onAdminClick}
                    className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 text-[10px] font-sans uppercase font-bold border border-amber-500/20 transition-all cursor-pointer"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Admin</span>
                  </button>
                )}
                
                <button
                  onClick={onDashboardClick}
                  className="p-1.5 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                  title="Your Atelier Profile"
                >
                  <User className="w-5 h-5 text-neutral-700" />
                </button>

                <button
                  onClick={onLogout}
                  className="p-1.5 text-red-600 hover:text-red-700 transition-colors cursor-pointer hidden sm:block"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="px-4 py-1.5 sm:px-5 sm:py-2 bg-[#003e44] hover:bg-[#002f34] text-white text-xs font-bold tracking-wide rounded transition-all cursor-pointer font-sans shadow-sm uppercase shrink-0"
              >
                Sign in
              </button>
            )}

            {/* Mobile Menu Icon */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-neutral-700 hover:text-black transition-colors"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. CATEGORY SCROLL BAR CONTAINER (With Hover Detection) */}
      <div 
        className="w-full relative"
        onMouseLeave={() => setHoveredCategory(null)}
      >
        {/* 3. CATEGORY SCROLL BAR (Nykaa Man Categories Strip) */}
        <div className={`w-full bg-white border-b border-neutral-200/80 overflow-x-auto scrollbar-none flex items-center transition-all duration-300 ease-in-out ${
          isScrolled ? 'h-0 opacity-0 overflow-hidden border-b-0 pointer-events-none' : 'h-11 border-b'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-start lg:justify-between gap-6 sm:gap-8 overflow-x-auto scrollbar-none whitespace-nowrap">
            {activeCategories.map((cat, idx) => {
              const isOffers = cat === 'OFFERS';
              return (
                <button
                  key={idx}
                  onClick={() => {
                    handleCategoryClick(cat);
                    setHoveredCategory(null);
                  }}
                  onMouseEnter={() => !isScrolled && setHoveredCategory(cat)}
                  className={`text-[11px] sm:text-[12px] font-bold tracking-wide font-sans cursor-pointer transition-all hover:text-[#003e44] uppercase ${
                    isOffers 
                      ? 'bg-[#003e44] text-white px-3 py-1 rounded-full text-[10px] sm:text-[11px] shadow-sm ml-auto shrink-0 flex items-center gap-1 hover:bg-neutral-800'
                      : `shrink-0 border-b-2 pb-0.5 transition-all ${
                          hoveredCategory === cat 
                            ? 'text-[#003e44] border-[#003e44]' 
                            : 'text-neutral-600 border-transparent hover:border-[#003e44]/40'
                        }`
                  }`}
                >
                  {isOffers && <Tag className="w-3 h-3 text-emerald-300" />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* INTERACTIVE HOVER DROPDOWN PANEL */}
        {hoveredCategory && !isScrolled && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-neutral-200 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
              
              {/* Left Column - Curation Banner */}
              <div className="w-full md:w-1/4 bg-[#003e44] text-white p-6 rounded-lg flex flex-col justify-between shadow-inner min-h-[220px]">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-emerald-300 uppercase block mb-1">Curation Atelier</span>
                  <h3 className="font-sans text-xl font-bold tracking-tight uppercase leading-tight">
                    {hoveredCategory}
                  </h3>
                  <p className="text-[11px] text-white/70 mt-2 leading-relaxed font-sans">
                    Explore our finest boutique collection handpicked for the modern gentleman who refuses to compromise on quality and aesthetic perfection.
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => {
                      handleCategoryClick(hoveredCategory);
                      setHoveredCategory(null);
                    }}
                    className="w-full py-2 bg-white text-[#003e44] hover:bg-neutral-100 transition-colors rounded text-xs font-bold tracking-wider uppercase cursor-pointer text-center block"
                  >
                    View All Products
                  </button>
                </div>
              </div>

              {/* Right Column - Dynamic Products List */}
              <div className="flex-1">
                {hoveredCategory === 'OFFERS' ? (
                  /* Offers Grid */
                  <div>
                    <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-4 font-mono">Active Luxury Coupons</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { code: 'GOLD20', desc: '20% OFF Luxury Timepieces', min: '₹10,000' },
                        { code: 'GENT15', desc: '15% OFF Premium Fragrances', min: '₹5,000' },
                        { code: 'MAN10', desc: '10% OFF Extra Sitewide', min: 'No Minimum' }
                      ].map((voucher, vIdx) => (
                        <div key={vIdx} className="bg-neutral-50 border border-neutral-200/80 border-dashed rounded-lg p-4 flex flex-col justify-between hover:bg-neutral-100/50 transition-all">
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold font-mono uppercase tracking-wide mb-2">Active Coupon</span>
                            <div className="text-xs font-bold text-neutral-800">{voucher.desc}</div>
                            <div className="text-[10px] text-neutral-400 mt-1">Min. Purchase: {voucher.min}</div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-neutral-200/50 flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-neutral-700 bg-white border border-neutral-300 px-2.5 py-1 rounded shadow-sm">
                              {voucher.code}
                            </span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(voucher.code);
                                alert(`Copied code: ${voucher.code}`);
                              }}
                              className="text-[9px] font-bold text-[#003e44] hover:underline cursor-pointer"
                            >
                              Copy Code
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Products Grid */
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Popular in this Category</h4>
                      <span className="text-[10px] text-neutral-400 font-sans">
                        Showing {Math.min(12, getProductsForCategory(hoveredCategory).length)} of {getProductsForCategory(hoveredCategory).length} items
                      </span>
                    </div>

                    {getProductsForCategory(hoveredCategory).length === 0 ? (
                      <div className="h-40 bg-neutral-50 rounded-lg flex flex-col items-center justify-center border border-neutral-200/40">
                        <ShoppingBag className="w-6 h-6 text-neutral-300 mb-1.5" />
                        <span className="text-xs text-neutral-500 font-medium">Bespoke releases launching soon in this category.</span>
                        <button
                          onClick={() => {
                            if (onShopClick) onShopClick();
                            setHoveredCategory(null);
                          }}
                          className="text-[10px] text-[#003e44] font-bold underline mt-2 hover:text-[#002f34] cursor-pointer"
                        >
                          Explore Brand Store
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6">
                        {getProductsForCategory(hoveredCategory).slice(0, 12).map((prod) => (
                          <div 
                            key={prod.id}
                            onClick={() => {
                              if (onProductClick) onProductClick(prod);
                              setHoveredCategory(null);
                            }}
                            className="group flex items-center justify-between py-2.5 px-3 bg-neutral-50 hover:bg-[#003e44]/5 border border-neutral-100 hover:border-[#003e44]/20 rounded-lg transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex-1 min-w-0 pr-3">
                              <h5 className="font-sans text-xs font-semibold text-neutral-800 uppercase tracking-wide truncate group-hover:text-[#003e44] transition-colors">
                                {prod.name}
                              </h5>
                              <p className="font-sans text-[10px] text-neutral-400 truncate mt-0.5">
                                {prod.tagline}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="text-[#003e44] font-bold text-xs">
                                ₹{prod.price.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* 4. PROMOTIONAL FLYOUT / TOAST BANNER */}
      {showPromoBanner && (
        <div className="w-full bg-[#002f34] text-white py-2 px-4 shadow-lg text-center text-xs font-medium font-sans flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-300">
          <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Exclusive Voucher: use code <strong className="text-emerald-400 font-mono tracking-widest bg-white/10 px-2 py-0.5 rounded">GOLD20</strong> or <strong className="text-emerald-400 font-mono tracking-widest bg-white/10 px-2 py-0.5 rounded">BLACK10</strong> for up to 20% discount on luxury items.</span>
        </div>
      )}

      {/* 5. MOBILE OVERLAY DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-neutral-100 p-5 space-y-5 font-sans text-xs uppercase tracking-wider text-neutral-800 shadow-2xl animate-in slide-in-from-top duration-300 absolute top-31 left-0 right-0 z-40 max-h-[80vh] overflow-y-auto">
          
          {/* Mobile search bar */}
          <div className="md:hidden w-full bg-neutral-100 border border-neutral-200/60 rounded-md flex items-center px-3 py-2">
            <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder={`Search on ${brandName}...`}
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-transparent border-none outline-none w-full text-xs text-neutral-900 font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={() => {
                onOpenWishlistDrawer();
                setMobileMenuOpen(false);
              }}
              className="py-3 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded text-center font-bold active:bg-neutral-200 transition-colors"
            >
              Wishlist ({wishlistCount})
            </button>
            <button
              onClick={() => {
                onOpenCartDrawer();
                setMobileMenuOpen(false);
              }}
              className="py-3 bg-[#003e44]/10 border border-[#003e44]/20 text-[#003e44] rounded text-center font-bold active:bg-[#003e44]/20 transition-colors"
            >
              Cart ({cartCount})
            </button>
          </div>

          <div className="flex flex-col gap-3 py-4 border-y border-neutral-100">
            <button
              onClick={() => {
                if (onHomeClick) onHomeClick();
                setMobileMenuOpen(false);
              }}
              className="py-2.5 text-left text-neutral-800 font-bold hover:text-[#003e44] transition-colors border-b border-neutral-50"
            >
              Home
            </button>
            <button
              onClick={() => {
                if (onShopClick) onShopClick();
                setMobileMenuOpen(false);
              }}
              className="py-2.5 text-left text-[#003e44] font-extrabold hover:text-neutral-800 transition-colors border-b border-neutral-50"
            >
              Brands / Shop All
            </button>
            <button
              onClick={() => {
                if (onAboutClick) onAboutClick();
                setMobileMenuOpen(false);
              }}
              className="py-2.5 text-left text-neutral-500 font-medium hover:text-[#003e44] transition-colors"
            >
              Grooming Advice (About)
            </button>
          </div>

          {/* Quick Categories inside Mobile menu */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-neutral-400 tracking-wider">Quick Categories</h4>
            <div className="grid grid-cols-2 gap-2">
              {activeCategories.slice(0, 8).map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleCategoryClick(cat);
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 px-3 bg-neutral-50 hover:bg-[#003e44]/5 text-left text-[11px] text-neutral-700 rounded transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 pt-4">
            {currentUser ? (
              <>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      onAdminClick();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-3 bg-[#003e44] text-white font-bold text-center rounded active:bg-[#002f34] transition-colors uppercase"
                  >
                    Admin Control Room
                  </button>
                )}

                <button
                  onClick={() => {
                    onDashboardClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 bg-neutral-100 border border-neutral-200 text-neutral-800 text-center rounded font-bold active:bg-neutral-200 transition-colors uppercase"
                >
                  Your Account
                </button>

                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 bg-red-50 border border-red-200 text-red-600 text-center rounded font-bold active:bg-red-100 transition-colors uppercase"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onAuthClick();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3 bg-[#003e44] text-white font-bold text-center rounded active:bg-[#002f34] transition-colors uppercase"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
