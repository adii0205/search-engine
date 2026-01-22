# Elasticsearch Integration Guide

## Setup Instructions

### 1. Install Elasticsearch locally

**Option A: Using Docker (Recommended - Easiest)**
```bash
docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -e "xpack.security.enabled=false" docker.elastic.co/elasticsearch/elasticsearch:8.14.0
```

**Option B: Direct Installation**
- Download from: https://www.elastic.co/downloads/elasticsearch
- Extract and run: `bin\elasticsearch.bat` (Windows)
- Or: `bin/elasticsearch` (Mac/Linux)

### 2. Verify Elasticsearch is running
```bash
curl http://localhost:9200
```
You should see a response with version info.

### 3. Install dependencies
```bash
npm install
```

### 4. Start your search engine
```bash
npm run dev:all
```

## How Elasticsearch Integration Works

### Current Flow:
1. **Web Scraping** (existing) - Gathers initial results from web
2. **Elasticsearch Indexing** - Stores scraped results in Elasticsearch
3. **Smart Search** - When user searches:
   - Checks Elasticsearch first for indexed results
   - Falls back to web scraping if needed
   - Results are ranked by relevance

### Features:
✅ Fast full-text search with fuzzy matching
✅ Relevance-based ranking
✅ Query optimization
✅ No dependency on Google API
✅ Scalable for large datasets
✅ Perfect for ad-supported search engine

## API Endpoints Using Elasticsearch

### Search with Elasticsearch
```
GET /api/search?q=query          (searches all indexed results)
GET /api/search/images?q=query   (searches indexed images)
GET /api/search/videos?q=query   (searches indexed videos)
GET /api/search/news?q=query     (searches indexed news)
```

### Admin Endpoints
```
GET /api/elasticsearch/stats     (get index statistics)
POST /api/elasticsearch/clear    (clear all indexed data)
GET /api/elasticsearch/health    (check Elasticsearch health)
```

## Index Statistics

The search engine automatically tracks:
- Total indexed documents
- Relevance scores
- Search performance
- Query patterns

## Monetization Ready

The Elasticsearch setup is ready for:
- Ad insertion between results
- Sponsored results at top
- Analytics tracking
- Search trend analysis
- User behavior insights

## Troubleshooting

**Elasticsearch not connecting?**
- Ensure Docker/Elasticsearch is running on port 9200
- Check: `curl http://localhost:9200`

**Results not showing?**
- Index might be empty - perform searches to populate
- Check: `GET /api/elasticsearch/stats`

**Performance slow?**
- Increase Elasticsearch heap memory
- Docker: Add `-e "ES_JAVA_OPTS=-Xms512m -Xmx512m"`

## Next Steps

1. Deploy Elasticsearch to production (AWS, Elastic Cloud, etc.)
2. Set up authentication for production
3. Implement automatic web crawling to populate index
4. Add analytics dashboard
5. Implement ad serving system
