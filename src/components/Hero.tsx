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
    <div id="hero-slider" className="relative h-[420px] sm:h-[520px] md:h-[600px] lg:h-[80vh] xl:h-[85vh] w-full overflow-hidden bg-black shrink-0">
      {/* Background slide transitions */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            idx === current ? 'opacity-100 scale-100' : 'opacity-0 scale-102 pointer-events-none'
          }`}
        >
          {/* Dark Overlay - Top to bottom for mobile vertical screens, left to right for desktop */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/75 md:bg-gradient-to-r md:from-black/85 md:via-black/35 md:to-transparent z-10" />
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
        <div className="w-full max-w-md md:max-w-none bg-black/60 md:bg-black/40 backdrop-blur-none sm:backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-10 space-y-4 sm:space-y-6 text-left shadow-[0_0_50px_rgba(0,0,0,0.5)] transform translate-y-0 md:translate-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>{slides[current].badge}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-sans tracking-tight text-white font-bold leading-[1.15]">
            {slides[current].title}
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 font-sans font-light leading-relaxed">
            {slides[current].description}
          </p>

          <div className="pt-2">
            <button
              onClick={onExploreClick}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono tracking-widest uppercase rounded-xl font-bold transition-all hover:scale-103 cursor-pointer shadow-[0_4px_25px_rgba(245,158,11,0.3)] flex items-center gap-2"
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
              current === i ? 'w-8 bg-amber-500' : 'w-2 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* Side Slider controls */}
      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/50 border border-white/10 text-gray-400 hover:text-white hover:border-amber-500/20 cursor-pointer hidden md:block"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/50 border border-white/10 text-gray-400 hover:text-white hover:border-amber-500/20 cursor-pointer hidden md:block"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
