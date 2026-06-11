/**
 * Get home page URL based on user role
 */
export const getHomePageUrl = (role?: string | null): string => {
  if (role === 'admin') {
    return '/admin/dashboard'
  }

  if (role === 'vendor') {
    return '/vendor/dashboard'
  }

  // Default fallback
  return '/admin/dashboard'
}

/**
 * Check if user has access to a specific route based on role
 */
export const canAccessRoute = (route: string, role?: string | null): boolean => {
  if (!role) return false

  const adminRoutes = ['/admin/dashboard', '/admin']
  const vendorRoutes = ['/vendor']
  const sharedRoutes = ['/pages/account-settings']

  // Check shared routes first
  if (sharedRoutes.some(r => route.startsWith(r))) {
    return true
  }

  // Check admin routes
  if (role === 'admin' && adminRoutes.some(r => route.startsWith(r))) {
    return true
  }

  // Check vendor routes
  if (role === 'vendor' && vendorRoutes.some(r => route.startsWith(r))) {
    return true
  }

  return false
}
