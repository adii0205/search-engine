import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { searchService } from '@/services/search.js'
import { llmService } from '@/services/llm.js'
import { ragService } from '@/services/rag.js'
import { userService } from '@/services/user.js'
import { execute, queryOne } from '@/db/client.js'

const SearchSchema = z.object({
  query: z.string().min(1).max(1000),
  userId: z.string().optional(),
})

export default async function searchRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: z.infer<typeof SearchSchema> }>(
    '/',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now()

      try {
        const { query } = SearchSchema.parse(request.body)
        const user = request.user as any
        const userId = user?.userId

        // Check rate limit
        if (userId) {
          const usage = await userService.getUserUsage(userId)

          if (user.tier === 'free' && usage.searches >= usage.limit) {
            return reply.code(429).send({
              error: 'Daily search limit exceeded',
              limit: usage.limit,
              reset: 'in 24 hours',
            })
          }
        }

        // Check cache (Redis would be better for production)
        const cacheKey = `search:${Buffer.from(query).toString('base64')}`
        // TODO: Check Redis cache here

        // 1. Fetch from multiple search engines
        const webResults = await searchService.fetchResults(query, 15)

        if (webResults.length === 0) {
          return reply.code(404).send({
            error: 'No search results found',
            query,
          })
        }

        // 2. RAG pipeline: process and rerank results
        const ragContext = await ragService.process(webResults)

        // 3. Generate answer with LLM
        const answer = await llmService.generateAnswer(query, ragContext)

        const processingTime = Date.now() - startTime

        // 4. Log search (anonymized for privacy)
        if (userId) {
          const queryHash = require('crypto')
            .createHash('sha256')
            .update(query)
            .digest('hex')

          await execute(
            `INSERT INTO search_queries (user_id, query_hash, result_count, processing_time_ms, model_used, cached, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [userId, queryHash, webResults.length, processingTime, 'claude-3-5-sonnet', false]
          )
        }

        return reply.code(200).send({
          answer: answer.text,
          sources: answer.sources,
          searchQuery: query,
          processingTime,
          cached: false,
          resultCount: webResults.length,
        })
      } catch (error) {
        fastify.log.error(error)

        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            error: 'Invalid request',
            details: error.errors,
          })
        }

        return reply.code(400).send({
          error: error instanceof Error ? error.message : 'Search failed',
        })
      }
    }
  )

  // Search with deep research mode (Pro tier only)
  fastify.post<{ Body: { query: string } }>(
    '/deep',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as any

      if (user?.tier !== 'pro' && user?.tier !== 'team' && user?.tier !== 'enterprise') {
        return reply.code(403).send({
          error: 'Deep research requires Pro tier or higher',
        })
      }

      const { query } = request.body

      // Trigger background job
      const job = await searchService.deepResearch(query, {
        userId: user.userId,
        maxDepth: 5,
      })

      return reply.code(202).send({
        jobId: job.id,
        statusUrl: `/api/search/jobs/${job.id}`,
        message: 'Deep research started. Check back soon.',
      })
    }
  )

  // Get search result by job ID
  fastify.get<{ Params: { jobId: string } }>(
    '/jobs/:jobId',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // TODO: Implement job status tracking
      return reply.send({
        jobId: request.params.jobId,
        status: 'processing',
        progress: 45,
      })
    }
  )

  // Search suggestions (autocomplete)
  fastify.get<{ Querystring: { q: string } }>(
    '/suggestions',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { q } = request.query as { q: string }

      if (!q || q.length < 2) {
        return reply.send([])
      }

      // Return mock suggestions (in production, query search logs)
      const suggestions = [
        `${q} news`,
        `${q} tutorial`,
        `${q} reddit`,
        `best ${q}`,
        `${q} 2025`,
      ]

      return reply.send(suggestions)
    }
  )
}
