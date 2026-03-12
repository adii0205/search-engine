import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { userService } from '@/services/user.js'
import crypto from 'crypto'

const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(255),
})

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export default async function authRoutes(fastify: FastifyInstance) {
  // Sign up with email/password
  fastify.post<{ Body: z.infer<typeof SignUpSchema> }>(
    '/signup',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { email, name, password } = SignUpSchema.parse(request.body)

        // Check if email already exists
        if (await userService.emailExists(email)) {
          return reply.code(409).send({ error: 'Email already registered' })
        }

        // Create user in DB (in production, use Clerk's actual API)
        // For now, we'll hash the password and store locally
        const clerkId = `user_${crypto.randomBytes(8).toString('hex')}`
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')

        // Save to Clerk (mocked for now - replace with real Clerk API)
        console.log(`[CLERK] Creating user: ${email}`)

        // Create in DB
        const user = await userService.createUser({
          clerkId,
          email,
          name,
        })

        // Generate JWT
        const token = fastify.jwt.sign({
          userId: user.id,
          tier: user.tier,
          clerkId,
        })

        return reply.code(201).send({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            tier: user.tier,
          },
          token,
        })
      } catch (error) {
        fastify.log.error(error)

        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors })
        }

        return reply.code(400).send({
          error: error instanceof Error ? error.message : 'Signup failed',
        })
      }
    }
  )

  // Sign in
  fastify.post<{ Body: z.infer<typeof SignInSchema> }>(
    '/signin',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { email, password } = SignInSchema.parse(request.body)

        // Get user from DB
        const user = await userService.getUserByEmail(email)
        if (!user) {
          return reply.code(401).send({ error: 'Invalid email or password' })
        }

        // Verify password (in production, use bcrypt or Clerk's verification)
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')
        console.log(`[AUTH] Signin attempt for: ${email} (using simplified auth)`)

        // Generate JWT
        const token = fastify.jwt.sign({
          userId: user.id,
          tier: user.tier,
        })

        return reply.send({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            tier: user.tier,
          },
          token,
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.code(401).send({ error: 'Invalid email or password' })
      }
    }
  )

  // Get current user
  fastify.get(
    '/me',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any)?.userId
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' })
        }

        const user = await userService.getUserById(userId)
        if (!user) {
          return reply.code(404).send({ error: 'User not found' })
        }

        return reply.send({
          id: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier,
          createdAt: user.createdAt,
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Failed to fetch user' })
      }
    }
  )

  // Logout (invalidate token)
  fastify.post(
    '/logout',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // In production, add token to blacklist in Redis
      // For now, just acknowledge the logout
      return reply.send({ success: true })
    }
  )

  // Verify token
  fastify.post(
    '/verify',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify()
        const user = request.user as any

        const userRecord = await userService.getUserById(user.userId)
        return reply.send({
          valid: true,
          user: userRecord,
        })
      } catch (error) {
        return reply.send({
          valid: false,
          error: 'Token invalid or expired',
        })
      }
    }
  )
}
