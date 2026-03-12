/**
 * Environment Configuration
 * Validates and loads .env variables
 */

import { z } from 'zod'

const EnvSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // JWT
  JWT_SECRET: z.string().min(32),

  // LLM APIs
  ANTHROPIC_API_KEY: z.string(),
  GROQ_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // Search APIs
  BING_SEARCH_API_KEY: z.string(),
  SERPAPI_API_KEY: z.string().optional(),
  BRAVE_SEARCH_API_KEY: z.string().optional(),

  // Database
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // Vector DB
  QDRANT_URL: z.string().url().default('http://localhost:6333'),
  QDRANT_API_KEY: z.string().optional(),

  // Auth (Clerk)
  CLERK_SECRET_KEY: z.string(),
  CLERK_PUBLISHABLE_KEY: z.string(),

  // Payments (Stripe)
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),

  // Storage (Cloudflare R2)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),

  // Analytics
  SENTRY_DSN: z.string().url().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_PUBLIC_KEY: z.string().optional(),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
})

export type Env = z.infer<typeof EnvSchema>

let validated: Env

export function getConfig(): Env {
  if (validated) return validated

  const config = EnvSchema.parse(process.env)
  validated = config
  return config
}

// Validate on import
if (process.env.NODE_ENV === 'production') {
  getConfig()
}
