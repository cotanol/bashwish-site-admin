import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { getVendorByUserId, getVendorVenues } from '@/actions/vendor-actions'
import { getVendorAnalytics } from '@/actions/click-analytics-actions'
import VendorDashboard from '@views/vendor/VendorDashboard'
import { serializeVenues } from '@/utils/serializers'

const VendorDashboardPage = async () => {
  const session = await getServerSession(authOptions)

  // Verificar que es vendor
  if (!session?.user || session.user.role !== 'vendor') {
    redirect('/admin/dashboard')
  }

  // Obtener vendor y sus venues
  const vendor = await getVendorByUserId(session.user.id)

  if (!vendor) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-4'>No Vendor Account</h1>
          <p>You don't have a vendor account associated with your user.</p>
        </div>
      </div>
    )
  }

  // Get all venues for this vendor
  const venues = await getVendorVenues(session.user.id)

  // Serialize venues to plain objects (convert Decimal to number)
  const serializedVenues = serializeVenues(venues)

  // Calculate stats from venues
  const stats = {
    totalVenues: venues.length,
    draftVenues: venues.filter(v => v.status === 'draft').length,
    pendingVenues: venues.filter(v => v.status === 'pending_review').length,
    publishedVenues: venues.filter(v => v.status === 'published').length,
    suspendedVenues: venues.filter(v => v.status === 'suspended').length
  }

  // Get click analytics for this vendor
  const analytics = await getVendorAnalytics(vendor.id)

  // Serialize analytics (convert Date objects to strings for client component)
  const serializedAnalytics = {
    ...analytics,
    venuePerformance: analytics.venuePerformance.map(vp => ({
      ...vp,
      lastClick: vp.lastClick ? vp.lastClick.toISOString() : null
    })),
    recentClicks: analytics.recentClicks.map(rc => ({
      ...rc,
      clickedAt: rc.clickedAt.toISOString()
    }))
  }

  return <VendorDashboard vendor={vendor} venues={serializedVenues} stats={stats} analytics={serializedAnalytics} />
}

export default VendorDashboardPage
