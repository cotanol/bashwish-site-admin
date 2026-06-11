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
import type { AdminAnalytics } from '@/actions/click-analytics-actions'

type Props = {
  data: AdminAnalytics
}

const AdminClicksDashboard = ({ data }: Props) => {
  const { overview, topVenues, topServices, clicksByType, chartData } = data

  // Calculate percentages for the pie chart visual
  const venuePercentage = overview.totalClicks > 0 ? (overview.venueClicks / overview.totalClicks) * 100 : 50
  const servicePercentage = 100 - venuePercentage

  return (
    <Grid container spacing={6}>
      {/* Header */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div>
                <Typography variant='h4' className='mb-2'>
                  📊 Salud de la Plataforma - Click Analytics
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Monitorea el engagement de venues vs services y el rendimiento general
                </Typography>
              </div>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                <i className='tabler-chart-pie text-3xl' />
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
              Todos los tiempos
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
                  Hoy
                </Typography>
                <Typography variant='h4'>{overview.clicksToday.toLocaleString()}</Typography>
              </div>
              <Avatar variant='rounded' sx={{ bgcolor: 'success.main' }}>
                <i className='tabler-calendar-today' />
              </Avatar>
            </div>
            <Typography variant='caption' color='text.secondary'>
              Últimas 24 horas
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
              <Avatar variant='rounded' sx={{ bgcolor: 'warning.main' }}>
                <i className='tabler-calendar-week' />
              </Avatar>
            </div>
            <Typography variant='caption' color='text.secondary'>
              Última semana
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
                  Últimos 30 Días
                </Typography>
                <Typography variant='h4'>{overview.clicksLast30Days.toLocaleString()}</Typography>
              </div>
              <Avatar variant='rounded' sx={{ bgcolor: 'info.main' }}>
                <i className='tabler-calendar-month' />
              </Avatar>
            </div>
            <Typography variant='caption' color='text.secondary'>
              Último mes
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Venues vs Services - Strategic Pie Chart Visual */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardHeader title='Venues vs Services' subheader='Distribución de clicks por categoría' />
          <CardContent>
            <div className='flex flex-col gap-6'>
              {/* Visual Representation */}
              <div className='flex items-center gap-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-2'>
                    <div className='w-3 h-3 rounded-full bg-primary-main' />
                    <Typography variant='body2'>Venues</Typography>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='flex-1'>
                      <LinearProgress
                        variant='determinate'
                        value={venuePercentage}
                        color='primary'
                        sx={{ height: 12, borderRadius: 1 }}
                      />
                    </div>
                    <Typography variant='body2' fontWeight={600} className='min-w-[60px]'>
                      {overview.venueClicks.toLocaleString()}
                    </Typography>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-2'>
                    <div className='w-3 h-3 rounded-full bg-success-main' />
                    <Typography variant='body2'>Services</Typography>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='flex-1'>
                      <LinearProgress
                        variant='determinate'
                        value={servicePercentage}
                        color='success'
                        sx={{ height: 12, borderRadius: 1 }}
                      />
                    </div>
                    <Typography variant='body2' fontWeight={600} className='min-w-[60px]'>
                      {overview.serviceClicks.toLocaleString()}
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Percentages */}
              <div className='flex items-center justify-around pt-4 border-t'>
                <div className='text-center'>
                  <Typography variant='h5' color='primary'>
                    {Math.round(venuePercentage)}%
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Venues
                  </Typography>
                </div>
                <div className='text-center'>
                  <Typography variant='h5' color='success.main'>
                    {Math.round(servicePercentage)}%
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Services
                  </Typography>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Activity Chart - Last 7 Days */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardHeader title='Actividad - Últimos 7 Días' />
          <CardContent>
            <div className='flex flex-col gap-4'>
              {chartData.map((day, index) => {
                const maxTotal = Math.max(...chartData.map(d => d.total), 1)
                const venuePercent = (day.venueClicks / maxTotal) * 100
                const servicePercent = (day.serviceClicks / maxTotal) * 100

                return (
                  <div key={index} className='flex items-center gap-4'>
                    <Typography variant='body2' className='min-w-[80px]' fontWeight={500}>
                      {day.day}
                    </Typography>
                    <div className='flex-1 flex gap-2'>
                      <div className='flex-1'>
                        <div className='flex items-center justify-between mb-1'>
                          <Typography variant='caption' color='primary'>
                            Venues: {day.venueClicks}
                          </Typography>
                        </div>
                        <LinearProgress
                          variant='determinate'
                          value={venuePercent}
                          color='primary'
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-center justify-between mb-1'>
                          <Typography variant='caption' color='success.main'>
                            Services: {day.serviceClicks}
                          </Typography>
                        </div>
                        <LinearProgress
                          variant='determinate'
                          value={servicePercent}
                          color='success'
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                      </div>
                    </div>
                    <Typography variant='body2' fontWeight={600} className='min-w-[40px] text-right'>
                      {day.total}
                    </Typography>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Top 10 Venues */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title='🏆 Top 10 Venues' subheader='Venues with most clicks generated' />
          <CardContent>
            {topVenues.length === 0 ? (
              <div className='text-center py-8'>
                <Typography variant='body2' color='text.secondary'>
                  No data yet
                </Typography>
              </div>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell width={50}>#</TableCell>
                      <TableCell>Venue</TableCell>
                      <TableCell>Vendor</TableCell>
                      <TableCell align='right'>Clicks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topVenues.map((venue, index) => (
                      <TableRow key={venue.id}>
                        <TableCell>
                          <Avatar
                            variant='rounded'
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: index < 3 ? 'warning.main' : 'primary.main'
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' fontWeight={500}>
                            {venue.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='caption' color='text.secondary'>
                            {venue.vendorName}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Chip label={venue.clicks} color='primary' variant='tonal' size='small' />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Top 10 Services */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title='🌟 Top 10 Services' subheader='Services with most clicks generated' />
          <CardContent>
            {topServices.length === 0 ? (
              <div className='text-center py-8'>
                <Typography variant='body2' color='text.secondary'>
                  No data yet
                </Typography>
              </div>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell width={50}>#</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell align='right'>Clicks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topServices.map((service, index) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <Avatar
                            variant='rounded'
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: index < 3 ? 'success.main' : 'info.main'
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' fontWeight={500}>
                            {service.name}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Chip label={service.clicks} color='success' variant='tonal' size='small' />
                        </TableCell>
                      </TableRow>
                    ))}
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

export default AdminClicksDashboard
