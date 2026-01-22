import { TrendingUp, Clock, Sparkles } from 'lucide-react';

interface TrendingSearchesProps {
  onSelectSearch: (query: string) => void;
}

const trendingTopics = [
  { id: 1, query: 'AI and Machine Learning', trend: '+245%', icon: Sparkles },
  { id: 2, query: 'Web3 Development', trend: '+189%', icon: TrendingUp },
  { id: 3, query: 'Quantum Computing', trend: '+156%', icon: Sparkles },
  { id: 4, query: 'Sustainable Technology', trend: '+134%', icon: TrendingUp },
];

const recentSearches = [
  'Liquid glass design',
  'Glassmorphism tutorial',
  'Dark mode best practices',
  'Modern UI trends 2024',
];

export function TrendingSearches({ onSelectSearch }: TrendingSearchesProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
      {/* Trending Searches */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-white/10 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition duration-500"></div>
        <div className="relative backdrop-blur-3xl rounded-3xl p-6 border-t border-white/10 border-b border-white/5"
             style={{
               background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
               boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 0 rgba(0, 0, 0, 0.4)'
             }}>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-white" />
            <h3 className="text-white">Trending Now</h3>
          </div>
          <div className="space-y-3">
            {trendingTopics.map((topic, index) => {
              const Icon = topic.icon;
              return (
                <button
                  key={topic.id}
                  onClick={() => onSelectSearch(topic.query)}
                  className="w-full group/item relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute -inset-0.5 bg-white/10 rounded-2xl blur-lg opacity-0 group-hover/item:opacity-100 transition duration-300"></div>
                  <div className="relative flex items-center justify-between p-4 rounded-2xl backdrop-blur-2xl transition-all duration-300 border-t border-white/10 border-b border-white/5 group-hover/item:border-t-white/15"
                       style={{
                         background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                         boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.06), inset 0 -1px 0 0 rgba(0, 0, 0, 0.3)'
                       }}>
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-white" />
                      <span className="text-gray-300 group-hover/item:text-white transition-colors">
                        {topic.query}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm">{topic.trend}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Searches */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-white/10 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition duration-500"></div>
        <div className="relative backdrop-blur-3xl rounded-3xl p-6 border-t border-white/10 border-b border-white/5"
             style={{
               background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
               boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 0 rgba(0, 0, 0, 0.4)'
             }}>
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-white" />
            <h3 className="text-white">Recent Searches</h3>
          </div>
          <div className="space-y-3">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => onSelectSearch(search)}
                className="w-full group/item relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute -inset-0.5 bg-white/10 rounded-2xl blur-lg opacity-0 group-hover/item:opacity-100 transition duration-300"></div>
                <div className="relative flex items-center gap-3 p-4 rounded-2xl backdrop-blur-2xl transition-all duration-300 border-t border-white/10 border-b border-white/5 group-hover/item:border-t-white/15"
                     style={{
                       background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                       boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.06), inset 0 -1px 0 0 rgba(0, 0, 0, 0.3)'
                     }}>
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 group-hover/item:text-white transition-colors">
                    {search}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
