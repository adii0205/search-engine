import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import { config } from 'dotenv'

import { initDb, closeDb } from './db/client.js'
import { getConfig } from './config.js'
import searchRoutes from './routes/search.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import adsRoutes from './routes/ads.js'
import billingRoutes from './routes/billing.js'
import { authMiddleware } from './middleware/auth.js'

config()

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
  // For Stripe webhooks
  bodyLimit: 1048576, // 1MB
})

// Initialize database
try {
  await initDb()
} catch (error) {
  console.error('Failed to initialize database:', error)
  process.exit(1)
}

// Get validated config
const config_obj = getConfig()

// Register plugins
await app.register(cors, {
  origin: config_obj.ALLOWED_ORIGINS.split(','),
  credentials: true,
})

await app.register(jwt, {
  secret: config_obj.JWT_SECRET,
})

await app.register(rateLimit, {
  max: 100,
  timeWindow: '5 minutes',
  // Skip rate limiting for health checks and webhooks
  skip: (request) => request.url === '/health' || request.url.startsWith('/api/billing/webhook'),
})

// Decorate app with authenticate helper
app.decorate('authenticate', authMiddleware)

// Health check
app.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  }
})

// API Routes
await app.register(authRoutes, { prefix: '/api/auth' })
await app.register(searchRoutes, { prefix: '/api/search' })
await app.register(userRoutes, { prefix: '/api/users' })
await app.register(adsRoutes, { prefix: '/api/ads' })
await app.register(billingRoutes, { prefix: '/api/billing' })

// Global error handler
app.setErrorHandler((error, request, reply) => {
  app.log.error(error)

  if (error.statusCode === 429) {
    return reply.code(429).send({
      error: 'Rate limit exceeded',
      retryAfter: error.headers['retry-after'],
    })
  }

  return reply.code(error.statusCode || 500).send({
    error: error.message || 'Internal server error',
  })
})

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM']
signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`\n${signal} received, shutting down...`)
    await app.close()
    await closeDb()
    process.exit(0)
  })
})

// Start server
const start = async () => {
  try {
    const port = config_obj.PORT
    const host = config_obj.HOST

    await app.listen({ port, host })
    console.log(`✅ Nexus API running on http://${host}:${port}`)
    console.log(`   Environment: ${config_obj.NODE_ENV}`)
  } catch (err) {
    app.log.error(err)
    await closeDb()
    process.exit(1)
  }
}

start()

export default app
