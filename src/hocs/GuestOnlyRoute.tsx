// Next Imports
import { redirect } from 'next/navigation'

// Third-party Imports
import { getServerSession } from 'next-auth'

// Type Imports
import type { ChildrenType } from '@core/types'

// Auth Imports
import { authOptions } from '@/libs/auth'

const GuestOnlyRoute = async ({ children }: ChildrenType) => {
  const session = await getServerSession(authOptions)

  if (session) {
    // Redirect based on user role
    const homeUrl = session.user.role === 'admin' ? '/admin/dashboard' : '/vendor/dashboard'

    redirect(homeUrl)
  }

  return <>{children}</>
}

export default GuestOnlyRoute
