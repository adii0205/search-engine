import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { stripeService } from '@/services/stripe.js'
import { userService } from '@/services/user.js'
import { execute, queryOne } from '@/db/client.js'
import Stripe from 'stripe'

const CreateCheckoutSchema = z.object({
  tier: z.enum(['pro', 'team', 'enterprise']),
})

export default async function billingRoutes(fastify: FastifyInstance) {
  // Create checkout session
  fastify.post<{ Body: z.infer<typeof CreateCheckoutSchema> }>(
    '/checkout',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any)?.userId
        const { tier } = CreateCheckoutSchema.parse(request.body)

        // Map tier to Stripe price ID
        const priceMap = {
          pro: process.env.STRIPE_PRO_PRICE_ID,
          team: process.env.STRIPE_TEAM_PRICE_ID,
          enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
        }

        const priceId = priceMap[tier]
        if (!priceId) {
          return reply.code(400).send({ error: `No price configured for ${tier} tier` })
        }

        const sessionUrl = await stripeService.createCheckoutSession(userId, priceId)

        return reply.send({
          checkoutUrl: sessionUrl,
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error instanceof Error ? error.message : 'Checkout failed',
        })
      }
    }
  )

  // Get current subscription
  fastify.get(
    '/subscription',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any)?.userId
        const subscription = await stripeService.getSubscription(userId)

        return reply.send(subscription || { status: 'none', tier: 'free' })
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Failed to fetch subscription' })
      }
    }
  )

  // Get billing portal URL
  fastify.get(
    '/portal',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any)?.userId
        const portalUrl = await stripeService.getBillingPortalUrl(userId)

        return reply.send({ portalUrl })
      } catch (error) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error instanceof Error ? error.message : 'Failed to create portal session',
        })
      }
    }
  )

  // Cancel subscription
  fastify.post(
    '/cancel',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any)?.userId

        await stripeService.cancelSubscription(userId)
        await userService.updateUserTier(userId, 'free')

        return reply.send({ success: true, message: 'Subscription cancelled' })
      } catch (error) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error instanceof Error ? error.message : 'Cancellation failed',
        })
      }
    }
  )

  // Stripe webhook
  fastify.post(
    '/webhook',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const signature = request.headers['stripe-signature'] as string

        const event = stripeService.constructWebhookEvent(
          request.rawBody || JSON.stringify(request.body),
          signature
        )

        // Handle events
        switch (event.type) {
          case 'customer.subscription.created':
            await stripeService.handleSubscriptionCreated(
              event.data.object as Stripe.Subscription
            )
            break

          case 'customer.subscription.updated':
            await stripeService.handleSubscriptionUpdated(
              event.data.object as Stripe.Subscription
            )
            break

          case 'customer.subscription.deleted':
            await stripeService.handleSubscriptionCancelled(
              event.data.object as Stripe.Subscription
            )
            break
        }

        return reply.code(200).send({ received: true })
      } catch (error) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error instanceof Error ? error.message : 'Webhook processing failed',
        })
      }
    }
  )
}
