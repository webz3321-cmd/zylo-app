import { Search, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';

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
}

const DEFAULT_CATEGORIES = ["All", "Timepieces", "Fragrances", "Leather Goods", "Accessories"];

export default function Filters({
  searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, sortBy, setSortBy, maxPrice, setMaxPrice, inStockOnly, setInStockOnly, categories
}: FiltersProps) {
  const listToUse = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <div id="filter-panel-wrapper" className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md space-y-6">
      {/* Search and Category block */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search our master private vaults..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Categories list */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {listToUse.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all cursor-pointer whitespace-nowrap uppercase ${
                selectedCategory === cat 
                  ? 'bg-amber-500 border border-amber-400 text-black font-semibold' 
                  : 'bg-white/5 border border-white/5 text-gray-300 hover:border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced filters line */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5 items-center">
        {/* Price Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-gray-400">
            <span>Maximum Price:</span>
            <span className="text-white font-bold">${maxPrice}</span>
          </div>
          <input
            type="range"
            min={100}
            max={6000}
            step={50}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-amber-500 border border-white/5"
          />
        </div>

        {/* Sort Select */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Sort Ateliers</label>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50 appearance-none font-mono"
            >
              <option value="featured">⚜️ Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Reviews: Highest Rating</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Stock status toggle */}
        <div className="flex items-center justify-end h-full">
          <button
            type="button"
            onClick={() => setInStockOnly(!inStockOnly)}
            className="flex items-center gap-3 bg-black/30 hover:bg-black/50 border border-white/10 rounded-xl px-4 py-3 cursor-pointer text-xs transition-colors w-full md:w-auto"
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
              inStockOnly ? 'bg-amber-500 border-amber-400 text-black' : 'border-white/20'
            }`}>
              {inStockOnly && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
            </div>
            <span className="font-mono text-gray-300 uppercase tracking-wider">In Vault / In Stock Only</span>
          </button>
        </div>
      </div>
    </div>
  );
}
