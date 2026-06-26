import { Search, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  maxPrice: number;
  setMaxPrice: (p: number) => void;
  inStockOnly: boolean;
  setInStockOnly: (b: boolean) => void;
  categories?: string[];
  onFilterEnd?: () => void;
}

const DEFAULT_CATEGORIES = ["All", "Timepieces", "Fragrances", "Leather Goods", "Accessories"];

export default function Filters({
  searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, sortBy, setSortBy, maxPrice, setMaxPrice, inStockOnly, setInStockOnly, categories, onFilterEnd
}: FiltersProps) {
  const listToUse = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  
  const [localSearch, setLocalSearch] = useState(searchQuery);
  
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = () => {
    setSearchQuery(localSearch);
    onFilterEnd?.();
  };

  return (
    <div id="filter-panel-wrapper" className="bg-white border border-[#E8E1D6] rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Search and Category block */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search input */}
        <div className="flex w-full md:max-w-md gap-2">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
            <input
              type="text"
              placeholder="Search our master private vaults..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit();
              }}
              className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#1F1F1F] placeholder-gray-400 focus:outline-none focus:border-[#C9A227]/50"
            />
          </div>
          <button 
            onClick={handleSearchSubmit}
            className="px-4 py-2.5 bg-[#C9A227] hover:bg-[#B68D1F] text-white text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-bold cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
          >
            Search
          </button>
        </div>

        {/* Categories list */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {listToUse.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                onFilterEnd?.();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all cursor-pointer whitespace-nowrap uppercase border ${
                selectedCategory === cat 
                  ? 'bg-[#C9A227] border-[#C9A227] text-white font-semibold shadow-sm' 
                  : 'bg-[#F8F5EF] border-[#E8E1D6] text-[#666666] hover:border-[#C9A227]/40 hover:text-[#1F1F1F]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced filters line */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#E8E1D6] items-center">
        {/* Price Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-[#666666]">
            <span>Maximum Price:</span>
            <span className="text-[#1F1F1F] font-bold">${maxPrice}</span>
          </div>
          <input
            type="range"
            min={100}
            max={6000}
            step={50}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            onPointerUp={() => onFilterEnd?.()}
            className="w-full h-1 bg-[#F8F5EF] rounded-lg appearance-none cursor-pointer accent-[#C9A227] border border-[#E8E1D6]"
          />
        </div>

        {/* Sort Select */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-[#666666] uppercase tracking-widest block font-bold">Sort Ateliers</label>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2 text-xs sm:text-sm text-[#1F1F1F] focus:outline-none focus:border-[#C9A227]/50 appearance-none font-mono"
            >
              <option value="featured">⚜️ Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Reviews: Highest Rating</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />
          </div>
        </div>

        {/* Stock status toggle */}
        <div className="flex items-center justify-end h-full">
          <button
            type="button"
            onClick={() => setInStockOnly(!inStockOnly)}
            className="flex items-center gap-3 bg-[#F8F5EF] hover:bg-white border border-[#E8E1D6] rounded-xl px-4 py-3 cursor-pointer text-xs transition-colors w-full md:w-auto group"
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
              inStockOnly ? 'bg-[#C9A227] border-[#C9A227] text-white' : 'border-gray-300 group-hover:border-[#C9A227]/50'
            }`}>
              {inStockOnly && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
            </div>
            <span className="font-mono text-[#666666] uppercase tracking-wider font-bold">In Vault / In Stock Only</span>
          </button>
        </div>
      </div>
    </div>
  );
}
