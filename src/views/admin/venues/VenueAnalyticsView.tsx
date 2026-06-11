'use client'

import { useMemo } from 'react'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { useTheme } from '@mui/material/styles'

import HorizontalWithSubtitle from '@/components/card-statistics/HorizontalWithSubtitle'
import type { VenueAnalyticsDetail } from '@/actions/click-analytics-actions'

type Props = {
  analytics: {
    overview: VenueAnalyticsDetail['overview']
    chartData: VenueAnalyticsDetail['chartData']
    recentClicks: Array<Omit<VenueAnalyticsDetail['recentClicks'][0], 'clickedAt'> & { clickedAt: string }>
  }
  venueName: string
}

export default function VenueAnalyticsView({ analytics, venueName }: Props) {
  const theme = useTheme()
  const { overview, chartData, recentClicks } = analytics

  // Serialize chart data
  const serializedChartData = useMemo(
    () =>
      chartData.map(item => ({
        day: item.day,
        clicks: item.clicks
      })),
    [chartData]
  )

  return (
    <Grid container spacing={6}>
      {/* Overview Cards */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <HorizontalWithSubtitle
          title="Total Clicks"
          subtitle="All time"
          stats={overview.totalClicks.toString()}
          avatarIcon="tabler-mouse"
          avatarColor="primary"
          trend={overview.percentageChange >= 0 ? 'positive' : 'negative'}
          trendNumber={`${Math.abs(overview.percentageChange)}%`}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <HorizontalWithSubtitle
          title="Today"
          subtitle={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          stats={overview.clicksToday.toString()}
          avatarIcon="tabler-clock"
          avatarColor="success"
          trend="neutral"
          trendNumber=""
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <HorizontalWithSubtitle
          title="Last 7 Days"
          subtitle="Recent week"
          stats={overview.clicksLast7Days.toString()}
          avatarIcon="tabler-calendar-week"
          avatarColor="warning"
          trend="neutral"
          trendNumber=""
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <HorizontalWithSubtitle
          title="Last 30 Days"
          subtitle="Recent month"
          stats={overview.clicksLast30Days.toString()}
          avatarIcon="tabler-calendar-month"
          avatarColor="info"
          trend="neutral"
          trendNumber=""
        />
      </Grid>

      {/* Chart */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title="Click Trends"
            subheader="Last 7 days activity"
            action={
              <Chip
                label={`${overview.percentageChange >= 0 ? '+' : ''}${overview.percentageChange}% vs prev week`}
                color={overview.percentageChange >= 0 ? 'success' : 'error'}
                variant="tonal"
                size="small"
              />
            }
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={serializedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke={theme.palette.primary.main}
                  fillOpacity={1}
                  fill="url(#colorClicks)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Clicks Table */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title="Recent Clicks" subheader={`Latest activity for ${venueName}`} />
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider">
                    <th className="text-left p-3 font-semibold">Date & Time</th>
                    <th className="text-left p-3 font-semibold">Type</th>
                    <th className="text-left p-3 font-semibold">Click ID</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClicks.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center p-6">
                        <Typography variant="body2" color="text.secondary">
                          No clicks recorded yet
                        </Typography>
                      </td>
                    </tr>
                  ) : (
                    recentClicks.map(click => (
                      <tr key={click.id} className="border-b border-divider hover:bg-actionHover">
                        <td className="p-3">
                          <Typography variant="body2">
                            {new Date(click.clickedAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        </td>
                        <td className="p-3">
                          <Chip
                            label={click.targetType}
                            size="small"
                            variant="tonal"
                            color="primary"
                          />
                        </td>
                        <td className="p-3">
                          <Typography variant="body2" className="font-mono text-xs">
                            {click.id}
                          </Typography>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
