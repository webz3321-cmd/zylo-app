import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, ThumbsUp, Camera, Check, X } from 'lucide-react';
import { Review } from '../types';
import { EcommerceService } from '../lib/ecommerceService';

interface ReviewsProps {
  productId: string;
  currentUser: any;
}

export default function Reviews({ productId, currentUser }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
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
        reader.readAsDataURL(file);
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
        <div className="md:col-span-4 text-center space-y-2 md:border-r border-white/5 md:pr-8">
          <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase">Average Rating</span>
          <div className="text-5xl font-sans text-white font-light tracking-tight">{averageRating}</div>
          <div className="flex justify-center text-amber-500 gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star 
                key={star} 
                className={`w-4 h-4 ${star <= Math.round(averageRating) ? 'fill-amber-500' : 'text-gray-600'}`} 
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 font-mono">Based on {reviews.length} direct critiques</p>
        </div>

        {/* Distribution Bars */}
        <div className="md:col-span-8 space-y-2.5">
          {[5, 4, 3, 2, 1].map(stars => {
            const count = ratingDistribution[stars - 1];
            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs font-mono text-gray-400">
                <span className="w-12 text-right">{stars} star</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-1000" 
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Write critique box */}
        <div className="lg:col-span-5 bg-black/40 border border-white/5 rounded-2xl p-6 space-y-6">
          <div className="space-y-1">
            <h4 className="text-base font-sans font-medium text-white tracking-wide">Publish a Review</h4>
            <p className="text-xs text-gray-400 font-sans font-light">Share your honest sensory experience with this masterpiece.</p>
          </div>

          {currentUser ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {successMsg && (
                <div className="border border-emerald-500/20 bg-emerald-950/20 rounded-xl p-3 text-xs text-emerald-400 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Dynamic Interactive Star Select */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-amber-500 tracking-wider block uppercase">Select Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="text-amber-500 hover:scale-115 transition-transform p-1 cursor-pointer"
                    >
                      <Star 
                        className={`w-6 h-6 ${
                          star <= (hoverRating ?? rating) ? 'fill-amber-500' : 'text-gray-600'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400 tracking-wider block uppercase">Critique Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterful scent, deeply complex"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Review input */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400 tracking-wider block uppercase">Comment</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the packaging, longevity, visual luster, or texture..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>

              {/* Image Attachments */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-400 tracking-wider block uppercase">Attach Photos (Optional)</label>
                <div className="flex flex-wrap gap-2 items-center">
                  <label className="w-12 h-12 rounded-xl border border-dashed border-white/20 hover:border-amber-500/40 flex items-center justify-center text-gray-400 cursor-pointer transition-colors bg-white/5">
                    <Camera className="w-5 h-5" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      capture="environment"
                      onChange={handleImageMock} 
                      className="hidden" 
                    />
                  </label>

                  {imageFiles.map((img, i) => (
                    <div key={i} className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 group">
                      <img src={img} alt="review" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit btn */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono tracking-widest uppercase rounded-xl transition-colors font-semibold cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Critique'}
              </button>
            </form>
          ) : (
            <div className="border border-white/5 bg-white/5 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400">Please authenticate your credentials to publish a critique.</p>
            </div>
          )}
        </div>

        {/* Review list */}
        <div className="lg:col-span-7 space-y-6">
          <h4 className="text-sm font-mono text-amber-500 tracking-widest uppercase">Verified Critiques ({reviews.length})</h4>
          
          {reviews.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl text-gray-500">
              <p className="text-sm font-sans font-light">Be the first to leave a critique for this masterpiece.</p>
            </div>
          ) : (
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {reviews.map((rev) => (
                <div 
                  key={rev.id} 
                  id={`review-item-${rev.id}`}
                  className="border-b border-white/5 pb-6 space-y-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-sans font-medium text-white tracking-wide">{rev.userName}</h5>
                        {rev.verified && (
                          <span className="flex items-center gap-1 text-[9px] font-mono tracking-wider bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/20 uppercase">
                            <ShieldCheck className="w-3 h-3" /> Verified Owner
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono block mt-0.5">{rev.date}</span>
                    </div>

                    <div className="flex text-amber-500 gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star} 
                          className={`w-3.5 h-3.5 ${star <= rev.rating ? 'fill-amber-500' : 'text-gray-600'}`} 
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h6 className="text-xs font-mono text-white tracking-wide">{rev.title}</h6>
                    <p className="text-xs sm:text-sm text-gray-300 font-sans font-light leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>

                  {/* Review photos */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex gap-2">
                      {rev.images.map((img, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setLightboxImage(img)}
                          className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-black cursor-pointer"
                        >
                          <img src={img} alt="critique attachment" className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Lightbox Modal */}
                  {lightboxImage && (
                    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
                      <button className="absolute top-4 right-4 text-white p-2" onClick={() => setLightboxImage(null)}><X /></button>
                      <img src={lightboxImage} alt="Expanded" className="max-w-full max-h-full object-contain rounded-lg" />
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
                    <span>Was this helpful?</span>
                    <button 
                      onClick={() => handleLike(rev.id)}
                      className="flex items-center gap-1.5 text-amber-500 hover:text-amber-400 transition-colors focus:outline-none cursor-pointer"
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
    </div>
  );
}
