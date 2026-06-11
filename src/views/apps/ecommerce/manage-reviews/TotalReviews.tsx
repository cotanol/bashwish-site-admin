'use client'

// React Imports
import { useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

// Type Imports
import type { ReviewType } from '@/types/apps/ecommerceTypes'

const TotalReviews = ({ reviewsData }: { reviewsData?: ReviewType[] }) => {
  // Hooks
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  // Calculate review statistics from real data
  const reviewStats = useMemo(() => {
    if (!reviewsData || reviewsData.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: [
          { rating: 5, value: 0 },
          { rating: 4, value: 0 },
          { rating: 3, value: 0 },
          { rating: 2, value: 0 },
          { rating: 1, value: 0 }
        ],
        recentCount: 0
      }
    }

    const ratingCounts = [0, 0, 0, 0, 0] // Index 0 = 1 star, index 4 = 5 stars

    reviewsData.forEach(review => {
      if (review.review >= 1 && review.review <= 5) {
        ratingCounts[review.review - 1]++
      }
    })

    const totalReviews = reviewsData.length
    const totalRatingSum = reviewsData.reduce((sum, review) => sum + review.review, 0)
    const averageRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(2) : '0.00'

    // Count reviews from this week (last 7 days)
    const oneWeekAgo = new Date()

    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const recentCount = reviewsData.filter(review => new Date(review.date) >= oneWeekAgo).length

    return {
      averageRating,
      totalReviews,
      ratingBreakdown: [
        { rating: 5, value: ratingCounts[4] },
        { rating: 4, value: ratingCounts[3] },
        { rating: 3, value: ratingCounts[2] },
        { rating: 2, value: ratingCounts[1] },
        { rating: 1, value: ratingCounts[0] }
      ],
      recentCount
    }
  }, [reviewsData])

  return (
    <Card className='bs-full'>
      <CardContent>
        <div className='flex max-sm:flex-col items-center gap-6'>
          <div className='flex flex-col items-start gap-2 is-full sm:is-6/12'>
            <div className='flex items-center gap-2'>
              <Typography variant='h3' color='primary.main'>
                {reviewStats.averageRating}
              </Typography>
              <i className='tabler-star-filled text-[32px] text-primary' />
            </div>
            <Typography className='font-medium' color='text.primary'>
              Total {reviewStats.totalReviews} reviews
            </Typography>
            <Typography>All reviews are from genuine customers</Typography>
            {reviewStats.recentCount > 0 && (
              <Chip label={`+${reviewStats.recentCount} This week`} variant='tonal' size='small' color='primary' />
            )}
          </div>
          <Divider orientation={isSmallScreen ? 'horizontal' : 'vertical'} flexItem />
          <div className='flex flex-col gap-3 is-full sm:is-6/12'>
            {reviewStats.ratingBreakdown.map((item, index) => (
              <div key={index} className='flex items-center gap-2'>
                <Typography variant='body2' className='text-nowrap'>
                  {item.rating} Star
                </Typography>
                <LinearProgress
                  color='primary'
                  value={reviewStats.totalReviews > 0 ? Math.floor((item.value / reviewStats.totalReviews) * 100) : 0}
                  variant='determinate'
                  className='bs-2 is-full'
                />
                <Typography variant='body2'>{item.value}</Typography>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TotalReviews
