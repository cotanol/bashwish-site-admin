import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Public routes - anyone can access
    const publicPaths = ['/login', '/register', '/forgot-password', '/not-authorized', '/_next', '/api', '/favicon.ico']

    // Allow public API routes (for public_site)
    if (pathname.startsWith('/api/public') || pathname.startsWith('/api/track-click') || pathname.startsWith('/api/party-genie')) {
      const response = NextResponse.next()

      // Add CORS headers for public API
      const allowedOrigin = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || '*'
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

      return response
    }

    // Check if path is public
    if (publicPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next()
    }

    // If not authenticated, let NextAuth handle redirect to login
    if (!token) {
      return NextResponse.next()
    }

    const role = token.role as string

    // Role-based route protection
    const roleRoutes = {
      admin: [
        '/admin/dashboard',
        '/admin',
        '/pages/account-settings' // Shared
      ],
      vendor: [
        '/vendor',
        '/pages/account-settings' // Shared
      ]
    }

    // Check if user is trying to access a protected route
    const isAdminRoute = pathname.startsWith('/admin')
    const isVendorRoute = pathname.startsWith('/vendor')

    // Admin trying to access vendor routes
    if (role === 'admin' && isVendorRoute) {
      return NextResponse.redirect(new URL('/not-authorized', req.url))
    }

    // Vendor trying to access admin routes
    if (role === 'vendor' && isAdminRoute) {
      return NextResponse.redirect(new URL('/not-authorized', req.url))
    }

    // Root redirect based on role
    if (pathname === '/') {
      const homeUrl = role === 'admin' ? '/admin/dashboard' : '/vendor/dashboard'

      return NextResponse.redirect(new URL(homeUrl, req.url))
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      // Only run middleware if user is authenticated or trying to access protected routes
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow public API routes without auth
        if (pathname.startsWith('/api/public') || pathname.startsWith('/api/track-click') || pathname.startsWith('/api/party-genie')) {
          return true
        }

        // Allow public paths without auth
        const publicPaths = ['/login', '/register', '/forgot-password', '/not-authorized']

        if (publicPaths.some(path => pathname.startsWith(path))) {
          return true
        }

        // Require auth for all other routes
        return !!token
      }
    }
  }
)

// Configure which routes use the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
