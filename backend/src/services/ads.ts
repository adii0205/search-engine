/**
 * Ad Service
 * Privacy-preserving, on-device contextual ads
 */

import { execute, query, queryOne } from '../db/client.js'

interface AdCampaign {
  id: string
  name: string
  advertiserName: string
  categories: string[]
  budget: number
  bidAmount: number
  impressions: number
  clicks: number
  ctr: number
  status: 'active' | 'paused' | 'ended'
}

interface UserAdPreferences {
  enabled: boolean
  categories: string[]
  excludedAdvertisers: string[]
}

export const adService = {
  // Get available ad categories for user selection
  getAvailableCategories(): string[] {
    return [
      'electronics',
      'technology',
      'fashion',
      'home',
      'food',
      'travel',
      'finance',
      'education',
      'health',
      'sports',
      'entertainment',
      'automotive',
    ]
  },

  // Get user's ad preferences
  async getUserAdPreferences(userId: string): Promise<UserAdPreferences> {
    const prefs = await queryOne<{
      ad_categories: string[]
      enabled: boolean
    }>(
      `SELECT ad_categories, 
              CASE WHEN ad_categories IS NOT NULL AND array_length(ad_categories, 1) > 0 
                THEN true ELSE false END as enabled
       FROM user_preferences 
       WHERE user_id = $1`,
      [userId]
    )

    return {
      enabled: prefs?.enabled || false,
      categories: prefs?.ad_categories || [],
      excludedAdvertisers: [],
    }
  },

  // Update user's ad preferences
  async updateUserAdPreferences(
    userId: string,
    preferences: Partial<UserAdPreferences>
  ): Promise<UserAdPreferences> {
    await execute(
      `UPDATE user_preferences 
       SET ad_categories = $1, updated_at = NOW()
       WHERE user_id = $2`,
      [preferences.categories || [], userId]
    )

    return this.getUserAdPreferences(userId)
  },

  // Get contextual ads (on-device intent detection would go here)
  async getContextualAds(
    userSegmentHash: string,
    userPreferences: UserAdPreferences,
    limit: number = 3
  ): Promise<AdCampaign[]> {
    if (!userPreferences.enabled || userPreferences.categories.length === 0) {
      return []
    }

    // Fetch active campaigns matching user's preferred categories
    const campaigns = await query<{
      id: string
      name: string
      advertiser_id: string
      targeting_categories: string[]
      budget_cents: number
      bid_amount_cents: number
    }>(
      `SELECT id, name, advertiser_id, targeting_categories, budget_cents, bid_amount_cents
       FROM ad_campaigns 
       WHERE status = 'active'
       AND targeting_categories && $1
       AND budget_cents > 0
       ORDER BY RANDOM()
       LIMIT $2`,
      [userPreferences.categories, limit]
    )

    return campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      advertiserName: `Advertiser ${c.advertiser_id.substring(0, 8)}`,
      categories: c.targeting_categories,
      budget: c.budget_cents / 100,
      bidAmount: c.bid_amount_cents / 100,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      status: 'active' as const,
    }))
  },

  // Log ad impression (anonymized with hash)
  async logImpression(
    campaignId: string,
    userSegmentHash: string,
    queryIntent: string
  ): Promise<void> {
    await execute(
      `INSERT INTO ad_impressions (campaign_id, user_segment_hash, query_intent, clicked, created_at)
       VALUES ($1, $2, $3, FALSE, NOW())`,
      [campaignId, userSegmentHash, queryIntent]
    )
  },

  // Log ad click (anonymized)
  async logClick(campaignId: string, userSegmentHash: string): Promise<void> {
    // Only log that a click happened, not who clicked
    await execute(
      `UPDATE ad_impressions 
       SET clicked = TRUE 
       WHERE campaign_id = $1 AND user_segment_hash = $2 AND clicked = FALSE
       LIMIT 1`,
      [campaignId, userSegmentHash]
    )
  },

  // Get campaign performance (for advertisers)
  async getCampaignPerformance(campaignId: string): Promise<{
    id: string
    impressions: number
    clicks: number
    ctr: number
    revenue: number
  }> {
    const today = new Date().toISOString().split('T')[0]

    const revenue = await queryOne<{ total_revenue: number }>(
      `SELECT COALESCE(SUM(revenue_cents), 0) / 100 as total_revenue
       FROM ad_revenue 
       WHERE campaign_id = $1`,
      [campaignId]
    )

    const stats = await queryOne<{
      impressions: number
      clicks: number
    }>(
      `SELECT COUNT(*) as impressions, SUM(CASE WHEN clicked THEN 1 ELSE 0 END) as clicks
       FROM ad_impressions
       WHERE campaign_id = $1 AND DATE(created_at) = $2`,
      [campaignId, today]
    )

    const impressions = stats?.impressions || 0
    const clicks = stats?.clicks || 0

    return {
      id: campaignId,
      impressions,
      clicks,
      ctr: impressions > 0 ? clicks / impressions : 0,
      revenue: revenue?.total_revenue || 0,
    }
  },

  // Aggregate daily revenue
  async aggregateDailyRevenue(): Promise<void> {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // Group impressions by campaign and calculate revenue
    await execute(
      `INSERT INTO ad_revenue (date, campaign_id, impressions, clicks, revenue_cents)
       SELECT $1::date, campaign_id, COUNT(*), SUM(CASE WHEN clicked THEN 1 ELSE 0 END),
              COUNT(*) * (SELECT bid_amount_cents FROM ad_campaigns WHERE id = ad_impressions.campaign_id LIMIT 1)
       FROM ad_impressions
       WHERE DATE(created_at) = $1::date
       GROUP BY campaign_id
       ON CONFLICT (date, campaign_id) DO UPDATE SET
         impressions = EXCLUDED.impressions,
         clicks = EXCLUDED.clicks,
         revenue_cents = EXCLUDED.revenue_cents`,
      [yesterday]
    )
  },

  // Privacy: hash user segment key
  hashUserSegment(segment: string): string {
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(segment).digest('hex')
  },

  // Get advertiser dashboard
  async getAdvertiserDashboard(advertiserId: string): Promise<{
    campaigns: AdCampaign[]
    totalSpend: number
    totalImpressions: number
    totalClicks: number
  }> {
    const campaigns = await query<AdCampaign>(
      `SELECT id, name, targeting_categories as categories, budget_cents / 100 as budget, 
              bid_amount_cents / 100 as "bidAmount", status
       FROM ad_campaigns 
       WHERE advertiser_id = $1
       ORDER BY created_at DESC`,
      [advertiserId]
    )

    // Get aggregate stats
    const stats = await queryOne<{
      total_spend: number
      total_impressions: number
      total_clicks: number
    }>(
      `SELECT 
         COALESCE(SUM(revenue_cents), 0) / 100 as total_spend,
         COALESCE(SUM(impressions), 0) as total_impressions,
         COALESCE(SUM(clicks), 0) as total_clicks
       FROM ad_revenue
       WHERE campaign_id IN (
         SELECT id FROM ad_campaigns WHERE advertiser_id = $1
       )`,
      [advertiserId]
    )

    return {
      campaigns: campaigns as AdCampaign[],
      totalSpend: stats?.total_spend || 0,
      totalImpressions: stats?.total_impressions || 0,
      totalClicks: stats?.total_clicks || 0,
    }
  },
}
