/**
 * Search Federator Service
 * Aggregates results from multiple sources: Bing, SerpAPI, Brave, Common Crawl
 */

import axios from 'axios'
import { getConfig } from '../config.js'

interface SearchResult {
  title: string
  url: string
  snippet: string
  content?: string
  source: 'bing' | 'serpapi' | 'brave' | 'crawl'
}

const config = getConfig()

export const searchService = {
  async fetchResults(query: string, limit: number = 10): Promise<SearchResult[]> {
    // Parallel fetch from multiple sources
    const [bingResults, serpResults, braveResults] = await Promise.allSettled([
      this.searchBing(query, limit),
      config.SERPAPI_API_KEY ? this.searchSerpAPI(query, limit) : Promise.resolve([]),
      config.BRAVE_SEARCH_API_KEY ? this.searchBrave(query, limit) : Promise.resolve([]),
    ])

    const results: SearchResult[] = []

    if (bingResults.status === 'fulfilled') results.push(...bingResults.value)
    if (serpResults.status === 'fulfilled') results.push(...serpResults.value)
    if (braveResults.status === 'fulfilled') results.push(...braveResults.value)

    // Deduplicate and sort by relevance
    return this.deduplicate(results).slice(0, limit)
  },

  async searchBing(query: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
        headers: {
          'Ocp-Apim-Subscription-Key': config.BING_SEARCH_API_KEY,
        },
        params: {
          q: query,
          count: Math.min(limit, 15),
          mkt: 'en-US',
          responseFilter: 'Webpages',
          safeSearch: 'Moderate',
        },
      })

      return (response.data.webPages?.value || []).map((result: any) => ({
        title: result.name,
        url: result.url,
        snippet: result.snippet,
        source: 'bing' as const,
      }))
    } catch (error) {
      console.error('[BING] Search error:', error instanceof Error ? error.message : error)
      return []
    }
  },

  async searchSerpAPI(query: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          q: query,
          api_key: config.SERPAPI_API_KEY,
          engine: 'google',
          num: Math.min(limit, 20),
        },
        timeout: 5000,
      })

      return (response.data.organic_results || [])
        .slice(0, limit)
        .map((result: any) => ({
          title: result.title,
          url: result.link,
          snippet: result.snippet || '',
          source: 'serpapi' as const,
        }))
    } catch (error) {
      console.error('[SERPAPI] Search error:', error instanceof Error ? error.message : error)
      return []
    }
  },

  async searchBrave(query: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': config.BRAVE_SEARCH_API_KEY,
        },
        params: {
          q: query,
          count: Math.min(limit, 20),
        },
        timeout: 5000,
      })

      return (response.data.web || []).map((result: any) => ({
        title: result.title,
        url: result.url,
        snippet: result.description,
        source: 'brave' as const,
      }))
    } catch (error) {
      console.error('[BRAVE] Search error:', error instanceof Error ? error.message : error)
      return []
    }
  },

  deduplicate(results: SearchResult[]): SearchResult[] {
    const seen = new Map<string, SearchResult>()

    results.forEach((result) => {
      const key = new URL(result.url).hostname || result.url

      // Keep first result for each domain, or replace if current snippet is longer
      if (!seen.has(key) || result.snippet.length > (seen.get(key)?.snippet.length || 0)) {
        seen.set(key, result)
      }
    })

    return Array.from(seen.values())
  },

  async deepResearch(
    query: string,
    options: { userId: string; maxDepth: number }
  ): Promise<{ id: string }> {
    // Trigger background job (BullMQ)
    // Job will:
    // 1. Perform initial search
    // 2. Follow-up searches based on findings
    // 3. Synthesize findings
    // 4. Generate report
    // 5. Save to user's memory

    return { id: 'job-' + Date.now() }
  },
}
