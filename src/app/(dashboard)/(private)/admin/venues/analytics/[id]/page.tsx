import { notFound } from 'next/navigation'
import Link from 'next/link'

import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

import { getVenueById } from '@/actions/venue-actions'
import { getVenueAnalytics } from '@/actions/click-analytics-actions'
import VenueAnalyticsView from '@/views/admin/venues/VenueAnalyticsView'

interface Props {
  params: Promise<{ id: string }>
}

export default async function VenueAnalyticsPage({ params }: Props) {
  const { id } = await params

  // Fetch venue
  const venue = await getVenueById(id)

  if (!venue) {
    notFound()
  }

  // Fetch analytics for this venue
  const analytics = await getVenueAnalytics(venue.id, venue.vendorId)

  // Serialize dates for client component
  const serializedAnalytics: {
    overview: typeof analytics.overview
    chartData: typeof analytics.chartData
    recentClicks: Array<Omit<typeof analytics.recentClicks[0], 'clickedAt'> & { clickedAt: string }>
  } = {
    ...analytics,
    recentClicks: analytics.recentClicks.map(click => ({
      ...click,
      clickedAt: click.clickedAt.toISOString()
    }))
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title={
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h5" className="font-bold">
                    Click Analytics: {venue.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" className="mt-1">
                    {venue.city} • Vendor: {venue.vendor?.businessName || venue.vendor?.contactName}
                  </Typography>
                </div>
                <Button
                  component={Link}
                  href="/admin/venues/list"
                  variant="outlined"
                  color="secondary"
                  startIcon={<i className="tabler-arrow-left" />}
                >
                  Back to Venues
                </Button>
              </div>
            }
          />
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <VenueAnalyticsView analytics={serializedAnalytics} venueName={venue.name} />
      </Grid>
    </Grid>
  )
}
