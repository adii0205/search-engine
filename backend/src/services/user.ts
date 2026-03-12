/**
 * User Service
 * Handles user registration, profile, and permissions
 */

import { execute, query, queryOne } from './client.js'

export interface User {
  id: string
  email: string
  name: string
  tier: 'free' | 'pro' | 'team' | 'enterprise'
  clerkId: string
  stripeCustomerId?: string
  createdAt: Date
  updatedAt: Date
}

export const userService = {
  // Create user after Clerk signup
  async createUser(data: {
    clerkId: string
    email: string
    name: string
  }): Promise<User> {
    const { clerkId, email, name } = data

    const rows = await query<User>(
      `INSERT INTO users (id, email, name, tier, stripe_customer_id, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NULL, NOW(), NOW())
       RETURNING id, email, name, tier, stripe_customer_id as "stripeCustomerId", created_at as "createdAt", updated_at as "updatedAt"`,
      [email, name, 'free']
    )

    // Store Clerk ID in user metadata (simplified approach)
    // In production, you'd store this in a separate clerk_users table
    console.log(`Created user for Clerk ID: ${clerkId}`)

    return {
      ...rows[0],
      clerkId,
    }
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const user = await queryOne<User>(
      `SELECT id, email, name, tier, stripe_customer_id as "stripeCustomerId", 
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    )
    return user
  },

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    const user = await queryOne<User>(
      `SELECT id, email, name, tier, stripe_customer_id as "stripeCustomerId",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    )
    return user
  },

  // Update user tier
  async updateUserTier(
    userId: string,
    tier: 'free' | 'pro' | 'team' | 'enterprise'
  ): Promise<User> {
    const rows = await query<User>(
      `UPDATE users SET tier = $1, updated_at = NOW() 
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, email, name, tier, stripe_customer_id as "stripeCustomerId",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [tier, userId]
    )

    if (!rows[0]) throw new Error('User not found')
    return {
      ...rows[0],
      clerkId: '', // Would need to fetch from Clerk
    }
  },

  // Set Stripe customer ID
  async setStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
    await execute(
      `UPDATE users SET stripe_customer_id = $1, updated_at = NOW() 
       WHERE id = $2`,
      [stripeCustomerId, userId]
    )
  },

  // Check if email exists
  async emailExists(email: string): Promise<boolean> {
    const result = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    )
    return (result?.count || 0) > 0
  },

  // Delete user (soft delete for compliance)
  async deleteUser(userId: string): Promise<void> {
    await execute(
      `UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [userId]
    )
  },

  // Get usage stats for rate limiting
  async getUserUsage(userId: string): Promise<{
    searches: number
    limit: number
    daysRemaining: number
  }> {
    // Get user tier
    const user = await this.getUserById(userId)
    if (!user) throw new Error('User not found')

    // Determine limit based on tier
    const limits: Record<string, number> = {
      free: 50,
      pro: 10000,
      team: 100000,
      enterprise: -1, // unlimited
    }

    const limit = limits[user.tier] || 50

    // Count searches in last 24h
    const result = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM search_queries 
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '24h'`,
      [userId]
    )

    const searches = result?.count || 0
    const daysRemaining = 0 // Could calculate based on subscription

    return {
      searches,
      limit: limit === -1 ? 999999 : limit,
      daysRemaining,
    }
  },
}
