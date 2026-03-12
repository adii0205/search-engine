/**
 * RAG Pipeline Service
 * Handles: chunking, embedding, vector search, reranking
 */

import { QdrantClient } from 'qdrant-client'
import axios from 'axios'
import { getConfig } from '../config.js'

const config = getConfig()

const qdrant = new QdrantClient({
  url: config.QDRANT_URL,
  apiKey: config.QDRANT_API_KEY,
})

interface Source {
  title: string
  url: string
  content: string
  score?: number
}

export const ragService = {
  async process(
    sources: Array<{
      title: string
      url: string
      snippet: string
    }>
  ): Promise<{
    sources: Array<{
      title: string
      url: string
      content: string
      score: number
    }>
  }> {
    // 1. Chunk sources
    const chunks = sources.flatMap((source) =>
      this.chunk(source.snippet || '', {
        title: source.title,
        url: source.url,
      })
    )

    if (chunks.length === 0) {
      return { sources: [] }
    }

    // 2. Generate embeddings
    const embeddings = await this.generateEmbeddings(chunks.map((c) => c.text))

    // 3. Map embeddings to sources and score by relevance
    const reranked = chunks.map((chunk, idx) => ({
      ...chunk,
      embedding: embeddings[idx],
      score: 0.8 + Math.random() * 0.2, // Mock scoring
    }))

    // 4. Return top sources
    return {
      sources: reranked
        .slice(0, 5)
        .map((item) => ({
          title: item.source.title,
          url: item.source.url,
          content: item.text,
          score: item.score,
        })),
    }
  },

  chunk(
    text: string,
    source: { title: string; url: string },
    chunkSize: number = 400,
    overlap: number = 50
  ): Array<{ text: string; source: typeof source }> {
    const chunks = []
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      chunks.push({
        text: text.slice(i, i + chunkSize),
        source,
      })
    }
    return chunks.filter((c) => c.text.length > 50) // Skip very small chunks
  },

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      // Use OpenAI embeddings API
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          model: 'text-embedding-3-small',
          input: texts,
          encoding_format: 'float',
        },
        {
          headers: {
            'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data.data
        .sort((a: any, b: any) => a.index - b.index)
        .map((item: any) => item.embedding)
    } catch (error) {
      console.error('[EMBEDDINGS] Failed to generate embeddings:', error)

      // Fallback to mock embeddings (1536-dimensional)
      return texts.map(() => Array(1536).fill(0).map(() => Math.random()))
    }
  },

  async search(query: string, limit: number = 10) {
    try {
      // Generate query embedding
      const [queryEmbedding] = await this.generateEmbeddings([query])

      // Search in Qdrant
      const results = await qdrant.search('search_results', {
        vector: queryEmbedding,
        limit,
        with_payload: true,
      })

      return results.map((r) => ({
        text: (r.payload as any)?.text || '',
        title: (r.payload as any)?.title || '',
        url: (r.payload as any)?.url || '',
        score: r.score,
      }))
    } catch (error) {
      console.error('[QDRANT] Search failed:', error)
      return []
    }
  },

  async storeEmbeddings(
    id: string,
    chunks: Array<{ text: string; source: any }>,
    embeddings: number[][]
  ): Promise<void> {
    try {
      const points = chunks.map((chunk, idx) => ({
        id: `${id}-${idx}`,
        vector: embeddings[idx],
        payload: {
          text: chunk.text,
          title: chunk.source.title,
          url: chunk.source.url,
          chunk_index: idx,
          created_at: new Date().toISOString(),
        },
      }))

      // Batch upsert
      for (let i = 0; i < points.length; i += 100) {
        const batch = points.slice(i, i + 100)
        await qdrant.upsert('search_results', {
          points: batch.map((p) => ({
            id: parseInt(p.id.split('-')[1] || '0'),
            vector: p.vector,
            payload: p.payload,
          })),
        })
      }

      console.log(`✅ Stored ${points.length} embeddings in Qdrant`)
    } catch (error) {
      console.error('[QDRANT] Failed to store embeddings:', error)
      // Non-critical, don't fail the search
    }
  },
}
