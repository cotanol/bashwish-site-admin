'use client'

// React Imports
import { useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

// Third-party Imports
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

// Type Imports
import type { AdminAnalyticsData } from '@/actions/venue-actions'

interface Props {
  data: AdminAnalyticsData
}

const COLORS = ['#7367F0', '#28C76F', '#FF9F43', '#EA5455', '#00CFE8', '#9F44D3', '#FFA1A1', '#4BC0C0']

const AdminAnalyticsView = ({ data }: Props) => {
  // Prepare chart data
  const weeklyChartData = useMemo(() => {
    return data.weeklyActivity.map((day: { date: string; searches: number; clicks: number; conversions: number }) => ({
      date: new Date(day.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
      Searches: day.searches,
      Clicks: day.clicks,
      Conversiones: day.conversions
    }))
  }, [data.weeklyActivity])

  const themeChartData = useMemo(() => {
    return data.topThemes.map((theme: { name: string; count: number; percentage: number }) => ({
      name: theme.name,
      value: theme.count
    }))
  }, [data.topThemes])

  return (
    <Grid container spacing={6}>
      {/* Header Stats Cards */}
      <Grid item xs={12}>
        <Grid container spacing={6}>
          {/* Venues Stats */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent className='flex flex-col gap-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex flex-col gap-1'>
                    <Typography variant='h4'>{data.activeVenues}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Venues Activos
                    </Typography>
                  </div>
                  <div className='flex items-center justify-center w-12 h-12 rounded-full bg-primary/10'>
                    <i className='tabler-building-store text-2xl text-primary' />
                  </div>
                </div>
                <Typography variant='caption' color='text.secondary'>
                  {data.totalVenues} total • {data.featuredVenues} featured
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Searches Stats */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent className='flex flex-col gap-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex flex-col gap-1'>
                    <Typography variant='h4'>{data.totalSearches.toLocaleString()}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Total Searches
                    </Typography>
                  </div>
                  <div className='flex items-center justify-center w-12 h-12 rounded-full bg-success/10'>
                    <i className='tabler-search text-2xl text-success' />
                  </div>
                </div>
                <Typography variant='caption' color='text.secondary'>
                  User searches on platform
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Clicks Stats */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent className='flex flex-col gap-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex flex-col gap-1'>
                    <Typography variant='h4'>{data.totalClicks.toLocaleString()}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Total Clicks
                    </Typography>
                  </div>
                  <div className='flex items-center justify-center w-12 h-12 rounded-full bg-warning/10'>
                    <i className='tabler-cursor-text text-2xl text-warning' />
                  </div>
                </div>
                <Typography variant='caption' color='text.secondary'>
                  {data.totalConversions} conversiones
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Conversion Rate Stats */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent className='flex flex-col gap-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex flex-col gap-1'>
                    <Typography variant='h4'>{data.conversionRate.toFixed(1)}%</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Tasa Conversión
                    </Typography>
                  </div>
                  <div className='flex items-center justify-center w-12 h-12 rounded-full bg-error/10'>
                    <i className='tabler-trending-up text-2xl text-error' />
                  </div>
                </div>
                <Typography variant='caption' color='text.secondary'>
                  De clicks a conversiones
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Secondary Stats Row */}
      <Grid item xs={12}>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent className='flex items-center gap-4'>
                <div className='flex items-center justify-center w-12 h-12 rounded-full bg-info/10'>
                  <i className='tabler-ticket text-2xl text-info' />
                </div>
                <div className='flex flex-col'>
                  <Typography variant='h5'>{data.venuesWithOffers}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Venues con Ofertas
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent className='flex items-center gap-4'>
                <div className='flex items-center justify-center w-12 h-12 rounded-full bg-success/10'>
                  <i className='tabler-mail text-2xl text-success' />
                </div>
                <div className='flex flex-col'>
                  <Typography variant='h5'>{data.emailCaptures}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Email Captures
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent className='flex items-center gap-4'>
                <div className='flex items-center justify-center w-12 h-12 rounded-full bg-warning/10'>
                  <i className='tabler-mail-check text-2xl text-warning' />
                </div>
                <div className='flex flex-col'>
                  <Typography variant='h5'>{data.acceptsMarketing}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Acepta Marketing
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Weekly Activity Chart */}
      <Grid item xs={12} lg={8}>
        <Card>
          <CardHeader title='Actividad Semanal' subheader='Últimos 7 días' />
          <CardContent>
            <ResponsiveContainer width='100%' height={350}>
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='date' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey='Searches' fill='#7367F0' />
                <Bar dataKey='Clicks' fill='#28C76F' />
                <Bar dataKey='Conversiones' fill='#FF9F43' />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Click Type Breakdown */}
      <Grid item xs={12} lg={4}>
        <Card>
          <CardHeader title='Tipos de Click' subheader='Distribución por acción' />
          <CardContent className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <i className='tabler-world text-primary' />
                  <Typography variant='body2'>Website</Typography>
                </div>
                <Typography variant='body2' className='font-medium'>
                  {data.clickTypeBreakdown.website}
                </Typography>
              </div>
              <LinearProgress
                variant='determinate'
                value={data.totalClicks > 0 ? (data.clickTypeBreakdown.website / data.totalClicks) * 100 : 0}
                color='primary'
              />
            </div>

            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <i className='tabler-phone text-success' />
                  <Typography variant='body2'>Teléfono</Typography>
                </div>
                <Typography variant='body2' className='font-medium'>
                  {data.clickTypeBreakdown.phone}
                </Typography>
              </div>
              <LinearProgress
                variant='determinate'
                value={data.totalClicks > 0 ? (data.clickTypeBreakdown.phone / data.totalClicks) * 100 : 0}
                color='success'
              />
            </div>

            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <i className='tabler-mail text-warning' />
                  <Typography variant='body2'>Email</Typography>
                </div>
                <Typography variant='body2' className='font-medium'>
                  {data.clickTypeBreakdown.email}
                </Typography>
              </div>
              <LinearProgress
                variant='determinate'
                value={data.totalClicks > 0 ? (data.clickTypeBreakdown.email / data.totalClicks) * 100 : 0}
                color='warning'
              />
            </div>

            <div className='pt-4 mt-4 border-t'>
              <Typography variant='body2' color='text.secondary' className='text-center'>
                Total: {data.totalClicks} clicks
              </Typography>
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Themes Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title='Most Popular Themes' subheader='Top 8 categories' />
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <PieChart>
                <Pie
                  data={themeChartData}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill='#8884d8'
                  dataKey='value'
                >
                  {themeChartData.map((entry: { name: string; value: number }, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Themes List */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title='Detalle de Temas' subheader='Venues por tema' />
          <CardContent>
            <div className='flex flex-col gap-3'>
              {data.topThemes.map((theme: { name: string; count: number; percentage: number }, index: number) => (
                <div key={theme.name} className='flex items-center gap-4'>
                  <Chip
                    label={`#${index + 1}`}
                    size='small'
                    color={index < 3 ? 'primary' : 'default'}
                    variant={index < 3 ? 'filled' : 'outlined'}
                  />
                  <div className='flex-1'>
                    <Typography variant='body2' className='font-medium'>
                      {theme.name}
                    </Typography>
                    <LinearProgress
                      variant='determinate'
                      value={theme.percentage}
                      className='mt-1'
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </div>
                  <Typography variant='body2' color='text.secondary'>
                    {theme.count} venues
                  </Typography>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Venues Table */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Top 10 Venues por Clicks' subheader='Venues con mayor actividad' />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Venue</TableCell>
                  <TableCell align='right'>Clicks</TableCell>
                  <TableCell align='right'>Conversiones</TableCell>
                  <TableCell align='right'>Tasa Conversión</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.topVenues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      <Typography variant='body2' color='text.secondary'>
                        No data available yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.topVenues.map(
                    (
                      venue: { id: string; name: string; clicks: number; conversions: number; conversionRate: number },
                      index: number
                    ) => (
                      <TableRow key={venue.id}>
                        <TableCell>
                          <Chip
                            label={`#${index + 1}`}
                            size='small'
                            color={index < 3 ? 'primary' : 'default'}
                            variant={index < 3 ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' className='font-medium'>
                            {venue.name}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2'>{venue.clicks}</Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2'>{venue.conversions}</Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Chip
                            label={`${venue.conversionRate.toFixed(1)}%`}
                            size='small'
                            color={
                              venue.conversionRate >= 30
                                ? 'success'
                                : venue.conversionRate >= 15
                                  ? 'warning'
                                  : 'default'
                            }
                            variant='tonal'
                          />
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
    </Grid>
  )
}

export default AdminAnalyticsView
