import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, ThumbsUp, Camera, Check, X, Image as ImageIcon } from 'lucide-react';
import { Review } from '../types';
import { EcommerceService } from '../lib/ecommerceService';

interface ReviewsProps {
  productId: string;
  currentUser: any;
}

export default function Reviews({ productId, currentUser }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState<{
    image: string;
    userName: string;
    rating: number;
    title: string;
    comment: string;
    date: string;
    verified: boolean;
  } | null>(null);
  
  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [imageFiles, setImageFiles] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    const list = await EcommerceService.getReviews(productId);
    setReviews(list);
  };

  const handleLike = async (reviewId: string) => {
    const localData = localStorage.getItem('zylo_reviews');
    const allReviews: Review[] = localData ? JSON.parse(localData) : [];
    const index = allReviews.findIndex(r => r.id === reviewId);
    if (index >= 0) {
      allReviews[index].likes += 1;
      localStorage.setItem('zylo_reviews', JSON.stringify(allReviews));
      
      // Update state locally
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, likes: r.likes + 1 } : r));
    }
  };

  // Simulated image upload for e-commerce realism
  const handleImageMock = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageFiles(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file as unknown as Blob);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!comment || !title) return;

    setIsSubmitting(true);
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      productId,
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email.split('@')[0],
      rating,
      title,
      comment,
      date: new Date().toISOString().split('T')[0],
      images: imageFiles.length > 0 ? imageFiles : undefined,
      verified: true, // Mock purchase validation
      likes: 0
    };

    await EcommerceService.addReview(newReview);
    setSuccessMsg('Thank you. Your critique has been securely published.');
    
    // Reset form
    setTitle('');
    setComment('');
    setImageFiles([]);
    setRating(5);
    setIsSubmitting(false);
    
    // Reload reviews
    loadReviews();

    // Clear alert in 4 seconds
    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  // Calculate statistics
  const ratingDistribution = [0, 0, 0, 0, 0]; // Index 0 is 1 star, Index 4 is 5 star
  let totalRatingSum = 0;
  reviews.forEach(r => {
    totalRatingSum += r.rating;
    const idx = Math.floor(r.rating) - 1;
    if (idx >= 0 && idx < 5) {
      ratingDistribution[idx]++;
    }
  });

  const averageRating = reviews.length > 0 ? parseFloat((totalRatingSum / reviews.length).toFixed(1)) : 5.0;

  return (
    <div id="reviews-container" className="space-y-12">
      {/* Critique Header & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#F8F5EF] border border-[#E8E1D6] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="md:col-span-4 text-center space-y-2 md:border-r border-[#E8E1D6] md:pr-8">
          <span className="text-[10px] font-mono tracking-widest text-[#C9A227] uppercase font-bold">Average Rating</span>
          <div className="text-5xl font-sans text-[#1F1F1F] font-bold tracking-tight">{averageRating}</div>
          <div className="flex justify-center text-[#C9A227] gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star 
                key={star} 
                className={`w-4 h-4 ${star <= Math.round(averageRating) ? 'fill-[#C9A227]' : 'text-neutral-300'}`} 
              />
            ))}
          </div>
          <p className="text-xs text-[#666666] font-mono">Based on {reviews.length} direct critiques</p>
        </div>

        {/* Distribution Bars */}
        <div className="md:col-span-8 space-y-2.5">
          {[5, 4, 3, 2, 1].map(stars => {
            const count = ratingDistribution[stars - 1];
            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs font-mono text-[#666666]">
                <span className="w-12 text-right">{stars} star</span>
                <div className="flex-1 h-1.5 bg-[#E8E1D6] rounded-full overflow-hidden border border-neutral-100">
                  <div 
                    className="h-full bg-gradient-to-r from-[#C9A227] to-[#B68D1F] rounded-full transition-all duration-1000" 
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right font-bold text-[#1F1F1F]">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Write critique box */}
        <div className="lg:col-span-5 bg-white border border-[#E8E1D6] rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="space-y-1">
            <h4 className="text-base font-sans font-bold text-[#1F1F1F] tracking-wide uppercase">Publish a Review</h4>
            <p className="text-xs text-[#666666] font-sans font-medium">Share your honest sensory experience with this masterpiece.</p>
          </div>

          {currentUser ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {successMsg && (
                <div className="border border-emerald-500/20 bg-emerald-50 rounded-xl p-3 text-xs text-emerald-700 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Dynamic Interactive Star Select */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#C9A227] tracking-wider block uppercase font-bold">Select Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="text-[#C9A227] hover:scale-115 transition-transform p-1 cursor-pointer"
                    >
                      <Star 
                        className={`w-6 h-6 ${
                          star <= (hoverRating ?? rating) ? 'fill-[#C9A227]' : 'text-neutral-200'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#666666] tracking-wider block uppercase font-bold">Critique Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterful scent, deeply complex"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2 text-sm text-[#1F1F1F] placeholder-gray-400 focus:outline-none focus:border-[#C9A227]/50"
                />
              </div>

              {/* Review input */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#666666] tracking-wider block uppercase font-bold">Comment</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the packaging, longevity, visual luster, or texture..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-3 text-sm text-[#1F1F1F] placeholder-gray-400 focus:outline-none focus:border-[#C9A227]/50 resize-none"
                />
              </div>

              {/* Image Attachments */}
              <div className="space-y-3">
                <label className="text-xs font-mono text-[#666666] tracking-wider block uppercase font-bold">Attach Photos (Optional)</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Upload from Album */}
                  <label className="flex flex-col items-center justify-center p-3 border border-dashed border-[#E8E1D6] hover:border-[#C9A227]/40 rounded-xl bg-[#F8F5EF] cursor-pointer transition-all duration-200 group text-center">
                    <ImageIcon className="w-5 h-5 text-gray-400 group-hover:text-[#C9A227] mb-1 transition-colors" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666] group-hover:text-[#C9A227] font-bold">From Album</span>
                    <span className="text-[8px] text-gray-400">Upload photos</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={handleImageMock} 
                      className="hidden" 
                    />
                  </label>

                  {/* Take Photo with Camera */}
                  <label className="flex flex-col items-center justify-center p-3 border border-dashed border-[#E8E1D6] hover:border-[#C9A227]/40 rounded-xl bg-[#F8F5EF] cursor-pointer transition-all duration-200 group text-center">
                    <Camera className="w-5 h-5 text-gray-400 group-hover:text-[#C9A227] mb-1 transition-colors" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666] group-hover:text-[#C9A227] font-bold">Direct Camera</span>
                    <span className="text-[8px] text-gray-400">Use native camera</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      onChange={handleImageMock} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {imageFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center pt-1">
                    {imageFiles.map((img, i) => (
                      <div key={i} className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#E8E1D6] group shadow-sm">
                        <img src={img} alt="review" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-[#1F1F1F]/60 rounded-full text-white opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit btn */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#C9A227] hover:bg-[#B68D1F] text-white text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-bold cursor-pointer disabled:opacity-50 shadow-md shadow-[#C9A227]/20"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Critique'}
              </button>
            </form>
          ) : (
            <div className="border border-[#E8E1D6] bg-[#F8F5EF] rounded-xl p-4 text-center">
              <p className="text-xs text-[#666666]">Please authenticate your credentials to publish a critique.</p>
            </div>
          )}
        </div>

        {/* Review list */}
        <div className="lg:col-span-7 space-y-6">
          <h4 className="text-sm font-mono text-[#C9A227] tracking-widest uppercase font-bold">Verified Critiques ({reviews.length})</h4>
          
          {reviews.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#E8E1D6] rounded-2xl text-[#666666] bg-[#F8F5EF]/50">
              <p className="text-sm font-sans font-medium italic">Be the first to leave a critique for this masterpiece.</p>
            </div>
          ) : (
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {reviews.map((rev) => (
                <div 
                  key={rev.id} 
                  id={`review-item-${rev.id}`}
                  className="border-b border-[#E8E1D6] pb-6 space-y-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-sans font-bold text-[#1F1F1F] tracking-wide uppercase">{rev.userName}</h5>
                        {rev.verified && (
                          <span className="flex items-center gap-1 text-[9px] font-mono tracking-wider bg-[#C9A227]/10 text-[#C9A227] px-1.5 py-0.5 rounded-full border border-[#C9A227]/20 uppercase font-bold">
                            <ShieldCheck className="w-3 h-3" /> Verified Owner
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#666666] font-mono block mt-0.5">{rev.date}</span>
                    </div>

                    <div className="flex text-[#C9A227] gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star} 
                          className={`w-3.5 h-3.5 ${star <= rev.rating ? 'fill-[#C9A227]' : 'text-neutral-200'}`} 
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h6 className="text-xs font-mono text-[#1F1F1F] tracking-wide font-bold uppercase">{rev.title}</h6>
                    <p className="text-xs sm:text-sm text-[#666666] font-sans font-medium leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>

                  {/* Review photos in small clickable boxes */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {rev.images.map((img, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setActiveLightbox({
                            image: img,
                            userName: rev.userName,
                            rating: rev.rating,
                            title: rev.title,
                            comment: rev.comment,
                            date: rev.date,
                            verified: rev.verified || false
                          })}
                          className="w-16 h-16 rounded-lg overflow-hidden border border-[#E8E1D6] bg-[#F8F5EF] cursor-pointer group relative hover:border-[#C9A227]/50 transition-all shadow-sm"
                        >
                          <img src={img} alt="critique attachment" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                          <div className="absolute bottom-0.5 right-0.5 bg-white/90 px-1 py-0.5 rounded text-[8px] font-mono text-[#C9A227] flex items-center gap-0.5 shadow-sm font-bold border border-[#E8E1D6]">
                            <Star className="w-2 h-2 fill-[#C9A227] text-[#C9A227]" />
                            <span>{rev.rating}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-[10px] font-mono text-[#666666] pt-1">
                    <span>Was this helpful?</span>
                    <button 
                      onClick={() => handleLike(rev.id)}
                      className="flex items-center gap-1.5 text-[#C9A227] hover:text-[#B68D1F] transition-colors focus:outline-none cursor-pointer font-bold"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{rev.likes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upgraded Professional Lightbox Modal with Star Comment and Details */}
      {activeLightbox && (
        <div 
          className="fixed inset-0 z-[100] bg-[#1F1F1F]/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" 
          onClick={() => setActiveLightbox(null)}
        >
          <div 
            className="relative w-full max-w-4xl bg-white border border-[#E8E1D6] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-[0_30px_90px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/80 hover:bg-white text-[#666666] hover:text-[#1F1F1F] transition-all border border-[#E8E1D6] shadow-sm cursor-pointer" 
              onClick={() => setActiveLightbox(null)}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left/Top Side: Image Panel */}
            <div className="w-full md:w-3/5 bg-[#F8F5EF] flex items-center justify-center p-4 min-h-[300px] md:min-h-[450px] relative">
              <img 
                src={activeLightbox.image} 
                alt="Product Critique" 
                className="max-w-full max-h-[50vh] md:max-h-[600px] object-contain rounded shadow-lg" 
              />
              
              {/* Floating rating badge over image */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#E8E1D6] flex items-center gap-1 shadow-lg text-xs font-mono text-[#C9A227] font-bold">
                <Star className="w-3.5 h-3.5 fill-[#C9A227] text-[#C9A227]" />
                <span>Rating: {activeLightbox.rating}.0</span>
              </div>
            </div>

            {/* Right/Bottom Side: Star Comment details panel */}
            <div className="w-full md:w-2/5 p-6 sm:p-8 flex flex-col justify-between bg-white border-t md:border-t-0 md:border-l border-[#E8E1D6]">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-[#C9A227] uppercase tracking-wider font-bold">Verified Purchase Photo</span>
                    {activeLightbox.verified && (
                      <span className="flex items-center gap-1 text-[8px] font-mono tracking-wider bg-[#C9A227]/10 text-[#C9A227] px-1.5 py-0.5 rounded-full border border-[#C9A227]/20 uppercase font-bold">
                        <ShieldCheck className="w-2.5 h-2.5" /> Verified
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-sans font-bold text-[#1F1F1F] tracking-tight mt-2 uppercase">{activeLightbox.userName}</h4>
                  <span className="text-[10px] text-[#666666] font-mono block mt-0.5">{activeLightbox.date}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex text-[#C9A227] gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= activeLightbox.rating ? 'fill-[#C9A227]' : 'text-neutral-200'}`} 
                      />
                    ))}
                  </div>
                  <h5 className="text-sm font-mono text-[#1F1F1F] tracking-wide font-bold uppercase">{activeLightbox.title}</h5>
                  <p className="text-xs sm:text-sm text-[#666666] font-sans font-medium leading-relaxed italic">
                    "{activeLightbox.comment}"
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-[#E8E1D6] flex items-center justify-between text-[11px] font-mono text-[#666666]">
                <span className="font-bold">Atelier Certified Critique</span>
                <button 
                  onClick={() => setActiveLightbox(null)}
                  className="px-4 py-1.5 rounded-md bg-[#F8F5EF] hover:bg-[#C9A227] hover:text-white transition-all text-xs font-sans font-bold cursor-pointer border border-[#E8E1D6]"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
