# Dynamic Product Search Feature

## Overview

The search engine now features **dynamic product recommendations** that appear in glass panels on both sides of the search results. These products are fetched from real ecommerce platforms and are based on what the user is searching for.

## How It Works

### Product Search Flow

1. **User enters search query** → "laptop", "headphones", "shoes", etc.
2. **Frontend sends query to `/api/products`** endpoint
3. **Backend attempts to scrape products** from multiple sources:
   - **Amazon** - Primary source for most products
   - **eBay** - Alternative marketplace
   - **Walmart** - Budget-friendly options
4. **Products displayed dynamically** in left and right panels
5. **Each product is clickable** and links to the actual product page

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                      │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐│
│  │ ProductAd (Left) │  │ SearchResults │  │ ProductAd (Right)││
│  └──────────────────┘  └──────────────┘  └──────────────────┘│
│         ↓                      ↓                    ↓           │
│    Query: "laptop"     Query: "laptop"     Query: "laptop"     │
│         ↓                      ↓                    ↓           │
└─────────────────────────────────────────────────────────────┘
                               ↓
                    API: /api/products?q=laptop
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐│
│  │ Scrape Amazon │  │ Scrape eBay  │  │ Scrape Walmart      ││
│  └──────────────┘  └──────────────┘  └──────────────────────┘│
│         ↓                  ↓                     ↓              │
│    Parse Products   Parse Products      Parse Products        │
│         ↓                  ↓                     ↓              │
│    Return Top 5      Return Top 5         Return Top 5        │
│         ↓                  ↓                     ↓              │
│    ┌────────────────────────────────────────────────────────┐ │
│    │ Merge & Return Best Products (Max 10)                │ │
│    └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 1. **Multi-Source Scraping**
- Searches Amazon, eBay, and Walmart simultaneously
- Falls back to next source if current source fails
- Returns results from first successful source

### 2. **Smart Caching**
- Products are cached in Elasticsearch for repeated searches
- Faster subsequent searches for same query
- Automatic cache invalidation after 24 hours

### 3. **Dynamic Content**
- Left panel: Shows products relevant to search
- Right panel: Also shows products relevant to search
- Panels are hidden on mobile (XL screens and up only)
- Real-time updates as user types

### 4. **Product Information Displayed**
- **Name** - Product title (truncated to 100 chars)
- **Price** - Current price with currency
- **Source** - Which platform (Amazon, eBay, Walmart)
- **Link** - Clickable link to product page
- **Image** - Product image (if available)

## API Endpoints

### `/api/products` - GET
Searches for products across ecommerce platforms

**Query Parameters:**
```
q (string, required) - Search query (e.g., "laptop", "headphones")
```

**Example Request:**
```bash
curl "http://localhost:5000/api/products?q=wireless+headphones"
```

**Example Response:**
```json
{
  "query": "wireless headphones",
  "products": [
    {
      "id": "amazon-1",
      "name": "Sony WH-1000XM5 Wireless Headphones",
      "price": "$398.00",
      "source": "Amazon",
      "url": "https://www.amazon.com/s?k=wireless+headphones",
      "image": "https://example.com/image.jpg"
    },
    {
      "id": "ebay-2",
      "name": "Bose QuietComfort 45",
      "price": "$329.99",
      "source": "eBay",
      "url": "https://www.ebay.com/sch/i.html?_nkw=wireless+headphones"
    },
    // ... more products
  ],
  "count": 8
}
```

## Supported Product Categories

The system intelligently categorizes searches and provides relevant products:

### Auto-Detected Categories:
- **phone** - Smartphones, cases, accessories
- **laptop** - Computers, notebooks, ultrabooks
- **headphones** - Audio devices, earbuds, speakers
- **watch** - Smartwatches, fitness trackers

### Fallback Categories:
For any other search term, the system generates generic product suggestions based on the query.

## Performance Optimizations

### 1. **Parallel Scraping**
- All scrapers run in parallel (not sequential)
- First successful response is used
- Timeout: 10 seconds per request

### 2. **Response Caching**
- Products indexed in Elasticsearch
- Subsequent searches are instant
- Reduces external API calls

### 3. **Load Limiting**
- Returns max 10 products per query
- Only displays top 3 in UI
- "View More" button available if more products found

### 4. **Error Handling**
- Graceful fallback to demo products if scraping fails
- User sees products even if all scrapers fail
- Detailed error logging for debugging

## Demo Products

When scraping fails or no real products are found, the system displays relevant demo products:

```javascript
// Example: Query "gaming chair"
Demo Products Generated:
1. "Premium gaming chair" - $299 - Amazon
2. "Budget gaming chair" - $99 - Walmart
3. "Professional gaming chair" - $499 - eBay
```

Demo products are:
- Category-aware (matches search intent)
- Price-varied (budget, mid-range, premium)
- Source-diverse (Amazon, eBay, Walmart)

## Frontend Integration

### ProductAd Component (`src/components/ProductAd.tsx`)

```tsx
<ProductAd side="left" query={searchQuery} />
```

**Props:**
- `side` (required): "left" | "right" - Position on screen
- `query` (optional): string - Search query

**Features:**
- Auto-fetches products when query changes
- Shows loading spinner during fetch
- Displays "No products found" if query yields no results
- Clickable products that open in new tab
- Glass-morphism UI with hover effects

## Testing

### Test with Different Queries

```bash
# Search for electronics
curl "http://localhost:5000/api/products?q=laptop"

# Search for fashion
curl "http://localhost:5000/api/products?q=shoes"

# Search for home appliances
curl "http://localhost:5000/api/products?q=coffee+maker"
```

### UI Testing

1. Go to http://localhost:3000
2. Enter a search query (e.g., "wireless headphones")
3. Click Search
4. Observe products appearing in left and right panels
5. Click on any product to open in new tab

## Troubleshooting

### Products Not Showing?

1. **Check if server is running:**
   ```bash
   curl http://localhost:5000/api/products?q=test
   ```

2. **Check console for errors:**
   - Open browser DevTools (F12)
   - Check Console tab for API errors
   - Check Network tab for failed requests

3. **Verify ecommerce sites are accessible:**
   - Amazon: https://www.amazon.com
   - eBay: https://www.ebay.com
   - Walmart: https://www.walmart.com

4. **Try restarting the server:**
   ```bash
   Stop-Process -Name "node" -Force
   npm run server
   ```

### Scrapers Timing Out?

- Sites might be rate-limiting requests
- Try again with a different search query
- Or add delays between requests in `server.js`

## Future Enhancements

1. **Real-time Prices** - Fetch current prices from APIs
2. **Review Integration** - Show product ratings/reviews
3. **Inventory Status** - Display stock availability
4. **Price Comparison** - Compare prices across platforms
5. **Affiliate Links** - Add affiliate tracking
6. **Product Images** - Better image handling
7. **Related Products** - Show "you might also like"
8. **Price Alerts** - Notify when price drops
9. **Wishlist** - Save favorite products
10. **Payment Integration** - Direct checkout

## Technical Details

### Scraping Libraries Used
- **axios** - HTTP requests
- **cheerio** - HTML parsing

### Data Structure
```typescript
interface Product {
  id: string;           // Unique identifier
  name: string;         // Product name
  price: string;        // Price with currency
  url?: string;         // Product link
  source?: string;      // Which platform
  image?: string;       // Product image URL
}
```

### Selectors Used

**Amazon:**
```javascript
$('[data-component-type="s-search-result"]')
  .find('h2 a span')       // Product name
  .find('.a-price-whole')  // Price
  .find('img')             // Image
```

**eBay:**
```javascript
$('.s-item')
  .find('.s-item__title')  // Product name
  .find('.s-item__price')  // Price
  .find('.s-item__link')   // Link
```

**Walmart:**
```javascript
$('[data-item-index]')
  .find('[data-testid="productTitle"]')  // Product name
  .find('[data-testid="productPrice"]')  // Price
```

## Rate Limiting & Compliance

The product search respects website terms of service:
- ✅ Uses legitimate User-Agent headers
- ✅ Respects robots.txt
- ✅ Minimal request frequency
- ✅ No content republishing
- ✅ Display attribution (shows source)

**Note:** Heavy scraping of ecommerce sites may violate their ToS. Use API alternatives when available (Amazon Product Advertising API, eBay API, Walmart API).

