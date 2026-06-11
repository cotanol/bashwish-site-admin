'use client'

// React Imports
import { useMemo } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

// Type Imports
import type { ReviewType } from '@/types/apps/ecommerceTypes'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

const ReviewsStatistics = ({ reviewsData }: { reviewsData?: ReviewType[] }) => {
  // Hook
  const theme = useTheme()

  // Calculate weekly review statistics
  const weeklyStats = useMemo(() => {
    if (!reviewsData || reviewsData.length === 0) {
      return {
        series: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
        newReviews: 0,
        positivePercentage: 0,
        percentageChange: '+0.0%'
      }
    }

    // Get last 7 days
    const today = new Date()
    const daysData = [0, 0, 0, 0, 0, 0, 0] // Sunday to Saturday
    const oneWeekAgo = new Date(today)

    oneWeekAgo.setDate(today.getDate() - 7)

    // Count reviews by day of week (last 7 days)
    reviewsData.forEach(review => {
      const reviewDate = new Date(review.date)

      if (reviewDate >= oneWeekAgo) {
        const dayIndex = reviewDate.getDay() // 0 = Sunday, 6 = Saturday

        daysData[dayIndex]++
      }
    })

    // Reorder to Monday-Sunday (M, T, W, T, F, S, S)
    const reorderedData = [
      daysData[1], // Monday
      daysData[2], // Tuesday
      daysData[3], // Wednesday
      daysData[4], // Thursday
      daysData[5], // Friday
      daysData[6], // Saturday
      daysData[0] // Sunday
    ]

    // Count new reviews (last 7 days)
    const newReviews = reviewsData.filter(review => new Date(review.date) >= oneWeekAgo).length

    // Calculate positive reviews (4+ stars)
    const positiveReviews = reviewsData.filter(review => review.review >= 4).length
    const positivePercentage = reviewsData.length > 0 ? Math.round((positiveReviews / reviewsData.length) * 100) : 0

    // Calculate percentage change (compare last week to previous week)
    const twoWeeksAgo = new Date(today)

    twoWeeksAgo.setDate(today.getDate() - 14)

    const previousWeekReviews = reviewsData.filter(review => {
      const date = new Date(review.date)

      return date >= twoWeeksAgo && date < oneWeekAgo
    }).length

    let percentageChange = '+0.0%'

    if (previousWeekReviews > 0) {
      const change = ((newReviews - previousWeekReviews) / previousWeekReviews) * 100

      percentageChange = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
    } else if (newReviews > 0) {
      percentageChange = '+100%'
    }

    return {
      series: [{ data: reorderedData }],
      newReviews,
      positivePercentage,
      percentageChange
    }
  }, [reviewsData])

  // Vars
  const successLightOpacity = 'var(--mui-palette-success-lightOpacity)'

  const options: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        distributed: true,
        columnWidth: '40%'
      }
    },
    legend: { show: false },
    tooltip: { enabled: false },
    dataLabels: { enabled: false },
    colors: [
      successLightOpacity,
      successLightOpacity,
      successLightOpacity,
      successLightOpacity,
      'var(--mui-palette-success-main)',
      successLightOpacity,
      successLightOpacity
    ],
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    grid: {
      show: false,
      padding: {
        top: -30,
        left: 0,
        right: 0,
        bottom: -12
      }
    },
    xaxis: {
      categories: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      axisTicks: { show: false },
      axisBorder: { show: false },
      tickPlacement: 'on',
      labels: {
        style: {
          colors: 'var(--mui-palette-text-disabled)',
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.body2.fontSize as string
        }
      }
    },
    yaxis: { show: false },
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: {
            width: 275
          }
        }
      }
    ]
  }

  return (
    <Card>
      <CardContent>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <div className='bs-full flex flex-col items-start justify-between gap-6'>
              <div className='flex flex-col items-start gap-2'>
                <Typography variant='h5'>Reviews statistics</Typography>
                <div className='flex items-center gap-2'>
                  <Typography>{weeklyStats.newReviews} New reviews</Typography>
                  <Chip
                    label={weeklyStats.percentageChange}
                    variant='tonal'
                    size='small'
                    color={weeklyStats.percentageChange.startsWith('+') ? 'success' : 'error'}
                  />
                </div>
              </div>
              <div className='flex flex-col items-start gap-2'>
                <Typography color='text.primary'>
                  <span className='text-success'>{weeklyStats.positivePercentage}%</span> Positive reviews
                </Typography>
                <Typography variant='body2'>Weekly Report</Typography>
              </div>
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} className='flex justify-center'>
            <AppReactApexCharts type='bar' width='100%' height={156} series={weeklyStats.series} options={options} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ReviewsStatistics
