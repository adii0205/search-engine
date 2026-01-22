# Black Blurry Search Engine - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                     │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Search Box   │  │ All Results  │  │ Images Tab   │  ...    │
│  │ (Input)      │  │ (Web)        │  │ (Gallery)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│        │                  │                  │                 │
│        └──────────────────┼──────────────────┘                 │
│                           │                                    │
│         /api/search?q=query                                   │
│         /api/search/images?q=query                            │
│         /api/search/videos?q=query                            │
│         /api/search/news?q=query                              │
│                           │                                    │
└───────────────────────────┼────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│               Backend (Node.js + Express)                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  API Router (/api/search, /api/search/images, etc)       │ │
│  └────────────────┬────────────────────────────────────────┘ │
│                   │                                           │
│    ┌──────────────┴──────────────┐                           │
│    │                             │                           │
│    ▼                             ▼                           │
│  ┌─────────────────────┐  ┌──────────────────────┐          │
│  │ Elasticsearch Query │  │ Web Scraping Fallback│          │
│  │ (elasticsearch-     │  │ (Cheerio + Axios)   │          │
│  │  service.js)        │  │ - Google            │          │
│  │                     │  │ - DuckDuckGo        │          │
│  │ ✓ Fast (cached)     │  │ - Bing              │          │
│  │ ✓ Ranked            │  │                     │          │
│  │ ✓ Smart             │  │ ✓ Fresh results     │          │
│  └────────┬────────────┘  └──────────┬──────────┘          │
│           │                          │                       │
│           │ (no results)             │                       │
│           └──────────────┬───────────┘                       │
│                          │                                   │
│                   ┌──────▼──────┐                           │
│                   │ Auto-Index  │                           │
│                   │ New Results │                           │
│                   └──────┬──────┘                           │
│                          │                                   │
│                   Response to Frontend                       │
│                   + source field                             │
│                   (elasticsearch|web|demo)                   │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│          Data Layer - Local Storage                              │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐│
│  │  Elasticsearch       │  │  Node Process Storage            ││
│  │  (Port 9200)         │  │  (Server memory)                 ││
│  │                      │  │                                  ││
│  │ ├─ Indexed results   │  │ Web pages currently being        ││
│  │ ├─ Previous queries  │  │ crawled                          ││
│  │ ├─ Cached responses  │  │                                  ││
│  │ ├─ Relevance scores  │  │                                  ││
│  │ └─ Analytics data    │  │                                  ││
│  └──────────────────────┘  └──────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
USER ENTERS QUERY "apple"
           │
           ▼
    ┌──────────────┐
    │  Normalize   │
    │  Query       │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────────────────────┐
    │  Check Elasticsearch Index           │
    │  (search-results index on port 9200) │
    └──────┬──────────────────────────────┘
           │
      ┌────┴────┐
      │          │
    YES         NO
      │          │
      ▼          ▼
   ┌────┐  ┌──────────────────────────┐
   │Return│  │ Web Scraping Engines:    │
   │Cached│  │                          │
   │Fast! │  │ 1. Google Search        │
   └────┘  │ 2. DuckDuckGo (fallback) │
      │    │ 3. Bing (fallback)       │
      │    │                          │
      │    │ Parse HTML with Cheerio  │
      │    │ Extract titles, URLs,    │
      │    │ descriptions, images     │
      │    └──────────┬───────────────┘
      │               │
      │         ┌─────▼─────┐
      │         │ Format    │
      │         │ Results   │
      │         └─────┬─────┘
      │               │
      │         ┌─────▼──────────────────┐
      │         │ Index New Results      │
      │         │ Store in Elasticsearch │
      │         │ For future queries     │
      │         └─────┬──────────────────┘
      │               │
      └───────┬───────┘
              │
              ▼
        ┌────────────────┐
        │ Sort & Rank    │
        │ (Relevance)    │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────┐
        │ Add Metadata   │
        │ (logos,        │
        │  dates, etc)   │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────┐
        │ Return JSON    │
        │ to Frontend    │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────┐
        │ Display in UI  │
        │ - Results grid │
        │ - Ads slots    │
        │ - Pagination  │
        └────────────────┘
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND LAYER                        │
├─────────────────────────────────────────────────────────┤
│ React 18.3.1  │ TypeScript  │ Vite 6.3.5  │ Tailwind   │
│ Lucide Icons  │ Axios       │ HMR Support │ Responsive │
└─────────────────────────────────────────────────────────┘
           │
           │ HTTP/JSON
           │
┌─────────────────────────────────────────────────────────┐
│                   BACKEND LAYER                         │
├─────────────────────────────────────────────────────────┤
│ Node.js 20+   │ Express 5.2.1  │ CORS Enabled          │
│ Axios 1.13.2  │ Cheerio 1.1.2  │ Concurrently          │
│ Puppeteer     │ Cheerio        │ (multi-server)        │
└─────────────────────────────────────────────────────────┘
           │
           │ Bulk Operations / TCP
           │
┌─────────────────────────────────────────────────────────┐
│                  DATA LAYER                             │
├─────────────────────────────────────────────────────────┤
│ Elasticsearch 8.14.0                                    │
│ ├─ Full-Text Search                                    │
│ ├─ Relevance Ranking                                   │
│ ├─ Fuzzy Matching                                      │
│ ├─ Analytics Ready                                     │
│ └─ Scalable (0-millions of documents)                 │
└─────────────────────────────────────────────────────────┘
           │
           │ Web Scraping Fallback
           │
┌─────────────────────────────────────────────────────────┐
│                  EXTERNAL SOURCES                       │
├─────────────────────────────────────────────────────────┤
│ Google Search │ DuckDuckGo │ Bing │ Image APIs         │
│ Video APIs    │ News APIs  │ Web Pages                  │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────────┐
│              PRODUCTION DEPLOYMENT                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ CDN (Vercel/Netlify) - Frontend                │  │
│  │ ├─ React SPA                                   │  │
│  │ ├─ Static assets                               │  │
│  │ └─ Global distribution                         │  │
│  └────────────┬────────────────────────────────────┘  │
│               │ HTTPS/HTTP2                           │
│  ┌────────────▼────────────────────────────────────┐  │
│  │ Backend Server (AWS EC2 / Heroku)              │  │
│  │ ├─ Express server                              │  │
│  │ ├─ Web scrapers                                │  │
│  │ └─ Elasticsearch client                        │  │
│  └────────────┬────────────────────────────────────┘  │
│               │ Bulk API                              │
│  ┌────────────▼────────────────────────────────────┐  │
│  │ Elasticsearch Cloud (Elastic.co)                │  │
│  │ ├─ Managed service                             │  │
│  │ ├─ Auto-scaling                                │  │
│  │ ├─ High availability                           │  │
│  │ └─ Automatic backups                           │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Analytics & Monitoring                          │  │
│  │ ├─ Datadog/New Relic                            │  │
│  │ ├─ Ad revenue tracking                          │  │
│  │ ├─ User behavior analytics                      │  │
│  │ └─ Search trend analysis                        │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Monetization Architecture

```
Search Results Page
├─ Top: Sponsored Result (Premium AD - $10-50)
├─ Results 1-3: Organic
├─ Ad Slot: Display Ad (CPM-based - $2-8)
├─ Results 4-7: Organic
├─ Ad Slot: Native Ad (CPC-based - $0.50-5)
├─ Results 8-10: Organic
└─ Bottom: Related Searches + Footer Ad

Revenue Streams:
├─ Sponsored Results
├─ Display Ads
├─ Native Ads
├─ Affiliate Links
├─ Premium Features
└─ Enterprise Search API
```

---

This architecture ensures:
✅ Fast performance (Elasticsearch)
✅ Fresh results (web scraping)
✅ Scalability (cloud ready)
✅ Revenue generation (ad-integrated)
✅ Professor approval (no Google API)
