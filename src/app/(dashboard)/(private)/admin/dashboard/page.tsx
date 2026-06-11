import { getVenues } from '@/actions/venue-actions'
import { getVendors, type VendorWithRelations } from '@/actions/vendor-actions'
import { getAdminAnalytics } from '@/actions/click-analytics-actions'
import type { Venue } from '@prisma/client'
import BashwishDashboard from '@views/dashboards/crm/BashwishDashboard'

const DashboardCRM = async () => {
  // Fetch basic data (MVP Phase 1)
  // LIMIT: Only fetch first 15 venues and 10 vendors for dashboard to avoid DB overload
  const [venuesResult, vendorsResult, analytics] = await Promise.all([
    getVenues({}, 1, 15),
    getVendors(1, 10),
    getAdminAnalytics()
  ])

  // Prepare venue stats for dashboard
  const venueStats = {
    total: venuesResult.total,
    published: venuesResult.venues.filter((v: Venue) => v.status === 'published').length,
    pending: venuesResult.venues.filter((v: Venue) => v.status === 'pending_review').length,
    featured: venuesResult.venues.filter((v: Venue) => v.isFeatured).length
  }

  // Transform vendors data to match dashboard props
  const vendors = vendorsResult.vendors.map((vendor: VendorWithRelations) => ({
    id: vendor.id,
    businessName: vendor.businessName || vendor.contactName,
    contactEmail: vendor.user?.email || 'N/A',
    status: vendor.isVerified ? 'verified' : 'pending'
  }))

  // Prepare click analytics data
  const clickAnalytics = {
    totalClicks: analytics.overview.totalClicks,
    clicksThisWeek: analytics.overview.clicksLast7Days,
    clicksThisMonth: analytics.overview.clicksLast30Days,
    venueClicks: analytics.overview.venueClicks,
    serviceClicks: analytics.overview.serviceClicks,
    weekOverWeekGrowth: 0, // TODO: Add percentage change to AdminAnalytics type
    clicksByDay: analytics.chartData.map(d => ({
      day: d.day,
      clicks: d.total
    }))
  }

  return <BashwishDashboard venueStats={venueStats} vendors={vendors} clickAnalytics={clickAnalytics} />
}

export default DashboardCRM
