/**
 * Authentication Middleware
 * Verifies JWT and decodes user claims
 */

import { FastifyRequest, FastifyReply } from 'fastify'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        tier: string
        iat: number
        exp: number
      }
    }
  }
}

// Extend Fastify request type
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string
      tier: string
      iat: number
      exp: number
    }
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Verify JWT
    await request.jwtVerify()

    // User is now available in request.user
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
  } catch (error) {
    return reply.code(401).send({ error: 'Invalid or expired token' })
  }
}

// Optional auth middleware (doesn't fail if no token)
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify()
  } catch (err) {
    // No-op: user is optional
  }
}

// Check rate limit middleware
export async function rateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.user) return // Not authenticated

  // Rate limiting is handled by @fastify/rate-limit plugin
  // But we can add custom logic here based on tier
  const tier = (request.user as any).tier

  // Pro tier gets higher limits (handled by plugin config)
  if (tier === 'enterprise') {
    // Bypass rate limiting for enterprise
    request.headers['x-rate-limit-bypass'] = 'true'
  }
}
