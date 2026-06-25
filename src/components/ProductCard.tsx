import React, { useState } from 'react';
import { Product, CartItem } from '../types';
import { ShoppingBag, Eye, Heart, Star, Sparkles } from 'lucide-react';

interface ProductCardProps {
  key?: string;
  product: Product;
  onQuickView: (p: Product) => void;
  onAddToCart: (item: CartItem) => void;
  onToggleWishlist: (productId: string) => void;
  isInWishlist: boolean;
  lightMode?: boolean;
}

export default function ProductCard({ 
  product, onQuickView, onAddToCart, onToggleWishlist, isInWishlist, lightMode = false 
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const primaryImage = product.images[0];
  const secondaryImage = product.images[1] || product.images[0];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Grab the first variant if exists, else standard std
    const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : undefined;
    onAddToCart({
      id: `${product.id}-${firstVariant?.id || 'std'}`,
      product,
      selectedVariant: firstVariant,
      quantity: 1
    });
  };

  return (
    <div 
      id={`product-card-${product.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onQuickView(product)}
      className={`group border rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer flex flex-col h-full w-full ${
        lightMode
          ? 'bg-white border-gray-150 hover:border-amber-500/30 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]'
          : 'bg-[#0c0c0c]/60 border-white/10 hover:border-amber-500/20 hover:shadow-[0_4px_30px_rgba(212,175,55,0.03)]'
      }`}
    >
      {/* Product Image block */}
      <div className="relative aspect-[4/5] overflow-hidden bg-black shrink-0">
        {/* Badges */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex flex-col gap-1 items-start">
          {product.isNew && (
            <span className="text-[7px] sm:text-[8px] font-mono tracking-widest bg-amber-500 text-black px-1.5 sm:px-2 py-0.5 rounded-full uppercase font-bold">
              New
            </span>
          )}
          {product.isFeatured && (
            <span className={`text-[7px] sm:text-[8px] font-mono tracking-widest border px-1.5 sm:px-2 py-0.5 rounded-full uppercase font-bold flex items-center gap-0.5 ${
              lightMode
                ? 'bg-amber-100/80 border-amber-300 text-amber-800'
                : 'bg-white/10 border-amber-500/20 text-amber-300'
            }`}>
              <Sparkles className="w-2 sm:w-2.5 h-2 sm:h-2.5" /> Featured
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-1.5 sm:p-2 rounded-full border backdrop-blur-md transition-all cursor-pointer ${
            isInWishlist 
              ? 'bg-red-500/10 border-red-500/20 text-red-500' 
              : lightMode
                ? 'bg-white/80 border-gray-200 text-gray-400 hover:text-gray-900 hover:scale-105'
                : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:scale-105'
          }`}
        >
          <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isInWishlist ? 'fill-red-500' : ''}`} />
        </button>

        {/* Image element with dynamic swap */}
        <img 
          src={isHovered ? secondaryImage : primaryImage} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Floating Quick view cover bar */}
        <div className="absolute inset-x-0 bottom-0 p-2 sm:p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1.5 sm:gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="flex-1 py-1.5 sm:py-2 bg-white hover:bg-gray-100 text-black text-[9px] sm:text-[10px] font-mono tracking-widest uppercase rounded-xl transition-all font-bold flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shadow-lg"
          >
            <Eye className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Quick View
          </button>
          
          <button
            onClick={handleQuickAdd}
            disabled={product.variants?.[0]?.stock === 0}
            className="p-1.5 sm:p-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl transition-all cursor-pointer shadow-lg disabled:opacity-50"
            title="Add to Cart"
          >
            <ShoppingBag className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          </button>
        </div>
      </div>

      {/* Content description panel */}
      <div className={`p-3 xs:p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3 ${lightMode ? 'bg-white' : ''}`}>
        <div className="space-y-1 sm:space-y-1.5">
          <div className={`flex items-center justify-between text-[8px] sm:text-[9px] font-mono uppercase tracking-wider ${
            lightMode ? 'text-amber-700' : 'text-amber-500/80'
          }`}>
            <span className="truncate max-w-[70%]">{product.category}</span>
            <div className="flex items-center gap-0.5 text-amber-500 font-bold shrink-0">
              <Star className="w-2 sm:w-2.5 h-2 sm:h-2.5 fill-amber-500" />
              <span>{product.rating}</span>
            </div>
          </div>
          
          <h4 className={`text-xs sm:text-sm font-sans font-medium tracking-wide transition-colors truncate ${
            lightMode ? 'text-gray-900 group-hover:text-amber-800' : 'text-white group-hover:text-amber-200'
          }`}>
            {product.name}
          </h4>
          <p className={`text-[9px] sm:text-[11px] font-sans italic font-light truncate ${
            lightMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {product.tagline}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-white/5 sm:border-transparent">
          <span className={`text-xs sm:text-sm font-sans font-semibold font-mono ${
            lightMode ? 'text-gray-900' : 'text-white'
          }`}>
            ₹{product.price}
          </span>
          {product.originalPrice && (
            <span className={`text-[10px] sm:text-xs line-through font-mono ${
              lightMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              ₹{product.originalPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
