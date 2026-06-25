import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Rutas de API con acceso público permitido (Agregando cabeceras CORS)
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

    const publicPaths = ['/login', '/register', '/forgot-password', '/not-authorized', '/_next', '/api', '/favicon.ico']

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
