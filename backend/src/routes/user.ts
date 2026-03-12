import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

const UpdateUserSchema = z.object({
  name: z.string().optional(),
  tier: z.enum(['free', 'pro', 'team', 'enterprise']).optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']).optional(),
    searchLimit: z.number().optional(),
    autoSummary: z.boolean().optional(),
  }).optional(),
})

export default async function userRoutes(fastify: FastifyInstance) {
  // Get current user profile
  fastify.get(
    '/me',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as any
      const profile = await getProfile(user.userId)
      return reply.send(profile)
    }
  )

  // Update user profile
  fastify.patch<{ Body: z.infer<typeof UpdateUserSchema> }>(
    '/me',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as any
      const updates = UpdateUserSchema.parse(request.body)
      const profile = await updateProfile(user.userId, updates)
      return reply.send(profile)
    }
  )

  // Get search history
  fastify.get(
    '/me/history',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as any
      const history = await getSearchHistory(user.userId)
      return reply.send(history)
    }
  )

  // Get usage stats
  fastify.get(
    '/me/usage',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as any
      const stats = await getUserUsage(user.userId)
      return reply.send(stats)
    }
  )

  // Delete user account (GDPR)
  fastify.delete(
    '/me',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as any
      await deleteUser(user.userId)
      return reply.code(204).send()
    }
  )
}

async function getProfile(userId: string) {
  return { userId, tier: 'free' }
}

async function updateProfile(userId: string, updates: any) {
  return { userId, ...updates }
}

async function getSearchHistory(userId: string) {
  return []
}

async function getUserUsage(userId: string) {
  return { searches: 45, limit: 50, daysRemaining: 15 }
}

async function deleteUser(userId: string) {
  // Delete from DB, Clerk, and data warehouses
}
