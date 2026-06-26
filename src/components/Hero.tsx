import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Compass } from 'lucide-react';
import { EcommerceService } from '../lib/ecommerceService';
import { HeroSlide } from '../types';

export default function Hero({ onExploreClick }: { onExploreClick: () => void }) {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState<HeroSlide[]>([]);

  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    const data = await EcommerceService.getHeroSlides();
    const activeSlides = data.filter(s => s.isActive);
    if (activeSlides.length > 0) {
      setSlides(activeSlides);
    }
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides]);

  const handlePrev = () => {
    setCurrent(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrent(prev => (prev + 1) % slides.length);
  };

  if (slides.length === 0) return null;

  return (
    <div id="hero-slider" className="relative h-[420px] sm:h-[520px] md:h-[600px] lg:h-[80vh] xl:h-[85vh] w-full overflow-hidden bg-[#F8F5EF] shrink-0">
      {/* Background slide transitions */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            idx === current ? 'opacity-100 scale-100' : 'opacity-0 scale-102 pointer-events-none'
          }`}
        >
          {/* Light Overlay - Top to bottom for mobile vertical screens, left to right for desktop */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/30 md:bg-gradient-to-r md:from-white/40 md:via-white/10 md:to-transparent z-10" />
          <img 
            src={slide.image} 
            alt={slide.title} 
            className="w-full h-full object-cover object-center select-none" 
            referrerPolicy="no-referrer"
          />
        </div>
      ))}

      {/* Hero glass card content overlay */}
      <div className="absolute inset-0 md:inset-y-0 md:left-0 z-20 flex items-center justify-center md:justify-start px-4 sm:px-12 lg:px-24 max-w-full md:max-w-2xl lg:max-w-3xl">
        <div className="w-full max-w-md md:max-w-none bg-white/70 md:bg-white/50 backdrop-blur-md border border-[#E8E1D6] rounded-2xl sm:rounded-3xl p-5 sm:p-10 space-y-4 sm:space-y-6 text-left shadow-[0_10px_50px_rgba(0,0,0,0.05)] transform translate-y-0 md:translate-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#C9A227] uppercase tracking-widest font-bold">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>{slides[current].badge}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-sans tracking-tight text-[#1F1F1F] font-bold leading-[1.15]">
            {slides[current].title}
          </h1>

          <p className="text-xs sm:text-sm text-[#666666] font-sans font-medium leading-relaxed">
            {slides[current].description}
          </p>

          <div className="pt-2">
            <button
              onClick={onExploreClick}
              className="px-6 py-3 bg-[#C9A227] hover:bg-[#B68D1F] text-white text-xs font-mono tracking-widest uppercase rounded-xl font-bold transition-all hover:scale-103 cursor-pointer shadow-[0_10px_25px_rgba(201,162,39,0.2)] flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>{slides[current].buttonText}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation circles */}
      <div className="absolute bottom-6 right-6 z-20 flex gap-2 items-center">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all cursor-pointer ${
              current === i ? 'w-8 bg-[#C9A227]' : 'w-2 bg-[#1F1F1F]/20 hover:bg-[#1F1F1F]/40'
            }`}
          />
        ))}
      </div>

      {/* Side Slider controls */}
      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/70 border border-[#E8E1D6] text-[#666666] hover:text-[#1F1F1F] hover:border-[#C9A227]/40 cursor-pointer hidden md:block transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/70 border border-[#E8E1D6] text-[#666666] hover:text-[#1F1F1F] hover:border-[#C9A227]/40 cursor-pointer hidden md:block transition-all shadow-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
