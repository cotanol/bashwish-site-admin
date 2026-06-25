import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { agentRateLimiter, apiRateLimiter } from './libs/ratelimit'

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // EXTRACCIÓN ROBUSTA DE IP (Local y Producción)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      (req as unknown as { ip?: string }).ip ||
      '127.0.0.1'

    // --- CONTROL DE RATE LIMIT GLOBAL PARA /API ---
    if (pathname.startsWith('/api')) {
      try {
        // Si están atacando al agente de IA (Party Genie)
        if (pathname.startsWith('/api/party-genie')) {
          const { success, limit, remaining, reset } = await agentRateLimiter.limit(ip)

          if (!success) {
            return new NextResponse(
              JSON.stringify({ error: 'Demasiadas consultas al agente. Por favor, espera unos segundos.' }),
              {
                status: 429,
                headers: {
                  'Content-Type': 'application/json',
                  'X-RateLimit-Limit': limit.toString(),
                  'X-RateLimit-Remaining': remaining.toString(),
                  'X-RateLimit-Reset': reset.toString(),
                  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || '*'
                }
              }
            )
          }
        }
        // Si están usando cualquier otra API normal del sistema
        else {
          const { success, limit, remaining, reset } = await apiRateLimiter.limit(ip)

          if (!success) {
            return new NextResponse(JSON.stringify({ error: 'Has superado el límite de peticiones permitidas.' }), {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': reset.toString()
              }
            })
          }
        }
      } catch (error) {
        console.error('Error en Rate Limit:', error)
      }
    }
    // -------------------------------------------------

    // Rutas públicas generales
    const publicPaths = ['/login', '/register', '/forgot-password', '/not-authorized', '/_next', '/api', '/favicon.ico']

    // Rutas de API con acceso público permitido (Agregando tus cabeceras CORS)
    if (
      pathname.startsWith('/api/public') ||
      pathname.startsWith('/api/track-click') ||
      pathname.startsWith('/api/party-genie')
    ) {
      const response = NextResponse.next()

      const allowedOrigin = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || '*'
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

      return response
    }

    // Permitir el acceso si la ruta está en la lista pública
    if (publicPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next()
    }

    // Si no hay sesión, NextAuth redirige al login automáticamente
    if (!token) {
      return NextResponse.next()
    }

    const role = token.role as string
    const isAdminRoute = pathname.startsWith('/admin')
    const isVendorRoute = pathname.startsWith('/vendor')

    // Control estricto de roles (Admin vs Vendor)
    if (role === 'admin' && isVendorRoute) {
      return NextResponse.redirect(new URL('/not-authorized', req.url))
    }

    if (role === 'vendor' && isAdminRoute) {
      return NextResponse.redirect(new URL('/not-authorized', req.url))
    }

    // Redirección inteligente en la raíz principal
    if (pathname === '/') {
      const homeUrl = role === 'admin' ? '/admin/dashboard' : '/vendor/dashboard'
      return NextResponse.redirect(new URL(homeUrl, req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        if (
          pathname.startsWith('/api/public') ||
          pathname.startsWith('/api/track-click') ||
          pathname.startsWith('/api/party-genie')
        ) {
          return true
        }

        const publicPaths = ['/login', '/register', '/forgot-password', '/not-authorized']
        if (publicPaths.some(path => pathname.startsWith(path))) {
          return true
        }

        return !!token
      }
    }
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
