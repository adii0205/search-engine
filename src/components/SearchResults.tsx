import { useEffect, useState } from 'react';
import { Globe, ExternalLink, Loader, Play } from 'lucide-react';

interface SearchResult {
  id: number;
  title: string;
  url: string;
  fullUrl: string;
  description?: string;
  imageUrl?: string;
  thumbnail?: string;
  duration?: string;
  source?: string;
  date?: string;
}

interface SearchResultsProps {
  query: string;
  type: 'all' | 'images' | 'videos' | 'news';
}

export function SearchResults({ query, type }: SearchResultsProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const endpoint = type === 'all' ? '/api/search' : `/api/search/${type}`;
        const response = await fetch(`http://localhost:5000${endpoint}?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        
        const data = await response.json();
        setResults(data.results || []);
      } catch (err) {
        console.error('Search error:', err);
        setError('Unable to fetch search results. Please try again.');
        // Fallback to demo results
        setResults(getDemoResults(query, type));
      } finally {
        setLoading(false);
      }
    };

    if (query.trim()) {
      fetchResults();
    }
  }, [query, type]);

  function getDemoResults(searchQuery: string, resultType: string): SearchResult[] {
    // Image results
    if (resultType === 'images') {
      const imageUrls = [
        `https://picsum.photos/200/200?random=1`,
        `https://picsum.photos/200/200?random=2`,
        `https://picsum.photos/200/200?random=3`,
        `https://picsum.photos/200/200?random=4`,
        `https://picsum.photos/200/200?random=5`,
        `https://picsum.photos/200/200?random=6`,
        `https://picsum.photos/200/200?random=7`,
        `https://picsum.photos/200/200?random=8`,
      ];

      return imageUrls.map((url, index) => ({
        id: index + 1,
        title: `${searchQuery} - Image ${index + 1}`,
        url: 'images.google.com',
        fullUrl: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=isch`,
        imageUrl: url,
        description: `Image ${index + 1} related to ${searchQuery}`,
      }));
    }

    // Video results
    if (resultType === 'videos') {
      return [
        {
          id: 1,
          title: `${searchQuery} - Video 1`,
          url: 'youtube.com',
          fullUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
          description: `Watch video results for "${searchQuery}"`,
          duration: '12:34',
        },
        {
          id: 2,
          title: `${searchQuery} - Video 2`,
          url: 'youtube.com',
          fullUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
          description: `Video results for "${searchQuery}"`,
          duration: '8:45',
        },
        {
          id: 3,
          title: `${searchQuery} - Video 3`,
          url: 'youtube.com',
          fullUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
          description: `More video content about ${searchQuery}`,
          duration: '15:20',
        },
      ];
    }

    // News results
    if (resultType === 'news') {
      return [
        {
          id: 1,
          title: `Latest news about ${searchQuery}`,
          url: 'news.google.com',
          fullUrl: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=nws`,
          description: `Breaking news and latest updates about ${searchQuery}`,
          date: new Date().toISOString(),
          source: 'News Source',
        },
        {
          id: 2,
          title: `${searchQuery} news update`,
          url: 'bbc.com',
          fullUrl: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=nws`,
          description: `Recent developments in ${searchQuery}`,
          date: new Date(Date.now() - 86400000).toISOString(),
          source: 'BBC',
        },
      ];
    }

    // All results - web search
    if (searchQuery.toLowerCase().includes('donald trump')) {
      return [
        {
          id: 1,
          title: 'Donald Trump - Wikipedia',
          url: 'wikipedia.org',
          fullUrl: 'https://en.wikipedia.org/wiki/Donald_Trump',
          description: 'Donald John Trump is an American politician, media personality, and businessman who served as the 45th president of the United States from 2017 to 2021.',
        },
        {
          id: 2,
          title: 'Donald Trump - Latest News and Updates',
          url: 'bbc.com',
          fullUrl: 'https://www.bbc.com/news/world/us_canada',
          description: 'Get the latest news about Donald Trump, including his political activities, business ventures, and public statements.',
        },
        {
          id: 3,
          title: 'Trump Organization - Official Website',
          url: 'trump.com',
          fullUrl: 'https://www.trump.com/',
          description: 'The official website of Donald Trump featuring his latest news, statements, and information about Trump Organization.',
        },
        {
          id: 4,
          title: 'Donald Trump Presidential Campaign 2024',
          url: 'cnn.com',
          fullUrl: 'https://www.cnn.com/politics/donald-trump',
          description: 'Coverage of Donald Trump\'s 2024 presidential campaign including rallies, policy positions, and political analysis.',
        },
        {
          id: 5,
          title: 'Trump Indictments and Legal Cases',
          url: 'reuters.com',
          fullUrl: 'https://www.reuters.com/legal/',
          description: 'Comprehensive coverage of legal cases and indictments involving Donald Trump and related investigations.',
        },
      ];
    }
    return [
      {
        id: 1,
        title: 'Understanding Liquid Glass Design Patterns',
        url: 'www.designpatterns.com',
        fullUrl: 'https://www.designpatterns.com/liquid-glass',
        description: 'Explore the latest trends in liquid glass design, including glassmorphism, transparency effects, and modern UI aesthetics. Learn how to create stunning interfaces with depth and dimension.',
      },
      {
        id: 2,
        title: 'The Science Behind Glassmorphism',
        url: 'www.uxresearch.io',
        fullUrl: 'https://www.uxresearch.io/glassmorphism-science',
        description: 'A deep dive into the psychology and science of glassmorphism in user interfaces. Discover why users are drawn to frosted glass effects and how it enhances usability.',
      },
      {
        id: 3,
        title: 'Modern Search Engine Interfaces - Best Practices',
        url: 'www.webdev.com',
        fullUrl: 'https://www.webdev.com/search-interfaces',
        description: 'Best practices for designing modern search engine interfaces. Includes examples, code snippets, and design principles for creating intuitive search experiences.',
      },
    ];
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Searching for "{query}"...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-gray-400 text-sm mb-6">
        About {(Math.random() * 10000000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} results ({(Math.random() * 0.5).toFixed(2)} seconds)
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 text-red-200">
          {error}
        </div>
      )}

      {results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-2">No results found for "{query}"</p>
          <p className="text-gray-600 text-sm">Try a different search term</p>
        </div>
      ) : type === 'images' ? (
        // Image Grid Layout
        <div className="w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          {results.map((result, index) => (
            <div
              key={result.id}
              className="group relative overflow-hidden rounded-2xl cursor-pointer"
              onClick={() => window.open(result.fullUrl, '_blank')}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Outer glow on hover */}
              <div className="absolute -inset-1 bg-white/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500 z-10"></div>

              {/* Image Container */}
              <div className="relative overflow-hidden rounded-2xl bg-gray-900" style={{ aspectRatio: '1 / 1' }}>
                <img
                  src={result.imageUrl}
                  alt={result.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = `https://via.placeholder.com/200x200?text=${encodeURIComponent(result.title)}`;
                  }}
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end">
                  <div className="w-full p-3 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2">
                    {result.title}
                  </div>
                </div>

                {/* External link icon */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ExternalLink className="w-5 h-5 text-white bg-black/50 p-1.5 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : type === 'videos' ? (
        // Video Results Layout - Grid with Thumbnails
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {results.map((result, index) => (
            <div
              key={result.id}
              className="group relative overflow-hidden rounded-2xl cursor-pointer"
              onClick={() => window.open(result.fullUrl, '_blank')}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Outer glow on hover */}
              <div className="absolute -inset-1 bg-white/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500 z-10"></div>

              {/* Video Thumbnail Container */}
              <div className="relative overflow-hidden rounded-2xl bg-gray-900 aspect-video">
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = `https://via.placeholder.com/300x200?text=Video`;
                  }}
                />

                {/* Play button overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                  <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Play className="w-12 h-12 fill-white" />
                  </div>
                </div>

                {/* Duration badge */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {result.duration}
                </div>

                {/* External link icon */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ExternalLink className="w-5 h-5 text-white bg-black/50 p-1.5 rounded-full" />
                </div>
              </div>

              {/* Video Info */}
              <div className="p-3 bg-gradient-to-t from-black/60 to-transparent">
                <h3 className="text-white text-sm font-semibold line-clamp-2">{result.title}</h3>
                <p className="text-gray-400 text-xs mt-1">{result.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : type === 'videos_old' ? (
        // Video Results Layout
        <div className="space-y-6">
          {results.map((result, index) => (
            <div
              key={result.id}
              className="group relative"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => window.open(result.fullUrl, '_blank')}
            >
              {/* Outer glow on hover */}
              <div className="absolute -inset-1 bg-white/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>

              {/* Card content */}
              <div
                className="relative backdrop-blur-3xl rounded-3xl p-6 transition-all duration-300 border-t border-white/10 border-b border-white/5 group-hover:border-t-white/15 cursor-pointer"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 0 rgba(0, 0, 0, 0.4)'
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="relative bg-gray-900/50 rounded-lg p-4 flex-shrink-0">
                    <Play className="w-6 h-6 text-white" />
                    <div className="absolute bottom-1 right-1 text-xs text-white bg-black/60 px-1.5 py-0.5 rounded">
                      {result.duration}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-400 text-sm truncate mb-1">{result.url}</div>
                    <h2 className="text-white text-xl mb-2 transition-colors group-hover:text-blue-400">
                      {result.title}
                    </h2>
                    <p className="text-gray-400 leading-relaxed">
                      {result.description}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors flex-shrink-0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : type === 'news' ? (
        // News Results Layout
        <div className="space-y-6">
          {results.map((result, index) => (
            <div
              key={result.id}
              className="group relative"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => window.open(result.fullUrl, '_blank')}
            >
              {/* Outer glow on hover */}
              <div className="absolute -inset-1 bg-white/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>

              {/* Card content */}
              <div
                className="relative backdrop-blur-3xl rounded-3xl p-6 transition-all duration-300 border-t border-white/10 border-b border-white/5 group-hover:border-t-white/15 cursor-pointer"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 0 rgba(0, 0, 0, 0.4)'
                }}
              >
                <div className="flex items-start gap-3 mb-2">
                  <Globe className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-blue-400 mb-1">{result.source} • {result.date ? new Date(result.date).toLocaleDateString() : 'Just now'}</div>
                    <h2 className="text-white text-xl mb-2 transition-colors group-hover:text-blue-400">
                      {result.title}
                    </h2>
                    <p className="text-gray-400 leading-relaxed">
                      {result.description}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors flex-shrink-0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Default Web Results
        results.map((result, index) => (
          <div
            key={result.id}
            className="group relative"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Glass card with 3D effect */}
            <div className="relative">
              {/* Outer glow on hover */}
              <div className="absolute -inset-1 bg-white/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>

              {/* Card content with 3D glass effect */}
              <div
                className="relative backdrop-blur-3xl rounded-3xl p-6 transition-all duration-300 border-t border-white/10 border-b border-white/5 group-hover:border-t-white/15 cursor-pointer"
                onClick={() => window.open(result.fullUrl, '_blank')}
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 0 rgba(0, 0, 0, 0.4)'
                }}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <img 
                        src={`https://www.google.com/s2/favicons?sz=16&domain=${result.url}`}
                        alt="favicon"
                        className="w-4 h-4 rounded flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23666"/></svg>';
                        }}
                      />
                      <div className="text-gray-400 text-sm truncate">{result.url}</div>
                    </div>
                    <h2 className="text-white text-xl mb-2 transition-colors group-hover:text-blue-400">
                      {result.title}
                    </h2>
                    <p className="text-gray-400 leading-relaxed">
                      {result.description}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Pagination */}
      {results.length > 0 && (
        <div className="flex justify-center gap-3 pt-8">
          {[1, 2, 3, 4, 5].map((page) => (
            <button
              key={page}
              className={`w-12 h-12 rounded-full backdrop-blur-3xl border-t border-b transition-all duration-300 ${
                page === 1
                  ? 'border-t-white/20 border-b-white/10 text-white shadow-[0_4px_16px_0_rgba(255,255,255,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2),inset_0_-1px_0_0_rgba(0,0,0,0.5)]'
                  : 'border-t-white/10 border-b-white/5 text-gray-400 hover:text-white shadow-[0_4px_16px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08),inset_0_-1px_0_0_rgba(0,0,0,0.4)] hover:shadow-[0_6px_20px_0_rgba(255,255,255,0.2),inset_0_1px_0_0_rgba(255,255,255,0.12),inset_0_-1px_0_0_rgba(0,0,0,0.4)]'
              }`}
              style={page === 1 ? {
                background: 'linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)'
              } : {
                background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
              }}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
