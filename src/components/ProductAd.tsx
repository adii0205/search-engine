import { ShoppingBag, Loader } from "lucide-react";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  price: string;
  url?: string;
  source?: string;
  image?: string;
}

interface ProductAdProps {
  side: "left" | "right";
  query?: string;
}

export function ProductAd({ side, query }: ProductAdProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query?.trim()) {
      setProducts([]);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:5000/api/products?q=${encodeURIComponent(query)}`
        );
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query]);
  return (
    <div
      className={`fixed ${side === "left" ? "left-6" : "right-6"} top-40 w-64 hidden xl:block animate-fade-in`}
    >
      <div className="relative group">
        {/* Outer glow */}
        <div className="absolute -inset-1 bg-white/10 rounded-3xl blur-xl opacity-50"></div>

        {/* Glass container */}
        <div
          className="relative backdrop-blur-3xl rounded-3xl p-5 border-t border-white/10 border-b border-white/5"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
            boxShadow:
              "0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 0 rgba(0, 0, 0, 0.4)",
          }}
        >
          {/* Heading */}
          <div className="mb-4 pb-3 border-b border-white/10">
            <p className="text-white text-sm">
              Based on your search
            </p>
            <p className="text-gray-400 text-xs mt-1">
              You may like these products
            </p>
          </div>

          {/* Products */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader className="w-5 h-5 text-white animate-spin" />
              </div>
            ) : products.length > 0 ? (
              products.slice(0, 3).map((product, index) => (
                <button
                  key={product.id}
                  className="w-full group/item relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => product.url && window.open(product.url, '_blank')}
                >
                  <div className="absolute -inset-0.5 bg-white/10 rounded-2xl blur-lg opacity-0 group-hover/item:opacity-100 transition duration-300"></div>
                  <div
                    className="relative p-3 rounded-2xl backdrop-blur-2xl transition-all duration-300 border-t border-white/10 border-b border-white/5 group-hover/item:border-t-white/15 cursor-pointer"
                    style={{
                      background:
                        "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                      boxShadow:
                        "0 4px 16px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.06), inset 0 -1px 0 0 rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background:
                            "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
                          boxShadow:
                            "inset 0 1px 0 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 0 rgba(0, 0, 0, 0.3)",
                        }}
                      >
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-8 h-8 rounded object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                const icon = document.createElement('div');
                                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                svg.setAttribute('class', 'w-5 h-5 text-gray-400');
                                svg.innerHTML = '<path stroke="currentColor" stroke-width="2" d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z M3 6h18 M16 10a4 4 0 0 1-8 0"/>';
                                parent.appendChild(svg);
                              }
                            }}
                          />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-white text-sm group-hover/item:text-gray-200 transition-colors truncate">
                          {product.name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {product.price}
                        </p>
                        {product.source && (
                          <p className="text-gray-500 text-xs mt-0.5">
                            {product.source}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : query ? (
              <p className="text-gray-400 text-xs text-center py-4">
                No products found
              </p>
            ) : (
              <p className="text-gray-400 text-xs text-center py-4">
                Start searching to see products
              </p>
            )}
          </div>

          {/* View More */}
          {products.length > 3 && (
            <button
              className="w-full mt-4 px-4 py-2 text-white rounded-xl transition-all duration-300"
              style={{
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                boxShadow:
                  "0 4px 16px 0 rgba(255, 255, 255, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 0 rgba(0, 0, 0, 0.4)",
              }}
            >
              <span className="text-sm">View More ({products.length})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}