import { useState, useEffect, useRef } from 'react';
import { Product, Variant, CartItem } from '../types';
import { X, ShoppingBag, Eye, Heart, Plus, Minus, Star, ChevronRight } from 'lucide-react';
import Reviews from './Reviews';

interface ProductDetailsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onBuyNow: (item: CartItem) => void;
  onToggleWishlist: (productId: string) => void;
  isInWishlist: boolean;
  currentUser: any;
  allProducts: Product[];
  onSelectRelated: (p: Product) => void;
}

export default function ProductDetailsModal({ 
  product, isOpen, onClose, onAddToCart, onBuyNow, onToggleWishlist, isInWishlist, currentUser, allProducts, onSelectRelated
}: ProductDetailsModalProps) {
  const [activeImg, setActiveImg] = useState(product.images[0]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [showLens, setShowLens] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  const handleZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = imageContainerRef.current!.getBoundingClientRect();
    setLensPos({
      x: e.clientX - left,
      y: e.clientY - top
    });
  };
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

  const handleBuyNowAction = () => {
    onBuyNow({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1F1F]/40 backdrop-blur-md overflow-y-auto font-sans">
      <div 
        id={`details-modal-${product.id}`}
        className="relative w-full max-w-5xl bg-white border border-[#E8E1D6] rounded-2xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 border border-[#E8E1D6] text-[#666666] hover:text-[#1F1F1F] transition-all cursor-pointer shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT: GALLERY INSPECTOR (6 COLS) */}
          <div className="lg:col-span-6 p-6 sm:p-8 space-y-4">
            <div 
              ref={imageContainerRef}
              className="w-full aspect-square rounded-xl overflow-hidden border border-[#E8E1D6] bg-[#F8F5EF] relative group cursor-crosshair"
              onMouseMove={handleZoom}
              onMouseLeave={() => setShowLens(false)}
              onMouseEnter={() => setShowLens(true)}
            >
              {product.isNew && (
                <span className="absolute top-4 left-4 z-10 text-[9px] font-mono tracking-widest bg-[#C9A227] text-white px-2.5 py-1 rounded-full uppercase font-bold">
                  New Arrival
                </span>
              )}
              <img 
                src={activeImg} 
                alt={product.name} 
                className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-100" 
              />
              
              {showLens && (
                <div 
                  className="absolute z-20 border-2 border-white shadow-lg rounded-full pointer-events-none overflow-hidden"
                  style={{
                    width: '150px',
                    height: '150px',
                    left: `${lensPos.x - 75}px`,
                    top: `${lensPos.y - 75}px`,
                    backgroundImage: `url(${activeImg})`,
                    backgroundSize: '300% 300%',
                    backgroundPosition: `${(lensPos.x / (imageContainerRef.current?.offsetWidth || 1)) * 100}% ${(lensPos.y / (imageContainerRef.current?.offsetHeight || 1)) * 100}%`
                  }}
                />
              )}
            </div>

            {/* Thumbnails row */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#C9A227]/20 max-h-[200px] flex-wrap">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImg(img)}
                  className={`w-14 h-14 sm:w-18 sm:h-18 rounded-lg overflow-hidden border transition-all cursor-pointer shrink-0 ${
                    activeImg === img ? 'border-[#C9A227] scale-105 shadow-[0_5px_15px_rgba(201,162,39,0.15)]' : 'border-[#E8E1D6] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: EDITORIAL DETAILS (6 COLS) */}
          <div className="lg:col-span-6 p-6 sm:p-8 space-y-6 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[#E8E1D6]">
            <div className="space-y-4">
              {/* Category & Tags */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-[0.2em] text-[#C9A227] uppercase font-bold">
                  {product.category}
                </span>
                <ChevronRight className="w-3 h-3 text-neutral-300" />
                <span className="text-[10px] font-mono text-[#666666] uppercase">
                  {product.subCategory}
                </span>
              </div>

              {/* Title & Tagline */}
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-sans tracking-tight text-[#1F1F1F] font-bold">
                  {product.name}
                </h2>
                <p className="text-xs sm:text-sm text-[#666666] font-sans italic font-light">
                  {product.tagline}
                </p>
              </div>

              {/* Ratings preview */}
              <div className="flex items-center gap-3">
                <div className="flex text-[#C9A227]">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-[#C9A227]" />)}
                </div>
                <span className="text-xs font-mono text-[#666666]">{product.rating} ({product.ratingCount} Reviews)</span>
              </div>

              {/* Price block */}
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-sans text-[#1F1F1F] tracking-tight font-bold font-mono">
                  ₹{unitPrice}
                </span>
                {product.originalPrice && (
                  <span className="text-sm line-through text-gray-400 font-mono">
                    ₹{product.originalPrice}
                  </span>
                )}
              </div>

              {/* TAB SELECTORS */}
              <div className="flex border-b border-[#E8E1D6] pt-2 text-xs font-mono text-[#666666] gap-6">
                {['details', 'specs', 'reviews'].map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t as any)}
                    className={`pb-2 uppercase tracking-wider relative cursor-pointer font-bold ${
                      activeTab === t ? 'text-[#1F1F1F]' : 'hover:text-[#1F1F1F]'
                    }`}
                  >
                    {t}
                    {activeTab === t && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A227]" />
                    )}
                  </button>
                ))}
              </div>

              {/* TABS CONTENT */}
              <div className="py-2">
                {activeTab === 'details' && (
                  <p className="text-xs sm:text-sm text-[#666666] font-sans font-medium leading-relaxed">
                    {product.description}
                  </p>
                )}

                {activeTab === 'specs' && (
                  <div className="space-y-2 text-xs font-mono text-[#666666]">
                    {Object.entries(product.specs).map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-[#E8E1D6] pb-1.5 last:border-0 last:pb-0">
                        <span className="text-neutral-400 font-medium">{k}:</span>
                        <span className="text-[#1F1F1F] text-right font-bold">{v}</span>
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
                <div className="space-y-2 border-t border-[#E8E1D6] pt-4">
                  <span className="text-[10px] font-mono text-[#C9A227] tracking-widest uppercase block font-bold">
                    {product.variantLabel || 'Choose Variant'}: <span className="text-[#1F1F1F] font-sans text-xs lowercase ml-1">{selectedVariant?.name}</span>
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
                              isSelected ? 'border-[#C9A227] scale-108' : 'border-[#E8E1D6]'
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
                          className={`px-4 py-2 border rounded-xl text-xs font-mono transition-all cursor-pointer font-bold ${
                            isSelected 
                              ? 'border-[#C9A227] bg-[#C9A227]/10 text-[#C9A227] shadow-sm' 
                              : 'border-[#E8E1D6] bg-[#F8F5EF] text-[#666666] hover:border-[#C9A227]/40'
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
            <div className="border-t border-[#E8E1D6] pt-6 space-y-4">
              <div className="flex items-center justify-between">
                {/* Stock feedback */}
                <span className="text-xs font-mono text-[#666666] font-bold">
                  Status:{' '}
                  {selectedVariant && selectedVariant.stock < 5 ? (
                    <span className="text-orange-500 font-bold uppercase tracking-wider underline decoration-2 underline-offset-4">Only {selectedVariant.stock} left</span>
                  ) : selectedVariant && selectedVariant.stock > 0 ? (
                    <span className="text-emerald-600 uppercase tracking-wider">Available in Vault</span>
                  ) : (
                    <span className="text-red-500 uppercase tracking-wider">Currently Unavailable</span>
                  )}
                </span>

                {/* Qty incrementer */}
                {selectedVariant && selectedVariant.stock > 0 && (
                  <div className="flex items-center gap-3 bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-2.5 py-1 text-xs">
                    <button 
                      onClick={() => handleQtyChange(-1)}
                      className="p-1 text-[#666666] hover:text-[#1F1F1F] cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-[#1F1F1F] text-sm w-4 text-center font-bold">{quantity}</span>
                    <button 
                      onClick={() => handleQtyChange(1)}
                      className="p-1 text-[#666666] hover:text-[#1F1F1F] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* CTAs */}
              <div className="flex gap-2 sm:gap-4">
                <button
                  onClick={handleAddAction}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                  className="flex-1 py-4 px-2 bg-[#F8F5EF] border border-[#E8E1D6] hover:bg-white disabled:opacity-50 text-[#1F1F1F] text-[10px] sm:text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-bold cursor-pointer flex items-center justify-center gap-1 sm:gap-2 shadow-sm"
                >
                  <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 text-[#C9A227]" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={handleBuyNowAction}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                  className="flex-1 py-4 px-2 bg-[#C9A227] hover:bg-[#B68D1F] disabled:opacity-50 text-white text-[10px] sm:text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-bold cursor-pointer flex items-center justify-center shadow-md shadow-[#C9A227]/20"
                >
                  <span>Buy Now</span>
                </button>

                <button
                  onClick={() => onToggleWishlist(product.id)}
                  className={`p-4 shrink-0 border rounded-xl transition-all cursor-pointer ${
                    isInWishlist 
                      ? 'border-red-500/40 bg-red-500/10 text-red-500' 
                      : 'border-[#E8E1D6] bg-[#F8F5EF] text-[#666666] hover:text-[#1F1F1F] hover:border-[#C9A227]/40'
                  }`}
                  title="Add to Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-red-500' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products ... */}
        {related.length > 0 && (
          <div className="p-6 sm:p-8 border-t border-[#E8E1D6] bg-[#F8F5EF]/50 space-y-4">
            <h4 className="text-xs font-mono text-[#C9A227] tracking-widest uppercase font-bold">Related Curation</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((rel) => (
                <div 
                  key={rel.id}
                  onClick={() => onSelectRelated(rel)}
                  className="border border-[#E8E1D6] bg-white rounded-xl p-3 flex gap-3 items-center cursor-pointer hover:border-[#C9A227]/40 transition-all group shadow-sm"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-[#E8E1D6] bg-[#F8F5EF]">
                    <img src={rel.images[0]} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h5 className="text-xs font-sans font-medium text-[#1F1F1F] truncate group-hover:text-[#C9A227] transition-colors uppercase tracking-tight">{rel.name}</h5>
                    <p className="text-[10px] text-[#666666] font-mono font-bold">₹{rel.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full-screen Zoom Modal */}
      </div>
    </div>
  );
}
