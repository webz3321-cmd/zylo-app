import { useState, useEffect } from 'react';
import { Product, Variant, CartItem } from '../types';
import { X, ShoppingBag, Eye, Heart, Plus, Minus, Star, ChevronRight, Sparkles } from 'lucide-react';
import Reviews from './Reviews';

interface ProductDetailsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onToggleWishlist: (productId: string) => void;
  isInWishlist: boolean;
  currentUser: any;
  allProducts: Product[];
  onSelectRelated: (p: Product) => void;
}

export default function ProductDetailsModal({ 
  product, isOpen, onClose, onAddToCart, onToggleWishlist, isInWishlist, currentUser, allProducts, onSelectRelated
}: ProductDetailsModalProps) {
  const [activeImg, setActiveImg] = useState(product.images[0]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews'>('details');

  // Reset states when product changes
  useEffect(() => {
    setActiveImg(product.images[0]);
    setSelectedVariant(product.variants && product.variants.length > 0 ? product.variants[0] : undefined);
    setQuantity(1);
    setActiveTab('details');
  }, [product]);

  if (!isOpen) return null;

  // Pricing based on variant
  const basePrice = product.price;
  const additional = selectedVariant?.additionalPrice || 0;
  const unitPrice = basePrice + additional;

  const handleQtyChange = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(prev + delta, selectedVariant?.stock || 10)));
  };

  const handleAddAction = () => {
    onAddToCart({
      id: `${product.id}-${selectedVariant?.id || 'std'}`,
      product,
      selectedVariant,
      quantity
    });
  };

  const related = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id={`details-modal-${product.id}`}
        className="relative w-full max-w-5xl bg-[#090909] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT: GALLERY INSPECTOR (5 COLS) */}
          <div className="lg:col-span-6 p-6 sm:p-8 space-y-4">
            <div className="w-full aspect-square rounded-xl overflow-hidden border border-white/10 bg-black relative group">
              {product.isNew && (
                <span className="absolute top-4 left-4 z-10 text-[9px] font-mono tracking-widest bg-amber-500 text-black px-2.5 py-1 rounded-full uppercase font-bold">
                  New Arrival
                </span>
              )}
              <img 
                src={activeImg} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
            </div>

            {/* Thumbnails row */}
            <div className="flex gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImg(img)}
                  className={`w-18 h-18 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                    activeImg === img ? 'border-amber-500 scale-102' : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: EDITORIAL DETAILS (6 COLS) */}
          <div className="lg:col-span-6 p-6 sm:p-8 space-y-6 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/5">
            <div className="space-y-4">
              {/* Category & Tags */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-[0.2em] text-amber-500 uppercase">
                  {product.category}
                </span>
                <ChevronRight className="w-3 h-3 text-gray-600" />
                <span className="text-[10px] font-mono text-gray-400 uppercase">
                  {product.subCategory}
                </span>
              </div>

              {/* Title & Tagline */}
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-sans tracking-tight text-white font-light">
                  {product.name}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 font-sans italic font-light">
                  {product.tagline}
                </p>
              </div>

              {/* Ratings preview */}
              <div className="flex items-center gap-3">
                <div className="flex text-amber-500">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-amber-500" />)}
                </div>
                <span className="text-xs font-mono text-gray-400">{product.rating} ({product.ratingCount} Reviews)</span>
              </div>

              {/* Price block */}
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-sans text-white tracking-tight font-light font-mono">
                  ₹{unitPrice}
                </span>
                {product.originalPrice && (
                  <span className="text-sm line-through text-gray-500 font-mono">
                    ₹{product.originalPrice}
                  </span>
                )}
              </div>

              {/* TAB SELECTORS */}
              <div className="flex border-b border-white/5 pt-2 text-xs font-mono text-gray-400 gap-6">
                {['details', 'specs', 'reviews'].map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t as any)}
                    className={`pb-2 uppercase tracking-wider relative cursor-pointer ${
                      activeTab === t ? 'text-white' : 'hover:text-white'
                    }`}
                  >
                    {t}
                    {activeTab === t && (
                      <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-amber-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* TABS CONTENT */}
              <div className="py-2">
                {activeTab === 'details' && (
                  <p className="text-xs sm:text-sm text-gray-300 font-sans font-light leading-relaxed">
                    {product.description}
                  </p>
                )}

                {activeTab === 'specs' && (
                  <div className="space-y-2 text-xs font-mono text-gray-300">
                    {Object.entries(product.specs).map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                        <span className="text-gray-500">{k}:</span>
                        <span className="text-white text-right">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="pt-2">
                    <Reviews productId={product.id} currentUser={currentUser} />
                  </div>
                )}
              </div>

              {/* DYNAMIC VARIANTS PICKER */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <span className="text-[10px] font-mono text-amber-500 tracking-widest uppercase block">
                    Choose Variant: <span className="text-white font-sans text-xs lowercase ml-1">{selectedVariant?.name}</span>
                  </span>

                  <div className="flex flex-wrap gap-2.5">
                    {product.variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      const isOutOfStock = v.stock === 0;

                      if (v.type === 'color') {
                        return (
                          <button
                            key={v.id}
                            disabled={isOutOfStock}
                            onClick={() => setSelectedVariant(v)}
                            className={`w-9 h-9 rounded-full relative flex items-center justify-center border-2 transition-all cursor-pointer ${
                              isSelected ? 'border-amber-500 scale-108' : 'border-white/10'
                            } ${isOutOfStock ? 'opacity-30 cursor-not-allowed' : ''}`}
                            title={v.name}
                          >
                            <span 
                              className="w-6 h-6 rounded-full block border border-black/10" 
                              style={{ backgroundColor: v.value }}
                            />
                            {isSelected && <span className="absolute w-1.5 h-1.5 rounded-full bg-white inset-0 m-auto mix-blend-difference" />}
                          </button>
                        );
                      }

                      // Volume or size buttons
                      return (
                        <button
                          key={v.id}
                          disabled={isOutOfStock}
                          onClick={() => setSelectedVariant(v)}
                          className={`px-4 py-2 border rounded-xl text-xs font-mono transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-amber-500 bg-amber-500/10 text-white shadow-[0_0_10px_rgba(245,158,11,0.15)]' 
                              : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'
                          } ${isOutOfStock ? 'opacity-25 cursor-not-allowed' : ''}`}
                        >
                          {v.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* CONTROLS AREA */}
            <div className="border-t border-white/5 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                {/* Stock feedback */}
                <span className="text-xs font-mono text-gray-400">
                  Status:{' '}
                  {selectedVariant && selectedVariant.stock < 5 ? (
                    <span className="text-amber-400 font-bold uppercase tracking-wider">Only {selectedVariant.stock} left in stock</span>
                  ) : selectedVariant && selectedVariant.stock > 0 ? (
                    <span className="text-emerald-400 uppercase tracking-wider">In Stock</span>
                  ) : (
                    <span className="text-red-400 uppercase tracking-wider">Out of Stock</span>
                  )}
                </span>

                {/* Qty incrementer */}
                {selectedVariant && selectedVariant.stock > 0 && (
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs">
                    <button 
                      onClick={() => handleQtyChange(-1)}
                      className="p-1 text-gray-400 hover:text-white cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-white text-sm w-4 text-center">{quantity}</span>
                    <button 
                      onClick={() => handleQtyChange(1)}
                      className="p-1 text-gray-400 hover:text-white cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* CTAs */}
              <div className="flex gap-4">
                <button
                  onClick={handleAddAction}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                  className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-bold cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={() => onToggleWishlist(product.id)}
                  className={`p-4 border rounded-xl transition-all cursor-pointer ${
                    isInWishlist 
                      ? 'border-red-500/40 bg-red-500/10 text-red-500' 
                      : 'border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20'
                  }`}
                  title="Add to Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-red-500' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {related.length > 0 && (
          <div className="p-6 sm:p-8 border-t border-white/5 bg-black/40 space-y-4">
            <h4 className="text-xs font-mono text-amber-500 tracking-widest uppercase">Related Products</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((rel) => (
                <div 
                  key={rel.id}
                  onClick={() => onSelectRelated(rel)}
                  className="border border-white/5 bg-[#0f0f0f] rounded-xl p-3 flex gap-3 items-center cursor-pointer hover:border-amber-500/20 transition-all group"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black">
                    <img src={rel.images[0]} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h5 className="text-xs font-sans font-medium text-white truncate group-hover:text-amber-300 transition-colors">{rel.name}</h5>
                    <p className="text-[10px] text-gray-400 font-mono">₹{rel.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
