'use client'

import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import LinearProgress from '@mui/material/LinearProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import type { VendorAnalytics } from '@/actions/click-analytics-actions'

type Props = {
  data: VendorAnalytics
}

const VendorClicksDashboard = ({ data }: Props) => {
  const { overview, venuePerformance, recentClicks, chartData } = data

  // Determine trend color
  const trendColor = overview.percentageChange >= 0 ? 'success.main' : 'error.main'
  const trendIcon = overview.percentageChange >= 0 ? 'tabler-trending-up' : 'tabler-trending-down'

  return (
    <Grid container spacing={6}>
      {/* Header Card */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div>
                <Typography variant='h4' className='mb-2'>
                  🎯 Tu ROI: Clientes que te hemos enviado
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Monitorea los leads que la plataforma está generando para tus venues
                </Typography>
              </div>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                <i className='tabler-users text-3xl' />
              </Avatar>
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Stats Cards */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <div className='flex items-start justify-between mb-2'>
              <div>
                <Typography variant='body2' color='text.secondary' className='mb-1'>
                  Total Clicks
                </Typography>
                <Typography variant='h4'>{overview.totalClicks.toLocaleString()}</Typography>
              </div>
              <Avatar variant='rounded' sx={{ bgcolor: 'primary.main' }}>
                <i className='tabler-click' />
              </Avatar>
            </div>
            <Typography variant='caption' color='text.secondary'>
              Desde el inicio
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <div className='flex items-start justify-between mb-2'>
              <div>
                <Typography variant='body2' color='text.secondary' className='mb-1'>
                  Últimos 7 Días
                </Typography>
                <Typography variant='h4'>{overview.clicksLast7Days.toLocaleString()}</Typography>
              </div>
              <Avatar variant='rounded' sx={{ bgcolor: 'success.main' }}>
                <i className='tabler-calendar-week' />
              </Avatar>
            </div>
            <div className='flex items-center gap-1'>
              <i className={`${trendIcon} text-sm`} style={{ color: trendColor }} />
              <Typography variant='caption' sx={{ color: trendColor }}>
                {Math.abs(overview.percentageChange)}% vs semana anterior
              </Typography>
            </div>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <div className='flex items-start justify-between mb-2'>
              <div>
                <Typography variant='body2' color='text.secondary' className='mb-1'>
                  Últimos 30 Días
                </Typography>
                <Typography variant='h4'>{overview.clicksLast30Days.toLocaleString()}</Typography>
              </div>
              <Avatar variant='rounded' sx={{ bgcolor: 'warning.main' }}>
                <i className='tabler-calendar-month' />
              </Avatar>
            </div>
            <Typography variant='caption' color='text.secondary'>
              Último mes
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <div className='flex items-start justify-between mb-2'>
              <div>
                <Typography variant='body2' color='text.secondary' className='mb-1'>
                  Promedio Diario
                </Typography>
                <Typography variant='h4'>
                  {overview.clicksLast7Days > 0 ? Math.round(overview.clicksLast7Days / 7) : 0}
                </Typography>
              </div>
              <Avatar variant='rounded' sx={{ bgcolor: 'info.main' }}>
                <i className='tabler-chart-line' />
              </Avatar>
            </div>
            <Typography variant='caption' color='text.secondary'>
              Últimos 7 días
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Chart - Last 7 Days Activity */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardHeader title='Actividad de Clicks - Últimos 7 Días' />
          <CardContent>
            <div className='flex flex-col gap-4'>
              {chartData.map((day, index) => {
                const maxClicks = Math.max(...chartData.map(d => d.clicks), 1)
                const percentage = (day.clicks / maxClicks) * 100

                return (
                  <div key={index} className='flex items-center gap-4'>
                    <Typography variant='body2' className='min-w-[60px]' fontWeight={500}>
                      {day.day}
                    </Typography>
                    <div className='flex-1'>
                      <div className='flex items-center justify-between mb-1'>
                        <Typography variant='caption' color='primary'>
                          {day.clicks} clicks
                        </Typography>
                      </div>
                      <LinearProgress
                        variant='determinate'
                        value={percentage}
                        color='primary'
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Clicks Timeline */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardHeader title='Actividad Reciente' />
          <CardContent>
            <div className='flex flex-col gap-3'>
              {recentClicks.length === 0 ? (
                <div className='text-center py-8'>
                  <Typography variant='body2' color='text.secondary'>
                    No hay clicks recientes
                  </Typography>
                </div>
              ) : (
                recentClicks.map((click, index) => (
                  <div key={index} className='flex items-center gap-3'>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      <i className='tabler-click text-sm' />
                    </Avatar>
                    <div className='flex-1 min-w-0'>
                      <Typography variant='body2' className='line-clamp-1'>
                        {click.venueName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {new Date(click.clickedAt).toLocaleString('es-MX', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Venue Performance Table */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title='Rendimiento de tus Venues'
            subheader='Tus venues ordenados por número de clicks generados'
          />
          <CardContent>
            {venuePerformance.length === 0 ? (
              <div className='text-center py-8'>
                <i className='tabler-building-store text-6xl text-textSecondary mb-4' />
                <Typography variant='h6' className='mb-2'>
                  No data yet
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Los clicks comenzarán a aparecer cuando los usuarios visiten tus venues desde la plataforma
                </Typography>
              </div>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Posición</TableCell>
                      <TableCell>Venue</TableCell>
                      <TableCell align='center'>Total Clicks</TableCell>
                      <TableCell align='center'>Rendimiento</TableCell>
                      <TableCell>Último Click</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {venuePerformance.map((venue, index) => {
                      const maxClicks = Math.max(...venuePerformance.map(v => v.clicks), 1)
                      const performance = (venue.clicks / maxClicks) * 100

                      return (
                        <TableRow key={venue.venueId}>
                          <TableCell>
                            <Avatar
                              variant='rounded'
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: index === 0 ? 'warning.main' : 'primary.main'
                              }}
                            >
                              {index === 0 ? '🏆' : index + 1}
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' fontWeight={500}>
                              {venue.venueName}
                            </Typography>
                          </TableCell>
                          <TableCell align='center'>
                            <Chip label={venue.clicks} color='primary' variant='tonal' size='small' />
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <LinearProgress
                                variant='determinate'
                                value={performance}
                                color='primary'
                                sx={{ width: '100%', height: 6, borderRadius: 1 }}
                              />
                              <Typography variant='caption' color='text.secondary' className='min-w-[40px]'>
                                {Math.round(performance)}%
                              </Typography>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Typography variant='caption' color='text.secondary'>
                              {venue.lastClick
                                ? new Date(venue.lastClick).toLocaleString('es-MX', {
                                    dateStyle: 'short',
                                    timeStyle: 'short'
                                  })
                                : 'Nunca'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default VendorClicksDashboard
