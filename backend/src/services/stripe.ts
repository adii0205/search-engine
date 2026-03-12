/**
 * Stripe Service
 * Handles subscriptions, invoices, payments
 */

import Stripe from 'stripe'
import { getConfig } from '../config.js'
import { userService } from './user.js'
import { execute, query, queryOne } from '../db/client.js'

const config = getConfig()
const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
})

// Stripe product/price IDs (set these up in Stripe dashboard)
const STRIPE_PRICES = {
  pro_monthly: 'price_pro_monthly', // $12/month - replace with actual ID
  team_monthly: 'price_team_monthly', // $49/month
  enterprise: 'price_enterprise', // Custom
} as const

export const stripeService = {
  // Create checkout session for subscription
  async createCheckoutSession(userId: string, priceId: string): Promise<string> {
    const user = await userService.getUserById(userId)
    if (!user) throw new Error('User not found')

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email,
      success_url: `${process.env.APP_URL || 'http://localhost:3000'}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/billing/cancel`,
      metadata: {
        userId,
        userEmail: user.email,
      },
    })

    return session.url || ''
  },

  // Handle webhook: subscription created/updated
  async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const userId = (subscription.metadata as any)?.userId
    if (!userId) return

    const priceId = (subscription.items.data[0]?.price.id as string) || ''
    let tier: 'pro' | 'team' | 'enterprise' = 'free'

    if (priceId.includes('pro')) tier = 'pro'
    else if (priceId.includes('team')) tier = 'team'
    else if (priceId.includes('enterprise')) tier = 'enterprise'

    // Update user tier
    await userService.updateUserTier(userId, tier)

    // Store subscription in DB
    await execute(
      `INSERT INTO subscriptions (user_id, plan_id, status, stripe_subscription_id, current_period_start, current_period_end, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (stripe_subscription_id) DO UPDATE SET 
         plan_id = EXCLUDED.plan_id,
         status = EXCLUDED.status,
         current_period_start = EXCLUDED.current_period_start,
         current_period_end = EXCLUDED.current_period_end,
         updated_at = NOW()`,
      [
        userId,
        tier,
        subscription.status,
        subscription.id,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
      ]
    )

    console.log(`✅ Subscription created: ${subscription.id} for user ${userId} (${tier})`)
  },

  // Handle webhook: subscription updated
  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    if (subscription.status === 'cancelled') {
      return this.handleSubscriptionCancelled(subscription)
    }

    await this.handleSubscriptionCreated(subscription)
  },

  // Handle webhook: subscription cancelled
  async handleSubscriptionCancelled(subscription: Stripe.Subscription): Promise<void> {
    // Set user back to free tier
    const sub = await queryOne<{ user_id: string }>(
      `SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1`,
      [subscription.id]
    )

    if (sub) {
      await userService.updateUserTier(sub.user_id, 'free')

      // Update subscription status
      await execute(
        `UPDATE subscriptions SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
         WHERE stripe_subscription_id = $1`,
        [subscription.id]
      )

      console.log(`✅ Subscription cancelled: ${subscription.id}`)
    }
  },

  // Verify webhook signature
  constructWebhookEvent(
    body: Buffer | string,
    signature: string
  ): Stripe.Event {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      config.STRIPE_WEBHOOK_SECRET
    )
  },

  // Get subscription details
  async getSubscription(userId: string): Promise<{
    status: string
    tier: string
    nextBillingDate?: Date
    cancelledAt?: Date
  } | null> {
    const sub = await queryOne<{
      status: string
      plan_id: string
      current_period_end: Date
      cancelled_at: Date | null
    }>(
      `SELECT status, plan_id, current_period_end, cancelled_at
       FROM subscriptions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    )

    return sub
      ? {
          status: sub.status,
          tier: sub.plan_id,
          nextBillingDate: sub.current_period_end,
          cancelledAt: sub.cancelled_at || undefined,
        }
      : null
  },

  // Cancel subscription
  async cancelSubscription(userId: string): Promise<void> {
    const sub = await queryOne<{ stripe_subscription_id: string }>(
      `SELECT stripe_subscription_id FROM subscriptions 
       WHERE user_id = $1 AND status != 'cancelled'
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    )

    if (sub) {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id)
    }
  },

  // Get billing portal URL
  async getBillingPortalUrl(userId: string): Promise<string> {
    const user = await userService.getUserById(userId)
    if (!user?.stripeCustomerId) throw new Error('No Stripe customer ID')

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.APP_URL || 'http://localhost:3000'}/settings/billing`,
    })

    return session.url
  },

  // Create invoice
  async createInvoice(userId: string, description: string, amountCents: number): Promise<void> {
    const user = await userService.getUserById(userId)
    if (!user?.stripeCustomerId) throw new Error('No Stripe customer ID')

    await stripe.invoiceItems.create({
      customer: user.stripeCustomerId,
      amount: amountCents,
      currency: 'usd',
      description,
    })
  },
}
