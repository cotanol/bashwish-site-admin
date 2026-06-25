import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Conexión automática usando tus variables del .env
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

// Configuración 1: Límite general para cualquier endpoint de la /api (ej: Prisma, Auth)
export const apiRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 peticiones máximo cada 10 segundos
  analytics: true,
  prefix: '@ratelimit/api'
})

// Configuración 2: Límite estricto para el agente de IA (Party Genie)
export const agentRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(3, '15 s'), // Solo 3 consultas máximo cada 15 segundos
  analytics: true,
  prefix: '@ratelimit/agent'
})
