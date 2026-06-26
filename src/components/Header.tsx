import { useState } from 'react';
import { ShoppingBag, Heart, User, Search, Settings, LogOut, Menu } from 'lucide-react';
import { CartItem } from '../types';

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
  onShopClick?: () => void;
  onAboutClick?: () => void;
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
  onAboutClick
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-black/85 backdrop-blur-md border-b border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* LOGO (Clickable to go home) */}
        <button
          onClick={onHomeClick}
          className="flex items-center gap-1.5 sm:gap-2 text-left bg-transparent border-none p-0 cursor-pointer focus:outline-none group"
        >
          {logoUrl ? (
            <div className="h-8 sm:h-10 transition-transform group-hover:scale-105">
              <img src={logoUrl} alt={brandName} className="h-full w-auto object-contain" />
            </div>
          ) : (
            <>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-serif text-black font-extrabold text-xs sm:text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:scale-105 transition-transform">
                {brandName.charAt(0).toUpperCase()}
              </div>
              <span className="font-sans font-light tracking-[0.2em] sm:tracking-[0.25em] text-white text-sm sm:text-base uppercase">
                {brandName} <span className="text-[8px] sm:text-[9px] text-amber-500 font-mono tracking-normal block -mt-1 font-bold">PREMIUM SHOP</span>
              </span>
            </>
          )}
        </button>

        {/* ELEGANT CENTRAL NAVIGATION LINKS (Desktop/Tablet) */}
        <nav className="hidden md:flex items-center gap-8 font-mono text-xs tracking-widest text-gray-400">
          <button
            onClick={onHomeClick}
            className="hover:text-amber-400 transition-colors cursor-pointer py-2 uppercase font-medium"
          >
            Home
          </button>
          <button
            onClick={onShopClick}
            className="hover:text-amber-400 transition-colors cursor-pointer py-2 uppercase font-medium flex items-center gap-1.5"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Shop
          </button>
          <button
            onClick={onAboutClick}
            className="hover:text-amber-400 transition-colors cursor-pointer py-2 uppercase font-medium"
          >
            About
          </button>
          <button
            onClick={onOpenWishlistDrawer}
            className="hover:text-amber-400 transition-colors cursor-pointer py-2 uppercase font-medium"
          >
            {brandName}
          </button>
        </nav>

        {/* DESKTOP NAV CONTROLS */}
        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={onSearchToggle}
            className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Search Shop"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* WISHLIST BUTTON */}
          <button 
            onClick={onOpenWishlistDrawer}
            className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer relative"
            title={brandName}
          >
            <Heart className="w-4 h-4" />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
            )}
          </button>

          {/* CART BUTTON */}
          <button 
            onClick={onOpenCartDrawer}
            className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer relative flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 hover:border-amber-500/20"
            title="My Cart"
          >
            <ShoppingBag className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-mono text-white font-bold">{cartCount}</span>
          </button>

          {/* AUTHENTICATION / DASHBOARD */}
          {currentUser ? (
            <div className="flex items-center gap-3">
              {currentUser.role === 'admin' && (
                <button
                  onClick={onAdminClick}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-mono uppercase font-bold hover:bg-amber-500/20 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </button>
              )}

              <button
                onClick={onDashboardClick}
                className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer relative"
                title="Your Account"
              >
                <User className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={onLogout}
                className="p-2 text-red-400/80 hover:text-red-400 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onAuthClick}
              className="px-4 py-2 bg-white hover:bg-gray-200 text-black text-xs font-mono tracking-widest uppercase rounded-xl transition-all cursor-pointer font-bold"
            >
              Sign In
            </button>
          )}
        </div>

        {/* MOBILE MENU TRIGGER */}
        <div className="md:hidden flex items-center gap-3">
          <button 
            onClick={onSearchToggle}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          <button 
            onClick={onOpenCartDrawer}
            className="p-2 text-amber-500 hover:text-amber-400 relative"
          >
            <ShoppingBag className="w-4.5 h-4.5" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#060606] border-t border-white/5 p-6 space-y-6 font-mono text-[11px] uppercase tracking-wider text-gray-300 shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                onOpenWishlistDrawer();
                setMobileMenuOpen(false);
              }}
              className="py-3.5 bg-white/5 border border-white/10 rounded-xl text-center active:bg-white/10 transition-colors"
            >
              {brandName} ({wishlistCount})
            </button>
            <button
              onClick={() => {
                onOpenCartDrawer();
                setMobileMenuOpen(false);
              }}
              className="py-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-center active:bg-amber-500/20 transition-colors"
            >
              Cart ({cartCount})
            </button>
          </div>

          {/* Quick Page Nav inside Mobile Menu */}
          <div className="grid grid-cols-2 gap-3 border-y border-white/5 py-6">
            <button
              onClick={() => {
                if (onHomeClick) onHomeClick();
                setMobileMenuOpen(false);
              }}
              className="py-3 bg-white/5 text-gray-300 rounded-xl text-center active:bg-white/10 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => {
                if (onShopClick) onShopClick();
                setMobileMenuOpen(false);
              }}
              className="py-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-center active:bg-amber-500/20 transition-colors"
            >
              Shop
            </button>
            <button
              onClick={() => {
                if (onAboutClick) onAboutClick();
                setMobileMenuOpen(false);
              }}
              className="py-3 bg-white/5 text-gray-300 rounded-xl text-center active:bg-white/10 transition-colors col-span-2"
            >
              About Us
            </button>
          </div>

          <div className="space-y-3">
            {currentUser ? (
              <>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      onAdminClick();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-3.5 bg-amber-500 text-black font-bold text-center rounded-xl active:bg-amber-400 transition-colors"
                  >
                    Admin Control Room
                  </button>
                )}

                <button
                  onClick={() => {
                    onDashboardClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3.5 bg-white/5 border border-white/10 text-white text-center rounded-xl active:bg-white/10 transition-colors"
                >
                  Your Account
                </button>

                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3.5 bg-red-950/20 border border-red-500/20 text-red-400 text-center rounded-xl active:bg-red-900/30 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onAuthClick();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3.5 bg-white text-black font-bold text-center rounded-xl active:bg-gray-200 transition-colors"
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
