'use client'

import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'

// Import Vuexy components
import CardStatsHorizontalWithAvatar from '@components/card-statistics/HorizontalWithAvatar'
import EarningReports from '@views/dashboards/analytics/EarningReports'
import SalesOverview from '@views/dashboards/analytics/SalesOverview'

type VenueStats = {
  total: number
  published: number
  pending: number
  featured: number
}

type VendorInfo = {
  id: string
  businessName: string
  contactEmail: string
  status: string
}

type ClickAnalytics = {
  totalClicks: number
  clicksThisWeek: number
  clicksThisMonth: number
  venueClicks: number
  serviceClicks: number
  weekOverWeekGrowth: number
  clicksByDay: Array<{ day: string; clicks: number }>
}

type Props = {
  venueStats: VenueStats
  vendors: VendorInfo[]
  clickAnalytics?: ClickAnalytics
}

const BashwishDashboard = ({ venueStats, vendors, clickAnalytics }: Props) => {
  // Statistics cards data
  const statsCardsData = [
    {
      title: 'Total Venues',
      stats: venueStats.total.toString(),
      avatarIcon: 'tabler-building',
      avatarColor: 'primary' as const,
      subtitle: 'All venues',
      trend: 'positive' as const,
      trendNumber: `${venueStats.published} live`
    },
    {
      title: 'Total Clicks',
      stats: clickAnalytics?.totalClicks.toString() || '0',
      avatarIcon: 'tabler-click',
      avatarColor: 'success' as const,
      subtitle: 'All time',
      trend: clickAnalytics && clickAnalytics.weekOverWeekGrowth > 0 ? ('positive' as const) : ('neutral' as const),
      trendNumber: `${clickAnalytics?.weekOverWeekGrowth || 0}%`
    },
    {
      title: 'Active Vendors',
      stats: vendors.filter(v => v.status === 'verified').length.toString(),
      avatarIcon: 'tabler-users',
      avatarColor: 'info' as const,
      subtitle: 'Verified vendors',
      trend: 'neutral' as const
    },
    {
      title: 'Pending Review',
      stats: venueStats.pending.toString(),
      avatarIcon: 'tabler-clock',
      avatarColor: 'warning' as const,
      subtitle: 'Need attention',
      trend: 'neutral' as const
    }
  ]

  // Prepare data for EarningReports (Weekly Activity Chart)
  const earningReportsData = {
    chartData: {
      searchesByDay: clickAnalytics?.clicksByDay.map(d => ({
        day: d.day,
        searches: d.clicks,
        clicks: d.clicks
      })) || []
    },
    overview: {
      totalSearches: clickAnalytics?.totalClicks || 0,
      totalClicks: clickAnalytics?.totalClicks || 0,
      totalEmailCaptures: 0,
      conversions: clickAnalytics?.venueClicks || 0,
      weeklyGrowth: clickAnalytics?.weekOverWeekGrowth || 0
    }
  }

  // Prepare data for Sales Overview (Venue Distribution)
  const salesOverviewData = [
    { value: venueStats.published, label: 'Published', color: 'success' },
    { value: venueStats.pending, label: 'Pending', color: 'warning' },
    { value: venueStats.featured, label: 'Featured', color: 'primary' },
    { value: venueStats.total - venueStats.published - venueStats.pending, label: 'Draft', color: 'secondary' }
  ]

  return (
    <Grid container spacing={6}>
      {/* Welcome Card */}
      <Grid size={{ xs: 12 }}>
        <Card className='bg-gradient-to-r from-primary-500 to-primary-600'>
          <CardContent className='text-white'>
            <Typography variant='h4' className='mb-2'>
              Welcome to BashWish Admin Dashboard 🎉
            </Typography>
            <Typography variant='body1' className='opacity-90'>
              Manage venues, vendors, and track platform analytics
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Stats Cards - Using Vuexy styled components */}
      {statsCardsData.map((item, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
          <CardStatsHorizontalWithAvatar {...item} avatarSkin='light' />
        </Grid>
      ))}

      {/* Weekly Activity Chart - Using Vuexy EarningReports */}
      <Grid size={{ xs: 12, md: 8 }}>
        <EarningReports data={earningReportsData} />
      </Grid>

      {/* Venue Status Distribution */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardHeader title='Venue Distribution' />
          <CardContent>
            <div className='space-y-4'>
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <Typography variant='body2'>Published</Typography>
                  <Typography variant='body2' fontWeight='bold'>
                    {venueStats.published}
                  </Typography>
                </div>
                <LinearProgress
                  variant='determinate'
                  value={(venueStats.published / venueStats.total) * 100 || 0}
                  color='success'
                  className='h-2 rounded'
                />
              </div>

              <div>
                <div className='flex items-center justify-between mb-2'>
                  <Typography variant='body2'>Pending Review</Typography>
                  <Typography variant='body2' fontWeight='bold'>
                    {venueStats.pending}
                  </Typography>
                </div>
                <LinearProgress
                  variant='determinate'
                  value={(venueStats.pending / venueStats.total) * 100 || 0}
                  color='warning'
                  className='h-2 rounded'
                />
              </div>

              <div>
                <div className='flex items-center justify-between mb-2'>
                  <Typography variant='body2'>Featured</Typography>
                  <Typography variant='body2' fontWeight='bold'>
                    {venueStats.featured}
                  </Typography>
                </div>
                <LinearProgress
                  variant='determinate'
                  value={(venueStats.featured / venueStats.total) * 100 || 0}
                  color='primary'
                  className='h-2 rounded'
                />
              </div>

              <div className='pt-4 border-t'>
                <Typography variant='caption' color='text.secondary'>
                  Total Venues: {venueStats.total}
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Click Analytics Breakdown */}
      {clickAnalytics && (
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader title='Click Analytics' subheader='Traffic breakdown by type' />
            <CardContent>
              <Grid container spacing={4}>
                <Grid size={{ xs: 6 }}>
                  <div className='text-center p-4 bg-success-100 rounded-lg'>
                    <i className='tabler-building text-success text-4xl mb-2 block' />
                    <Typography variant='h4' className='mb-1'>
                      {clickAnalytics.venueClicks}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Venue Clicks
                    </Typography>
                  </div>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <div className='text-center p-4 bg-info-100 rounded-lg'>
                    <i className='tabler-briefcase text-info text-4xl mb-2 block' />
                    <Typography variant='h4' className='mb-1'>
                      {clickAnalytics.serviceClicks}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Service Clicks
                    </Typography>
                  </div>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <div className='mt-4 p-4 bg-primary-50 rounded-lg'>
                    <Typography variant='body2' className='mb-2'>
                      <strong>This Week:</strong> {clickAnalytics.clicksThisWeek} clicks
                    </Typography>
                    <Typography variant='body2'>
                      <strong>This Month:</strong> {clickAnalytics.clicksThisMonth} clicks
                    </Typography>
                  </div>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Recent Vendors */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title='Recent Vendors' subheader={`${vendors.length} total vendors`} />
          <CardContent>
            {vendors.length === 0 ? (
              <div className='text-center py-8'>
                <i className='tabler-users text-6xl text-textDisabled mb-4 block' />
                <Typography variant='body2' color='text.secondary'>
                  No vendors yet
                </Typography>
              </div>
            ) : (
              <div className='space-y-4'>
                {vendors.slice(0, 5).map(vendor => (
                  <div key={vendor.id} className='flex items-center justify-between p-3 rounded-lg hover:bg-gray-50'>
                    <div>
                      <Typography variant='body1' fontWeight='medium'>
                        {vendor.businessName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {vendor.contactEmail}
                      </Typography>
                    </div>
                    <Chip
                      label={vendor.status === 'verified' ? 'Verified' : 'Pending'}
                      color={vendor.status === 'verified' ? 'success' : 'warning'}
                      size='small'
                      variant='tonal'
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Actions */}
      {venueStats.pending > 0 && (
        <Grid size={{ xs: 12 }}>
          <Card className='bg-warning-100'>
            <CardContent className='flex items-center justify-between'>
              <div>
                <Typography variant='h6' className='mb-1'>
                  ⚠️ Venues Pending Review
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {venueStats.pending} venue{venueStats.pending !== 1 ? 's' : ''} waiting for approval
                </Typography>
              </div>
              <Chip label='Review Now' color='warning' />
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  )
}

export default BashwishDashboard
