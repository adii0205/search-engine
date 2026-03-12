const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const { 
  initializeIndex, 
  indexResults, 
  searchElasticsearch, 
  getIndexStats, 
  clearIndex,
  checkHealth 
} = require('./elasticsearch-service');

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Elasticsearch on startup (non-blocking)
(async () => {
  try {
    const isHealthy = await checkHealth();
    if (isHealthy) {
      await initializeIndex();
      console.log('✅ Elasticsearch initialized successfully');
    } else {
      console.log('⚠️  Elasticsearch not available - using web scraping only');
    }
  } catch (error) {
    console.log('⚠️  Elasticsearch initialization skipped - will use web scraping');
  }
})();

// Function to search using multiple strategies
async function searchInternet(query, resultType = 'all') {
  try {
    // Try different search approaches
    let results = [];

    // Strategy 1: Try SerpAPI (free tier)
    if (process.env.SERPAPI_KEY) {
      results = await searchWithSerpAPI(query);
    }

    // Strategy 2: Try improved web scraping
    if (results.length === 0) {
      results = await scrapeGoogleWithImprovedParsing(query);
    }

    // Strategy 3: If Google fails, try DuckDuckGo with better parsing
    if (results.length === 0) {
      results = await scrapeDuckDuckGoAdvanced(query);
    }

    // Strategy 4: If both fail, try Bing
    if (results.length === 0) {
      results = await scrapeBingAdvanced(query);
    }

    // Strategy 5: Search Bing API endpoint
    if (results.length === 0) {
      results = await searchBingJSON(query);
    }

    return results.slice(0, 10);
  } catch (error) {
    console.error('Search error:', error.message);
    return [];
  }
}

// Search using Bing JSON API (more reliable)
async function searchBingJSON(query) {
  try {
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&format=json`;
    
    const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
      params: { q: query, textDecorations: true },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    }).catch(err => ({ status: 0 })); // Fallback if API not available

    if (response.status !== 200) {
      return [];
    }

    const results = [];
    const webPages = response.data?.webPages?.value || [];
    
    webPages.slice(0, 10).forEach((page, index) => {
      try {
        results.push({
          id: index + 1,
          title: page.name?.substring(0, 100) || '',
          url: new URL(page.url).hostname,
          fullUrl: page.url,
          description: page.snippet?.substring(0, 160) || ''
        });
      } catch (e) {
        // Skip invalid entries
      }
    });

    return results;
  } catch (error) {
    console.error('Bing API error:', error.message);
    return [];
  }
}

// Advanced DuckDuckGo scraping with multiple fallback selectors
async function scrapeDuckDuckGoAdvanced(query) {
  try {
    const searchUrl = `https://duckduckgo.com/search?q=${encodeURIComponent(query)}&l=en_IN`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000,
      decompress: true
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // Try multiple selectors that DuckDuckGo might use
    const selectors = [
      'a[data-testid="result-title-a"]',
      'a.result__a',
      'h2 + p + a',
      'div.result > a:first-child'
    ];

    for (const selector of selectors) {
      $(selector).each((index, element) => {
        if (results.length >= 10) return;

        try {
          const $el = $(element);
          const title = $el.text().trim();
          const fullUrl = $el.attr('href');
          
          if (!fullUrl || !title) return;

          const description = $el.closest('article, div')?.find('[data-testid="result-snippet"], .result__snippet').text() || '';

          if (title && fullUrl && !fullUrl.includes('duckduckgo.com')) {
            try {
              const url = new URL(fullUrl).hostname;
              results.push({
                id: results.length + 1,
                title: title.substring(0, 100),
                url: url || 'website.com',
                fullUrl: fullUrl,
                description: description.substring(0, 160) || 'Visit this page for more information',
              });
            } catch (e) {
              // Invalid URL
            }
          }
        } catch (err) {
          // Continue to next element
        }
      });

      if (results.length > 0) break; // Found results with this selector
    }

    if (results.length > 0) {
      console.log(`✅ DuckDuckGo scraping successful: ${results.length} results`);
    }
    return results;
  } catch (error) {
    console.error('DuckDuckGo scraping error:', error.message);
    return [];
  }
}

// Advanced Bing scraping with multiple fallback selectors
async function scrapeBingAdvanced(query) {
  try {
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&mkt=en-IN`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000,
      decompress: true
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // Try multiple Bing selectors
    const selectors = [
      'li.b_algo',
      'div.b_algo',
      'div[class*="result"]',
      'ol#b_results li'
    ];

    for (const selector of selectors) {
      $(selector).each((index, element) => {
        if (results.length >= 10) return;

        try {
          const $el = $(element);
          
          // Try different title selectors
          let titleEl = $el.find('h2 a').first();
          if (!titleEl.length) titleEl = $el.find('a[target="_blank"]').first();
          if (!titleEl.length) titleEl = $el.find('a').first();
          
          const title = titleEl.text().trim();
          const fullUrl = titleEl.attr('href');
          
          if (!fullUrl || !title) return;

          const description = $el.find('p').first().text().trim();

          if (title && fullUrl && !fullUrl.includes('bing.com')) {
            try {
              const url = new URL(fullUrl).hostname;
              results.push({
                id: results.length + 1,
                title: title.substring(0, 100),
                url: url || 'website.com',
                fullUrl: fullUrl,
                description: description.substring(0, 160),
              });
            } catch (e) {
              // Invalid URL
            }
          }
        } catch (err) {
          // Continue to next element
        }
      });

      if (results.length > 0) break; // Found results with this selector
    }

    if (results.length > 0) {
      console.log(`✅ Bing scraping successful: ${results.length} results`);
    }
    return results;
  } catch (error) {
    console.error('Bing scraping error:', error.message);
    return [];
  }
}

// SerpAPI integration (if API key is provided)
async function searchWithSerpAPI(query) {
  try {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) return [];

    const response = await axios.get('https://serpapi.com/search', {
      params: {
        q: query,
        api_key: apiKey,
        engine: 'google',
        num: 10
      },
      timeout: 10000
    });

    const results = [];
    const organicResults = response.data?.organic_results || [];

    organicResults.forEach((result, index) => {
      try {
        results.push({
          id: index + 1,
          title: result.title?.substring(0, 100) || '',
          url: new URL(result.link).hostname,
          fullUrl: result.link,
          description: result.snippet?.substring(0, 160) || ''
        });
      } catch (e) {
        // Skip invalid entries
      }
    });

    if (results.length > 0) {
      console.log(`✅ SerpAPI search successful: ${results.length} results`);
    }
    return results;
  } catch (error) {
    console.error('SerpAPI error:', error.message);
    return [];
  }
}

// Improved Google scraping with better selectors and User-Agent handling
async function scrapeGoogleWithImprovedParsing(query) {
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&num=10`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 15000,
      decompress: true
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // Modern Google selectors
    const selectors = [
      'div.g',
      'div[data-sokoban-container]',
      'div.Gvuyqf',
      'div[class*="result"]',
      'div#search > div > div'
    ];

    for (const selector of selectors) {
      $(selector).each((index, element) => {
        if (results.length >= 10) return;

        try {
          const $el = $(element);

          // Extract title - try multiple selectors
          let titleEl = $el.find('h3').first();
          let title = titleEl.text().trim();

          if (!title) {
            titleEl = $el.find('span[role="heading"]').first();
            title = titleEl.text().trim();
          }

          if (!title) return; // Skip if no title found

          // Extract URL
          let fullUrl = '';
          let linkEl = $el.find('a[href^="http"]').first();
          let href = linkEl.attr('href');

          if (href && !href.includes('google.com')) {
            fullUrl = href;
          } else {
            // Try to extract from onclick or data attributes
            linkEl = $el.find('a').first();
            const dataUrl = linkEl.attr('data-url') || linkEl.attr('href') || '';
            
            if (dataUrl.includes('/url?q=')) {
              fullUrl = decodeURIComponent(dataUrl.split('/url?q=')[1]?.split('&')[0] || '');
            } else if (dataUrl.startsWith('http')) {
              fullUrl = dataUrl;
            }
          }

          if (!fullUrl || fullUrl.includes('google.com')) return;

          // Extract description
          let description = '';
          const descSelectors = [
            'span.sCKkdd',
            'div.VwiC3b',
            'div[data-content-feature="1"]',
            'div > span:contains("...")',
            'p'
          ];

          for (const descSel of descSelectors) {
            const descEl = $el.find(descSel).first();
            description = descEl.text().trim();
            if (description && description.length > 10) break;
          }

          if (!description) {
            description = 'Visit this page for more information';
          }

          // Extract URL domain
          let url = '';
          try {
            if (fullUrl) {
              url = new URL(fullUrl).hostname;
            }
          } catch (e) {
            url = fullUrl?.split('/')[2] || '';
          }

          if (title && fullUrl && url) {
            results.push({
              id: results.length + 1,
              title: title.substring(0, 100),
              url: url || 'website.com',
              fullUrl: fullUrl,
              description: description.substring(0, 160),
            });
          }
        } catch (err) {
          console.log('Error parsing Google element:', err.message);
        }
      });

      if (results.length > 0) break; // Found results with this selector
    }

    if (results.length > 0) {
      console.log(`✅ Google scraping successful: ${results.length} results`);
    }
    return results;
  } catch (error) {
    console.error('Google scraping error:', error.message);
    return [];
  }
}

// API endpoint for general search
app.get('/api/search', async (req, res) => {
  const { q, type = 'all' } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  try {
    // Try Elasticsearch first
    let results = await searchElasticsearch(q, type, 10);

    // If Elasticsearch is empty or fails, scrape web and index results
    if (results.length === 0) {
      const scrapedResults = await searchInternet(q, type);
      
      // Index the scraped results for future queries
      if (scrapedResults.length > 0) {
        await indexResults(scrapedResults, type);
      }
      
      results = scrapedResults;
    }

    if (results.length === 0) {
      // Return demo results as last resort
      return res.json({
        query: q,
        type: type,
        results: generateDemoResults(q),
        count: 0,
        source: 'demo'
      });
    }

    res.json({
      query: q,
      type: type,
      results: results,
      count: results.length,
      source: results[0].score ? 'elasticsearch' : 'web'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      query: q,
      results: generateDemoResults(q),
      error: 'Using fallback results'
    });
  }
});

// Image search endpoint - scrape Google Images
app.get('/api/search/images', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  try {
    const results = await scrapeGoogleImages(q);
    
    if (results.length === 0) {
      // Fallback to demo images
      return res.json({ 
        query: q, 
        results: generateDemoImages(q)
      });
    }

    res.json({ query: q, results });
  } catch (error) {
    console.error('Image search error:', error.message);
    res.json({ 
      query: q, 
      results: generateDemoImages(q),
      error: 'Using demo images'
    });
  }
});

// Scrape Google Images
async function scrapeGoogleImages(query) {
  try {
    const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&mkt=en-IN`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('img[data-src]').each((index, element) => {
      if (results.length >= 8) return;

      const $img = $(element);
      const src = $img.attr('data-src') || $img.attr('src');
      const alt = $img.attr('alt') || 'Image';

      if (src && src.startsWith('http')) {
        results.push({
          id: results.length + 1,
          title: alt.substring(0, 50),
          url: 'bing.com/images',
          fullUrl: `https://www.google.co.in/search?q=${encodeURIComponent(query)}&tbm=isch&hl=en&gl=IN`,
          imageUrl: src,
          description: alt
        });
      }
    });

    return results;
  } catch (error) {
    console.error('Bing image scrape error:', error.message);
    return [];
  }
}

// Demo images function
function generateDemoImages(query) {
  const demoImages = [
    `https://picsum.photos/200/200?random=${Math.random()}`,
    `https://picsum.photos/200/200?random=${Math.random()}`,
    `https://picsum.photos/200/200?random=${Math.random()}`,
    `https://picsum.photos/200/200?random=${Math.random()}`,
    `https://picsum.photos/200/200?random=${Math.random()}`,
    `https://picsum.photos/200/200?random=${Math.random()}`,
    `https://picsum.photos/200/200?random=${Math.random()}`,
    `https://picsum.photos/200/200?random=${Math.random()}`
  ];

  return demoImages.map((url, index) => ({
    id: index + 1,
    title: `${query} - Image ${index + 1}`,
    url: 'images.google.com',
    fullUrl: `https://www.google.co.in/search?q=${encodeURIComponent(query)}&tbm=isch&hl=en&gl=IN`,
    imageUrl: url,
    description: `Related image for ${query}`
  }));
}

// Video search endpoint
app.get('/api/search/videos', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  try {
    const results = generateDemoVideos(q);
    res.json({ query: q, results });
  } catch (error) {
    console.error('Video search error:', error.message);
    res.json({ query: q, results: generateDemoVideos(q) });
  }
});

// Generate demo videos
function generateDemoVideos(query) {
  const videos = [
    {
      id: 1,
      title: `${query} - Official Video`,
      url: 'youtube.com',
      fullUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=en`,
      description: `Watch official videos about ${query}`,
      duration: '12:34',
      thumbnail: 'https://picsum.photos/300/200?random=1'
    },
    {
      id: 2,
      title: `${query} - Tutorial`,
      url: 'youtube.com',
      fullUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      description: `Learn about ${query} with this tutorial`,
      duration: '25:15',
      thumbnail: 'https://picsum.photos/300/200?random=2'
    },
    {
      id: 3,
      title: `${query} - Latest`,
      url: 'youtube.com',
      fullUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      description: `Latest videos featuring ${query}`,
      duration: '8:45',
      thumbnail: 'https://picsum.photos/300/200?random=3'
    },
    {
      id: 4,
      title: `${query} - Deep Dive`,
      url: 'youtube.com',
      fullUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      description: `In-depth exploration of ${query}`,
      duration: '32:10',
      thumbnail: 'https://picsum.photos/300/200?random=4'
    }
  ];

  return videos;
}

// News search endpoint
app.get('/api/search/news', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  try {
    const results = generateDemoNews(q);
    res.json({ query: q, results });
  } catch (error) {
    console.error('News search error:', error.message);
    res.json({ query: q, results: generateDemoNews(q) });
  }
});

// Generate demo news
function generateDemoNews(query) {
  const newsItems = [
    {
      id: 1,
      title: `${query} - Breaking: Latest developments in ${query}`,
      url: 'bbc.com',
      fullUrl: `https://www.google.co.in/search?q=${encodeURIComponent(query)}&tbm=nws&hl=en&gl=IN`,
      description: `Breaking news and latest updates about ${query}. Stay informed with real-time coverage.`,
      date: new Date().toISOString(),
      source: 'BBC News',
    },
    {
      id: 2,
      title: `${query} in focus: What you need to know`,
      url: 'reuters.com',
      fullUrl: `https://www.google.co.in/search?q=${encodeURIComponent(query)}&tbm=nws&hl=en&gl=IN`,
      description: `Comprehensive analysis of recent events related to ${query}.`,
      date: new Date(Date.now() - 3600000).toISOString(),
      source: 'Reuters',
    },
    {
      id: 3,
      title: `${query} News Roundup`,
      url: 'cnn.com',
      fullUrl: `https://www.google.co.in/search?q=${encodeURIComponent(query)}&tbm=nws&hl=en&gl=IN`,
      description: `Top stories and developments about ${query} this week.`,
      date: new Date(Date.now() - 86400000).toISOString(),
      source: 'CNN',
    },
    {
      id: 4,
      title: `Analysis: ${query} trends and insights`,
      url: 'theguardian.com',
      fullUrl: `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=nws`,
      description: `Expert analysis and insights on the latest ${query} developments.`,
      date: new Date(Date.now() - 172800000).toISOString(),
      source: 'The Guardian',
    }
  ];

  return newsItems;
}

// Helper function to generate demo results
function generateDemoResults(query) {
  return [
    {
      id: 1,
      title: `About ${query}`,
      url: 'en.wikipedia.org',
      fullUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
      description: `Learn more about ${query} on Wikipedia. Get comprehensive information and reliable sources.`,
    },
    {
      id: 2,
      title: `${query} - Latest Information`,
      url: 'www.example.com',
      fullUrl: 'https://www.example.com',
      description: `Stay updated with the latest information and news about ${query} from various sources.`,
    },
    {
      id: 3,
      title: `${query} Guide`,
      url: 'www.guide.com',
      fullUrl: 'https://www.guide.com',
      description: `Complete guide about ${query}. Find detailed information, tips, and resources.`,
    },
  ];
}

// ============================================
// ELASTICSEARCH ADMIN ENDPOINTS
// ============================================

// Get Elasticsearch index statistics
app.get('/api/elasticsearch/stats', async (req, res) => {
  try {
    const count = await getIndexStats();
    res.json({
      status: 'success',
      indexedDocuments: count,
      message: `Total indexed documents: ${count}`
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Check Elasticsearch health
app.get('/api/elasticsearch/health', async (req, res) => {
  try {
    const isHealthy = await checkHealth();
    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      connected: isHealthy,
      message: isHealthy ? 'Elasticsearch is running and healthy' : 'Elasticsearch connection failed'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Clear all indexed data
app.post('/api/elasticsearch/clear', async (req, res) => {
  try {
    await clearIndex();
    res.json({
      status: 'success',
      message: 'All indexed data cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ============================================
// PRODUCT SEARCH ENDPOINTS
// ============================================

// Product search endpoint - searches Amazon, eBay, and other ecommerce platforms
app.get('/api/products', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  try {
    const products = await searchProducts(q);
    res.json({
      query: q,
      products: products,
      count: products.length
    });
  } catch (error) {
    console.error('Product search error:', error.message);
    res.json({
      query: q,
      products: generateDemoProducts(q),
      error: 'Using demo products'
    });
  }
});

// Search for products from multiple sources
async function searchProducts(query) {
  try {
    let products = [];

    // Strategy 1: Try scraping Amazon
    if (products.length === 0) {
      products = await scrapeAmazonProducts(query);
    }

    // Strategy 2: Try scraping eBay
    if (products.length === 0) {
      products = await scrapeEbayProducts(query);
    }

    // Strategy 3: Try WalMart
    if (products.length === 0) {
      products = await scrapeWalmartProducts(query);
    }

    // Strategy 4: Fallback to generated demo products
    if (products.length === 0) {
      products = generateDemoProducts(query);
    }

    return products.slice(0, 10);
  } catch (error) {
    console.error('Product search error:', error.message);
    return generateDemoProducts(query);
  }
}

// Scrape Amazon products
async function scrapeAmazonProducts(query) {
  try {
    const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const products = [];

    $('[data-component-type="s-search-result"]').each((index, element) => {
      if (products.length >= 5) return;

      try {
        const $el = $(element);
        const name = $el.find('h2 a span').text().trim();
        const price = $el.find('.a-price-whole').text().trim();
        const link = $el.find('h2 a').attr('href');
        const image = $el.find('img').attr('src');

        if (name && price) {
          products.push({
            id: `amazon-${products.length + 1}`,
            name: name.substring(0, 100),
            price: price || 'Check price',
            source: 'Amazon',
            url: link ? `https://www.amazon.com${link}` : 'https://www.amazon.com',
            image: image || undefined
          });
        }
      } catch (err) {
        // Continue to next product
      }
    });

    if (products.length > 0) {
      console.log(`✅ Amazon products found: ${products.length}`);
    }
    return products;
  } catch (error) {
    console.error('Amazon scraping error:', error.message);
    return [];
  }
}

// Scrape eBay products
async function scrapeEbayProducts(query) {
  try {
    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const products = [];

    $('.s-item').each((index, element) => {
      if (products.length >= 5) return;

      try {
        const $el = $(element);
        const name = $el.find('.s-item__title').text().trim();
        const price = $el.find('.s-item__price').text().trim();
        const link = $el.find('.s-item__link').attr('href');

        if (name && price) {
          products.push({
            id: `ebay-${products.length + 1}`,
            name: name.substring(0, 100),
            price: price || 'Check price',
            source: 'eBay',
            url: link || 'https://www.ebay.com'
          });
        }
      } catch (err) {
        // Continue to next product
      }
    });

    if (products.length > 0) {
      console.log(`✅ eBay products found: ${products.length}`);
    }
    return products;
  } catch (error) {
    console.error('eBay scraping error:', error.message);
    return [];
  }
}

// Scrape Walmart products
async function scrapeWalmartProducts(query) {
  try {
    const searchUrl = `https://www.walmart.com/search?q=${encodeURIComponent(query)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const products = [];

    $('[data-item-index]').each((index, element) => {
      if (products.length >= 5) return;

      try {
        const $el = $(element);
        const name = $el.find('[data-testid="productTitle"]').text().trim();
        const price = $el.find('[data-testid="productPrice"]').text().trim();
        const link = $el.find('a[href*="/ip/"]').attr('href');

        if (name && price) {
          products.push({
            id: `walmart-${products.length + 1}`,
            name: name.substring(0, 100),
            price: price || 'Check price',
            source: 'Walmart',
            url: link ? `https://www.walmart.com${link}` : 'https://www.walmart.com'
          });
        }
      } catch (err) {
        // Continue to next product
      }
    });

    if (products.length > 0) {
      console.log(`✅ Walmart products found: ${products.length}`);
    }
    return products;
  } catch (error) {
    console.error('Walmart scraping error:', error.message);
    return [];
  }
}

// Generate demo products based on query
function generateDemoProducts(query) {
  const categories = {
    'phone': [
      { name: 'Latest Smartphone', price: '$599', source: 'Amazon', url: 'https://www.amazon.com/s?k=phone' },
      { name: 'Refurbished Phone', price: '$399', source: 'eBay', url: 'https://www.ebay.com/sch/i.html?_nkw=phone' },
      { name: 'Phone Protective Case', price: '$29', source: 'Walmart', url: 'https://www.walmart.com/search?q=phone' }
    ],
    'laptop': [
      { name: 'Gaming Laptop', price: '$1,299', source: 'Amazon', url: 'https://www.amazon.com/s?k=laptop' },
      { name: 'Budget Laptop', price: '$499', source: 'Walmart', url: 'https://www.walmart.com/search?q=laptop' },
      { name: 'Professional Laptop', price: '$999', source: 'eBay', url: 'https://www.ebay.com/sch/i.html?_nkw=laptop' }
    ],
    'headphones': [
      { name: 'Wireless Headphones', price: '$79', source: 'Amazon', url: 'https://www.amazon.com/s?k=headphones' },
      { name: 'Premium Noise-Cancelling', price: '$349', source: 'Best Buy', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=headphones' },
      { name: 'Gaming Headset', price: '$149', source: 'eBay', url: 'https://www.ebay.com/sch/i.html?_nkw=headphones' }
    ],
    'watch': [
      { name: 'Smart Watch', price: '$199', source: 'Amazon', url: 'https://www.amazon.com/s?k=watch' },
      { name: 'Fitness Tracker', price: '$99', source: 'Walmart', url: 'https://www.walmart.com/search?q=watch' },
      { name: 'Luxury Watch', price: '$2,999', source: 'eBay', url: 'https://www.ebay.com/sch/i.html?_nkw=watch' }
    ],
    'shoes': [
      { name: 'Athletic Shoes', price: '$89', source: 'Amazon', url: 'https://www.amazon.com/s?k=shoes' },
      { name: 'Designer Shoes', price: '$249', source: 'eBay', url: 'https://www.ebay.com/sch/i.html?_nkw=shoes' },
      { name: 'Casual Shoes', price: '$49', source: 'Walmart', url: 'https://www.walmart.com/search?q=shoes' }
    ]
  };

  const queryLower = query.toLowerCase();
  let products = [];
  let matchedSource = 'Amazon';

  // Try to match query to category
  for (const [category, items] of Object.entries(categories)) {
    if (queryLower.includes(category)) {
      products = items;
      break;
    }
  }

  // If no match, use generic products with proper ecommerce links
  if (products.length === 0) {
    products = [
      { 
        name: `Premium ${query}`, 
        price: '$299', 
        source: 'Amazon',
        url: `https://www.amazon.com/s?k=${encodeURIComponent(query)}`
      },
      { 
        name: `Budget ${query}`, 
        price: '$99', 
        source: 'Walmart',
        url: `https://www.walmart.com/search?q=${encodeURIComponent(query)}`
      },
      { 
        name: `Professional ${query}`, 
        price: '$499', 
        source: 'eBay',
        url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`
      }
    ];
  }

  return products.map((p, i) => ({
    id: `product-${i + 1}`,
    name: p.name,
    price: p.price,
    source: p.source,
    url: p.url || `https://www.amazon.com/s?k=${encodeURIComponent(query)}`
  }));
}

// ============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Search server running on http://localhost:${PORT}`);
  console.log('Server is ready to handle search queries...');
});

