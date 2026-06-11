'use client'

import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import LinearProgress from '@mui/material/LinearProgress'
import { useTheme } from '@mui/material/styles'
import type { ApexOptions } from 'apexcharts'
import classnames from 'classnames'
import { format } from 'date-fns'
import type { VendorWithRelations } from '@/actions/vendor-actions'
import type { Venue } from '@prisma/client'
import type { VendorAnalytics } from '@/actions/click-analytics-actions'

// Import Vuexy components
import CardStatsHorizontalWithAvatar from '@components/card-statistics/HorizontalWithAvatar'
import CustomAvatar from '@core/components/mui/Avatar'
import OptionMenu from '@core/components/option-menu'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

// Serialized venue type for this specific component (no vendor field needed)
type VenueWithDetails = Omit<Venue, 'startingPrice' | 'latitude' | 'longitude' | 'createdAt' | 'updatedAt'> & {
  startingPrice: number | null
  latitude: number | null
  longitude: number | null
  createdAt: Date
  updatedAt: Date
  images: Array<{ id: string; url: string; isPrimary: boolean; [key: string]: any }>
  packages: Array<{ id: string; name: string; price: number }>
  _count: { reviews: number; packages: number }
}

// Serialized version of VendorAnalytics with Date strings
type SerializedVendorAnalytics = Omit<VendorAnalytics, 'venuePerformance' | 'recentClicks'> & {
  venuePerformance: Array<Omit<VendorAnalytics['venuePerformance'][0], 'lastClick'> & { lastClick: string | null }>
  recentClicks: Array<Omit<VendorAnalytics['recentClicks'][0], 'clickedAt'> & { clickedAt: string }>
}

type Props = {
  vendor: VendorWithRelations
  venues: VenueWithDetails[]
  stats: {
    totalVenues: number
    draftVenues: number
    pendingVenues: number
    publishedVenues: number
    suspendedVenues: number
  }
  analytics: SerializedVendorAnalytics
}

const statusColors: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  draft: 'default',
  pending_review: 'warning',
  published: 'success',
  suspended: 'error'
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  published: 'Published',
  suspended: 'Suspended'
}

const VendorDashboard = ({ vendor, venues, stats, analytics }: Props) => {
  const router = useRouter()
  const theme = useTheme()

  // Extract analytics data
  const { overview, venuePerformance, recentClicks, chartData } = analytics

  // Prepare chart options for Click Trends (Last 7 Days)
  const clickTrendsSeries = [{ name: 'Clicks', data: chartData.map(d => d.clicks) }]

  const primaryColorWithOpacity = 'var(--mui-palette-primary-lightOpacity)'

  const clickTrendsOptions: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: value => `${value} clicks`
      }
    },
    grid: {
      show: false,
      padding: {
        top: -31,
        left: 0,
        right: 0,
        bottom: -9
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        distributed: true,
        columnWidth: '50%'
      }
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: chartData.map((_, index) =>
      index === chartData.length - 1 ? 'var(--mui-palette-primary-main)' : primaryColorWithOpacity
    ),
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    xaxis: {
      categories: chartData.map(d => d.day.slice(0, 3)),
      axisTicks: { show: false },
      axisBorder: { show: false },
      labels: {
        style: {
          fontSize: '13px',
          colors: 'var(--mui-palette-text-disabled)'
        }
      }
    },
    yaxis: { show: false }
  }

  // Statistics cards data with real analytics
  const statsCardsData = [
    {
      title: 'Total Clicks',
      stats: overview.totalClicks.toString(),
      avatarIcon: 'tabler-click',
      avatarColor: 'primary' as const,
      subtitle: 'All time performance',
      trend: overview.percentageChange >= 0 ? ('positive' as const) : ('negative' as const),
      trendNumber: `${overview.percentageChange >= 0 ? '+' : ''}${overview.percentageChange.toFixed(1)}%`
    },
    {
      title: 'Last 7 Days',
      stats: overview.clicksLast7Days.toString(),
      avatarIcon: 'tabler-calendar-week',
      avatarColor: 'success' as const,
      subtitle: 'This week',
      trend: 'positive' as const,
      trendNumber: 'vs last week'
    },
    {
      title: 'Last 30 Days',
      stats: overview.clicksLast30Days.toString(),
      avatarIcon: 'tabler-calendar-month',
      avatarColor: 'info' as const,
      subtitle: 'This month',
      trend: 'neutral' as const
    },
    {
      title: 'Published Venues',
      stats: stats.publishedVenues.toString(),
      avatarIcon: 'tabler-building-store',
      avatarColor: 'warning' as const,
      subtitle: 'Live on platform',
      trend: 'neutral' as const
    }
  ]

  // Calculate top performing venue
  const topVenue = venuePerformance[0] || null
  const avgClicksPerVenue = stats.publishedVenues > 0 ? overview.totalClicks / stats.publishedVenues : 0

  return (
    <Grid container spacing={6}>
      {/* Welcome Card */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent className='flex items-center justify-between'>
            <div>
              <Typography variant='h4' className='mb-1'>
                Welcome back, {vendor.businessName || vendor.contactName}! 🎉
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Your venues received <strong>{overview.clicksLast7Days} clicks</strong> in the last 7 days
                {overview.percentageChange > 0 && (
                  <span className='text-success'> ({overview.percentageChange.toFixed(1)}% increase!)</span>
                )}
              </Typography>
            </div>
            <Button variant='contained' onClick={() => router.push('/vendor/venues/create')}>
              Create New Venue
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Stats Cards - Performance Metrics */}
      {statsCardsData.map((item, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
          <CardStatsHorizontalWithAvatar {...item} avatarSkin='light' />
        </Grid>
      ))}

      {/* Click Performance Chart - Professional Analytics */}
      <Grid size={{ xs: 12, lg: 8 }}>
        <Card>
          <CardHeader
            title='Click Performance'
            subheader='Last 7 Days Activity'
            action={<OptionMenu options={['Last Week', 'Last Month', 'Last Year']} />}
            className='pbe-0'
          />
          <CardContent className='flex flex-col gap-5'>
            <div className='flex flex-col sm:flex-row items-center justify-between gap-8'>
              <div className='flex flex-col gap-3 is-full sm:is-[unset]'>
                <div className='flex items-center gap-2.5'>
                  <Typography variant='h2'>{overview.clicksLast7Days}</Typography>
                  <Chip
                    size='small'
                    variant='tonal'
                    color={overview.percentageChange >= 0 ? 'success' : 'error'}
                    label={`${overview.percentageChange >= 0 ? '+' : ''}${overview.percentageChange.toFixed(1)}%`}
                  />
                </div>
                <Typography variant='body2' className='text-balance'>
                  Clicks this week vs previous week
                </Typography>
              </div>
              <AppReactApexCharts
                type='bar'
                height={163}
                width='100%'
                series={clickTrendsSeries}
                options={clickTrendsOptions}
              />
            </div>

            {/* Metrics Summary */}
            <div className='flex flex-col sm:flex-row gap-6 p-5 border rounded'>
              <div className='flex flex-col gap-2 is-full'>
                <div className='flex items-center gap-2'>
                  <CustomAvatar skin='light' variant='rounded' color='primary' size={26}>
                    <i className='tabler-calendar-week text-lg' />
                  </CustomAvatar>
                  <Typography variant='h6' className='leading-6 font-normal'>
                    Weekly
                  </Typography>
                </div>
                <Typography variant='h4'>{overview.clicksLast7Days}</Typography>
                <LinearProgress
                  value={Math.min((overview.clicksLast7Days / overview.totalClicks) * 100, 100)}
                  variant='determinate'
                  color='primary'
                  className='max-bs-1'
                />
              </div>

              <div className='flex flex-col gap-2 is-full'>
                <div className='flex items-center gap-2'>
                  <CustomAvatar skin='light' variant='rounded' color='info' size={26}>
                    <i className='tabler-calendar-month text-lg' />
                  </CustomAvatar>
                  <Typography variant='h6' className='leading-6 font-normal'>
                    Monthly
                  </Typography>
                </div>
                <Typography variant='h4'>{overview.clicksLast30Days}</Typography>
                <LinearProgress
                  value={Math.min((overview.clicksLast30Days / overview.totalClicks) * 100, 100)}
                  variant='determinate'
                  color='info'
                  className='max-bs-1'
                />
              </div>

              <div className='flex flex-col gap-2 is-full'>
                <div className='flex items-center gap-2'>
                  <CustomAvatar skin='light' variant='rounded' color='success' size={26}>
                    <i className='tabler-chart-line text-lg' />
                  </CustomAvatar>
                  <Typography variant='h6' className='leading-6 font-normal'>
                    Total
                  </Typography>
                </div>
                <Typography variant='h4'>{overview.totalClicks}</Typography>
                <LinearProgress value={100} variant='determinate' color='success' className='max-bs-1' />
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Performing Venue Card */}
      <Grid size={{ xs: 12, lg: 4 }}>
        <Card className='bs-full'>
          <CardHeader title='Top Performing Venue' />
          <CardContent className='flex flex-col gap-6'>
            {topVenue ? (
              <>
                <div className='flex flex-col gap-2'>
                  <div className='flex items-center justify-between'>
                    <Typography variant='h5' className='font-medium'>
                      {topVenue.venueName}
                    </Typography>
                    <Chip label='#1' color='success' size='small' />
                  </div>
                  <Typography variant='body2' color='text.secondary'>
                    {topVenue.clicks} total clicks
                  </Typography>
                </div>

                <div className='flex flex-col gap-4'>
                  <div className='flex items-center justify-between'>
                    <Typography variant='body2'>Performance Score</Typography>
                    <Typography variant='body2' className='font-medium'>
                      {((topVenue.clicks / overview.totalClicks) * 100).toFixed(1)}%
                    </Typography>
                  </div>
                  <LinearProgress
                    value={(topVenue.clicks / overview.totalClicks) * 100}
                    variant='determinate'
                    color='success'
                  />
                </div>

                {topVenue.lastClick && (
                  <div className='p-4 bg-success-100 rounded'>
                    <Typography variant='caption' color='text.secondary' className='block mb-1'>
                      Last Click
                    </Typography>
                    <Typography variant='body2' className='font-medium'>
                      {format(new Date(topVenue.lastClick), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                  </div>
                )}

                <Button
                  variant='outlined'
                  fullWidth
                  onClick={() => router.push(`/vendor/venues/${topVenue.venueId}/edit`)}
                >
                  View Venue Details
                </Button>
              </>
            ) : (
              <div className='flex flex-col items-center justify-center py-8 text-center'>
                <i className='tabler-chart-line text-6xl text-textDisabled mb-4' />
                <Typography variant='h6' color='text.secondary' className='mb-2'>
                  No clicks yet
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Start promoting your venues to see performance data
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Venue Performance Table */}
      <Grid size={{ xs: 12, lg: 8 }}>
        <Card>
          <CardHeader
            title='Venue Performance'
            subheader={`Track clicks across your ${stats.publishedVenues} published venues`}
            action={
              <Button variant='outlined' onClick={() => router.push('/vendor/venues')}>
                Manage Venues
              </Button>
            }
          />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Venue Name</TableCell>
                  <TableCell align='center'>Total Clicks</TableCell>
                  <TableCell align='center'>Performance</TableCell>
                  <TableCell>Last Click</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {venuePerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      <div className='py-8'>
                        <i className='tabler-chart-line text-6xl text-textDisabled mb-4 block' />
                        <Typography variant='h6' color='text.secondary' className='mb-2'>
                          No click data yet
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          Your venues haven't received any clicks yet. Keep promoting!
                        </Typography>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  venuePerformance.map((venue, index) => {
                    const performancePercent =
                      overview.totalClicks > 0 ? (venue.clicks / overview.totalClicks) * 100 : 0

                    return (
                      <TableRow key={venue.venueId} hover>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            {index === 0 && <i className='tabler-trophy text-warning text-xl' />}
                            <div>
                              <Typography variant='body1' fontWeight='medium'>
                                {venue.venueName}
                              </Typography>
                              {index < 3 && (
                                <Typography variant='caption' color='text.secondary'>
                                  Top {index + 1} performer
                                </Typography>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={venue.clicks}
                            color={index === 0 ? 'success' : 'default'}
                            size='small'
                            variant='tonal'
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <div className='flex flex-col gap-1'>
                            <Typography variant='caption' color='text.secondary'>
                              {performancePercent.toFixed(1)}%
                            </Typography>
                            <LinearProgress
                              value={performancePercent}
                              variant='determinate'
                              color={index === 0 ? 'success' : 'primary'}
                              className='w-20'
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {venue.lastClick ? (
                            <Typography variant='body2' color='text.secondary'>
                              {format(new Date(venue.lastClick), 'MMM dd, HH:mm')}
                            </Typography>
                          ) : (
                            <Typography variant='body2' color='text.disabled'>
                              Never
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align='right'>
                          <Button
                            size='small'
                            variant='outlined'
                            onClick={() => router.push(`/vendor/venues/${venue.venueId}/edit`)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>

      {/* Recent Clicks Activity */}
      <Grid size={{ xs: 12, lg: 4 }}>
        <Card className='bs-full'>
          <CardHeader title='Recent Activity' subheader='Latest clicks on your venues' />
          <CardContent>
            {recentClicks.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-8 text-center'>
                <i className='tabler-click text-6xl text-textDisabled mb-4' />
                <Typography variant='h6' color='text.secondary' className='mb-2'>
                  No recent activity
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Click activity will appear here
                </Typography>
              </div>
            ) : (
              <div className='flex flex-col gap-4'>
                {recentClicks.map((click, index) => (
                  <div key={index} className='flex items-start gap-3 pb-4 border-b last:border-b-0 last:pb-0'>
                    <CustomAvatar skin='light' color='primary' size={38}>
                      <i className='tabler-click text-xl' />
                    </CustomAvatar>
                    <div className='flex-1'>
                      <Typography variant='body2' className='font-medium mb-1'>
                        {click.venueName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {format(new Date(click.clickedAt), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    </div>
                    <Chip label='New' size='small' color='success' variant='tonal' />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Business Insights Card */}
      <Grid size={{ xs: 12 }}>
        <Card className='bg-primary-100'>
          <CardContent>
            <Grid container spacing={4} alignItems='center'>
              <Grid size={{ xs: 12, md: 8 }}>
                <div className='flex items-start gap-4'>
                  <CustomAvatar skin='light' color='primary' size={48}>
                    <i className='tabler-bulb text-2xl' />
                  </CustomAvatar>
                  <div>
                    <Typography variant='h5' className='mb-2'>
                      💡 Why Clicks Matter for Your Business
                    </Typography>
                    <Typography variant='body2' color='text.secondary' className='mb-3'>
                      Each click represents a potential customer interested in your venue. Here's what your data shows:
                    </Typography>
                    <ul className='list-disc list-inside space-y-1 text-sm text-textSecondary'>
                      <li>
                        <strong>{overview.clicksLast7Days} clicks this week</strong> -
                        {overview.clicksLast7Days > 0
                          ? ' Your venues are getting noticed! Keep your listings updated.'
                          : ' Time to optimize your venue descriptions and photos.'}
                      </li>
                      <li>
                        <strong>Average {avgClicksPerVenue.toFixed(1)} clicks per venue</strong> -
                        {avgClicksPerVenue > 10
                          ? ' Excellent engagement! Your venues are performing well.'
                          : ' Consider adding more photos and details to improve visibility.'}
                      </li>
                      <li>
                        Being on <strong>Bashwish MVP</strong> gives you visibility to parents searching for the perfect
                        party venue. More clicks = more bookings!
                      </li>
                    </ul>
                  </div>
                </div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <div className='text-center p-6 bg-white rounded-lg'>
                  <Typography variant='h3' color='primary' className='mb-2'>
                    {overview.totalClicks}
                  </Typography>
                  <Typography variant='body1' className='font-medium mb-1'>
                    Total Opportunities
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Every click is a potential booking
                  </Typography>
                </div>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title='Your Venues'
            subheader={`Manage your ${stats.totalVenues} venue${stats.totalVenues !== 1 ? 's' : ''}`}
            action={
              <Button variant='outlined' onClick={() => router.push('/vendor/venues')}>
                View All
              </Button>
            }
          />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Packages</TableCell>
                  <TableCell>Reviews</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {venues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      <div className='py-8'>
                        <i className='tabler-building text-6xl text-textDisabled mb-4 block' />
                        <Typography variant='h6' color='text.secondary' className='mb-2'>
                          No venues yet
                        </Typography>
                        <Typography variant='body2' color='text.secondary' className='mb-4'>
                          Create your first venue to start receiving bookings!
                        </Typography>
                        <Button variant='contained' onClick={() => router.push('/vendor/venues/create')}>
                          Create Your First Venue
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  venues.slice(0, 5).map(venue => (
                    <TableRow key={venue.id} hover>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          {venue.isFeatured && <i className='tabler-star text-warning' />}
                          <Typography variant='body1' fontWeight='medium'>
                            {venue.name}
                          </Typography>
                        </div>
                      </TableCell>
                      <TableCell>{venue.city}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabels[venue.status]}
                          color={statusColors[venue.status]}
                          size='small'
                          variant='tonal'
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{venue._count.packages}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{venue._count.reviews}</Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Button
                          size='small'
                          variant='outlined'
                          onClick={() => router.push(`/vendor/venues/${venue.id}/edit`)}
                        >
                          {venue.status === 'draft' ? 'Continue' : 'Manage'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>

      {/* Quick Actions Card */}
      {stats.draftVenues > 0 && (
        <Grid size={{ xs: 12 }}>
          <Card className='bg-primary-100'>
            <CardContent className='flex items-center justify-between'>
              <div>
                <Typography variant='h6' className='mb-1'>
                  ⚡ Complete Your Drafts
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  You have {stats.draftVenues} incomplete venue{stats.draftVenues !== 1 ? 's' : ''}. Finish and submit
                  for review!
                </Typography>
              </div>
              <Button variant='contained' onClick={() => router.push('/vendor/venues')}>
                Complete Now
              </Button>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  )
}

export default VendorDashboard
