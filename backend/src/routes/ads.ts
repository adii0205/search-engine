import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { adService } from '@/services/ads.js'

const AdCampaignSchema = z.object({
  name: z.string().min(3).max(255),
  budget: z.number().min(10),
  targetCategories: z.array(z.string()).min(1),
  bidAmount: z.number().min(0.10).optional(),
})

export default async function adsRoutes(fastify: FastifyInstance) {
  // Get available ad categories
  fastify.get('/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    const categories = adService.getAvailableCategories()
    return reply.send({ categories })
  })

  // Get contextual ads for user
  fastify.get(
    '/feed',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as any
        const userId = user?.userId

        // Get user's ad preferences
        const preferences = await adService.getUserAdPreferences(userId)

        if (!preferences.enabled) {
          return reply.send({ ads: [] })
        }

        // Hash user segment for privacy (no PII)
        const userSegmentHash = adService.hashUserSegment(
          `${userId}-${new Date().toISOString().split('T')[0]}`
        )

        // Get contextual ads based on preferences
        const ads = await adService.getContextualAds(userSegmentHash, preferences)

        return reply.send({ ads })
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Failed to fetch ads' })
      }
    }
  )

  // Log ad impression
  fastify.post<{ Body: { campaignId: string; queryIntent: string } }>(
    '/impressions',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { campaignId, queryIntent } = request.body

        // Hash segment without storing user ID
        const userSegmentHash = adService.hashUserSegment(
          `${Date.now()}-${Math.random()}` // Anonymized
        )

        await adService.logImpression(campaignId, userSegmentHash, queryIntent)

        return reply.code(201).send({ success: true })
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Failed to log impression' })
      }
    }
  )

  // Log ad click
  fastify.post<{ Body: { campaignId: string } }>(
    '/clicks',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { campaignId } = request.body

        // Anonymous click logging
        const userSegmentHash = adService.hashUserSegment(
          `${Date.now()}-${Math.random()}`
        )

        await adService.logClick(campaignId, userSegmentHash)

        return reply.code(201).send({ success: true })
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Failed to log click' })
      }
    }
  )

  // Get user ad preferences
  fastify.get(
    '/preferences',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as any
        const preferences = await adService.getUserAdPreferences(user.userId)

        return reply.send({
          preferences,
          availableCategories: adService.getAvailableCategories(),
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Failed to fetch preferences' })
      }
    }
  )

  // Update user ad preferences
  fastify.patch<{ Body: { enabled: boolean; categories: string[] } }>(
    '/preferences',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as any
        const { enabled, categories } = request.body

        const updated = await adService.updateUserAdPreferences(user.userId, {
          enabled,
          categories: enabled ? categories : [],
        })

        return reply.send(updated)
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Failed to update preferences' })
      }
    }
  )

  // Campaign management (for advertisers)
  fastify.post<{ Body: z.infer<typeof AdCampaignSchema> }>(
    '/campaigns',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as any
        const campaign = AdCampaignSchema.parse(request.body)

        // TODO: Create campaign in DB
        // For now, return mock response

        return reply.code(201).send({
          id: `camp-${Date.now()}`,
          ...campaign,
          status: 'active',
        })
      } catch (error) {
        fastify.log.error(error)

        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid campaign data', details: error.errors })
        }

        return reply.code(500).send({ error: 'Failed to create campaign' })
      }
    }
  )

  // Get campaign performance
  fastify.get<{ Params: { campaignId: string } }>(
    '/campaigns/:campaignId',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const performance = await adService.getCampaignPerformance(
          request.params.campaignId
        )
        return reply.send(performance)
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Failed to fetch performance' })
      }
    }
  )
}
