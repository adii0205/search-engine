import { useState } from 'react';
import { Search, Sparkles, TrendingUp, Clock } from 'lucide-react';
import { SearchResults } from './components/SearchResults';
import { TrendingSearches } from './components/TrendingSearches';
import { ProductAd } from './components/ProductAd';

type SearchType = 'all' | 'images' | 'videos' | 'news';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setHasSearched(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 -left-20 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/3 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 py-6 border-b border-white/5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-white" />
              <span className="text-white text-lg font-semibold">GlassSearch</span>
            </div>
            
            {/* Search type tabs - shown only when searched */}
            {hasSearched && (
              <nav className="hidden md:flex gap-6">
                {(['all', 'images', 'videos', 'news'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSearchType(type)}
                    className={`capitalize px-3 py-2 rounded-lg transition-all duration-300 ${
                      searchType === type
                        ? 'text-white border-b-2 border-white'
                        : 'text-gray-400 hover:text-white border-b-2 border-transparent'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </nav>
            )}

            {/* Original nav links - shown when not searched */}
            {!hasSearched && (
              <nav className="hidden md:flex gap-6 text-gray-400">
                <a href="#" className="hover:text-white transition-colors">Images</a>
                <a href="#" className="hover:text-white transition-colors">Videos</a>
                <a href="#" className="hover:text-white transition-colors">News</a>
                <a href="#" className="hover:text-white transition-colors">More</a>
              </nav>
            )}
          </div>
        </header>

        {/* Search Section */}
        <main className={`px-6 transition-all duration-700 ${hasSearched ? 'pt-8' : 'pt-32'}`}>
          <div className={`max-w-4xl mx-auto transition-all duration-700 ${hasSearched ? '' : 'mt-20'}`}>
            {!hasSearched && (
              <div className="text-center mb-12 animate-fade-in">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Sparkles className="w-16 h-16 text-white" />
                </div>
                <h1 className="text-white text-5xl mb-2">GlassSearch</h1>
                <p className="text-gray-400">Search the liquid web</p>
              </div>
            )}

            {/* Search bar */}
            <form onSubmit={handleSearch} className="relative mb-8">
              <div className="relative group">
                {/* Outer glow effect */}
                <div className="absolute -inset-1 -top-2 bg-white/10 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition duration-500"></div>
                
                {/* Glass search bar with 3D effect */}
                <div className="relative flex items-center backdrop-blur-3xl rounded-full px-6 py-4 border-t border-white/10 border-b border-white/5"
                     style={{
                       background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                       boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 0 rgba(0, 0, 0, 0.5)'
                     }}>
                  <Search className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search anything..."
                    className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="submit"
                      className="ml-3 px-6 py-2 text-white rounded-full transition-all duration-300 hover:shadow-[0_6px_20px_0_rgba(255,255,255,0.3),inset_0_1px_0_0_rgba(255,255,255,0.3),inset_0_-1px_0_0_rgba(0,0,0,0.5)]"
                      style={{
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                        boxShadow: '0 4px 16px 0 rgba(255, 255, 255, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 0 rgba(0, 0, 0, 0.4)'
                      }}
                    >
                      Search
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* Results or Trending */}
            {hasSearched ? (
              <div className="relative">
                {/* Left Product Ad */}
                <ProductAd side="left" query={searchQuery} />
                
                {/* Search Results in middle */}
                <SearchResults query={searchQuery} type={searchType} />
                
                {/* Right Product Ad */}
                <ProductAd side="right" query={searchQuery} />
              </div>
            ) : (
              <TrendingSearches onSelectSearch={(query) => {
                setSearchQuery(query);
                setHasSearched(true);
              }} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
