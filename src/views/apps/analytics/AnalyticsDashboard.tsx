'use client'

import { useMemo } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import LinearProgress from '@mui/material/LinearProgress'
import type { AnalyticsDashboardData } from '@/actions/analytics-actions'

type Props = {
  data: AnalyticsDashboardData
}

const AnalyticsDashboard = ({ data }: Props) => {
  const { overview, chartData, themes, cities, recentActivity } = data

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Searches',
      value: overview.totalSearches,
      icon: 'tabler-search',
      color: 'primary' as const,
      trend: overview.weeklyGrowth > 0 ? 'up' : 'down',
      trendValue: `${Math.abs(overview.weeklyGrowth)}%`
    },
    {
      title: 'Total Clicks',
      value: overview.totalClicks,
      icon: 'tabler-click',
      color: 'success' as const
    },
    {
      title: 'Conversiones',
      value: overview.conversions,
      icon: 'tabler-check',
      color: 'warning' as const,
      subtitle: `${overview.conversionRate}% tasa de conversión`
    },
    {
      title: 'Email Captures',
      value: overview.totalEmailCaptures,
      icon: 'tabler-mail',
      color: 'info' as const,
      subtitle: `${overview.marketingOptIns} opt-ins`
    },
    {
      title: 'Venues Activos',
      value: overview.activeVenues,
      icon: 'tabler-building',
      color: 'primary' as const,
      subtitle: `${overview.totalVenues} totales`
    },
    {
      title: 'Venues Featured',
      value: overview.featuredVenues,
      icon: 'tabler-star',
      color: 'warning' as const
    },
    {
      title: 'Reviews',
      value: overview.totalReviews,
      icon: 'tabler-message',
      color: 'success' as const,
      subtitle: `${overview.averageRating}★ promedio`
    },
    {
      title: 'Searches This Month',
      value: chartData.monthlySearches,
      icon: 'tabler-calendar',
      color: 'info' as const
    }
  ]

  return (
    <Grid container spacing={6}>
      {/* Stats Cards */}
      {statsCards.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent className='flex flex-col gap-2'>
              <div className='flex items-start justify-between'>
                <div className='flex flex-col gap-1'>
                  <Typography variant='h4'>{stat.value.toLocaleString()}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {stat.title}
                  </Typography>
                  {stat.subtitle && (
                    <Typography variant='caption' color='text.secondary'>
                      {stat.subtitle}
                    </Typography>
                  )}
                </div>
                <Avatar variant='rounded' sx={{ bgcolor: `var(--mui-palette-${stat.color}-main)` }}>
                  <i className={stat.icon} />
                </Avatar>
              </div>
              {stat.trend && (
                <div className='flex items-center gap-1'>
                  <i
                    className={`${stat.trend === 'up' ? 'tabler-trending-up text-success' : 'tabler-trending-down text-error'}`}
                  />
                  <Typography variant='body2' color={stat.trend === 'up' ? 'success.main' : 'error.main'}>
                    {stat.trendValue} vs última semana
                  </Typography>
                </div>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Searches Chart - Last 7 Days */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title='Searches and Clicks - Last 7 Days' />
          <CardContent>
            <div className='flex flex-col gap-4'>
              {chartData.searchesByDay.map((day: { day: string; searches: number; clicks: number }, index: number) => (
                <div key={index} className='flex flex-col gap-2'>
                  <div className='flex items-center justify-between'>
                    <Typography variant='body2' className='min-w-[60px]'>
                      {day.day}
                    </Typography>
                    <div className='flex-1 flex gap-2 items-center'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <Typography variant='caption' color='primary'>
                            Searches: {day.searches}
                          </Typography>
                        </div>
                        <LinearProgress
                          variant='determinate'
                          value={
                            (day.searches /
                              Math.max(...chartData.searchesByDay.map((d: { searches: number }) => d.searches))) *
                            100
                          }
                          color='primary'
                        />
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <Typography variant='caption' color='success.main'>
                            Clicks: {day.clicks}
                          </Typography>
                        </div>
                        <LinearProgress
                          variant='determinate'
                          value={
                            (day.clicks /
                              Math.max(...chartData.searchesByDay.map((d: { clicks: number }) => d.clicks))) *
                            100
                          }
                          color='success'
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Themes */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title='Top Temas/Categorías' />
          <CardContent>
            <div className='flex flex-col gap-3'>
              {themes.map((theme, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {theme.icon ? theme.icon : <i className='tabler-star' />}
                    </Avatar>
                    <div>
                      <Typography variant='body2'>{theme.name}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {theme.venueCount} venues
                      </Typography>
                    </div>
                  </div>
                  <Chip label={theme.popularity} size='small' color='primary' variant='tonal' />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Cities */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title='Top Ciudades' />
          <CardContent>
            <div className='flex flex-col gap-3'>
              {cities.map((city, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Avatar variant='rounded' sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {index + 1}
                    </Avatar>
                    <Typography variant='body2'>{city.city}</Typography>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Typography variant='body2' fontWeight={600}>
                      {city.count}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      venues
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Activity */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title='Actividad Reciente' />
          <CardContent>
            <div className='flex flex-col gap-3'>
              <div className='flex items-center gap-3'>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <i className='tabler-search' />
                </Avatar>
                <div className='flex-1'>
                  <Typography variant='body2'>Last Search</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {new Date(recentActivity.lastSearch).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </Typography>
                </div>
              </div>
              <div className='flex items-center gap-3'>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <i className='tabler-click' />
                </Avatar>
                <div className='flex-1'>
                  <Typography variant='body2'>Último Click</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {new Date(recentActivity.lastClick).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </Typography>
                </div>
              </div>
              <div className='flex items-center gap-3'>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <i className='tabler-message' />
                </Avatar>
                <div className='flex-1'>
                  <Typography variant='body2'>Última Review</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {new Date(recentActivity.lastReview).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </Typography>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default AnalyticsDashboard
