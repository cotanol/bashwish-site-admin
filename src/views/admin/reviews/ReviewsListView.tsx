'use client'

// React Imports
import { useMemo, useState, useTransition } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid2'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Switch from '@mui/material/Switch'
import Tooltip from '@mui/material/Tooltip'

// Type Imports
import type { Review, ServiceReview } from '@prisma/client'

// Actions
import { toggleVenueReviewVisibility, toggleServiceReviewVisibility } from '@/actions/review-actions'

type VenueReviewWithVenue = Review & {
  venue: {
    id: string
    name: string
    slug: string
  }
}

type ServiceReviewWithService = ServiceReview & {
  service: {
    id: string
    name: string
    slug: string
  }
}

type ReviewsListViewProps = {
  venueReviews: VenueReviewWithVenue[]
  serviceReviews: ServiceReviewWithService[]
}

const ReviewsListView = ({ venueReviews, serviceReviews }: ReviewsListViewProps) => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [isPending, startTransition] = useTransition()

  const handleVenueReviewToggle = async (reviewId: string) => {
    startTransition(async () => {
      try {
        await toggleVenueReviewVisibility(reviewId)
        router.refresh()
      } catch (error) {
        console.error('Error toggling venue review visibility:', error)
      }
    })
  }

  const handleServiceReviewToggle = async (reviewId: string) => {
    startTransition(async () => {
      try {
        await toggleServiceReviewVisibility(reviewId)
        router.refresh()
      } catch (error) {
        console.error('Error toggling service review visibility:', error)
      }
    })
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className='flex gap-1'>
        {[1, 2, 3, 4, 5].map(star => (
          <i
            key={star}
            className={`tabler-star${star <= rating ? '-filled' : ''}`}
            style={{ color: star <= rating ? '#F8BD36' : '#d1d5db', fontSize: '18px' }}
          />
        ))}
      </div>
    )
  }

  // Filter venue reviews based on search
  const filteredVenueReviews = useMemo(() => {
    if (!searchQuery) return venueReviews

    return venueReviews.filter(review =>
      review.venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.authorName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [venueReviews, searchQuery])

  // Filter service reviews based on search
  const filteredServiceReviews = useMemo(() => {
    if (!searchQuery) return serviceReviews

    return serviceReviews.filter(review =>
      review.service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.authorName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [serviceReviews, searchQuery])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title='Reviews Management'
            subheader='Manage reviews for venues and services'
          />
          <CardContent>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              className='mb-6'
            >
              <Tab label={`Venue Reviews (${filteredVenueReviews.length})`} />
              <Tab label={`Service Reviews (${filteredServiceReviews.length})`} />
            </Tabs>

            <TextField
              fullWidth
              placeholder={activeTab === 0 ? 'Search venue reviews...' : 'Search service reviews...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='mb-6'
              slotProps={{
                input: {
                  startAdornment: <i className='tabler-search' />
                }
              }}
            />

            {activeTab === 0 ? (
              <>
                {/* Venue Reviews Table */}
                <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Venue</TableCell>
                      <TableCell>Author</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Review</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Visible</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredVenueReviews.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align='center'>
                          <Typography variant='body2' color='text.secondary' className='py-12'>
                            No venue reviews found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVenueReviews.map(review => (
                        <TableRow key={review.id} hover>
                          <TableCell>
                            <Typography variant='body2' fontWeight={600}>
                              {review.venue.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2'>
                              {review.authorName}
                            </Typography>
                            {review.authorEmail && (
                              <Typography variant='caption' color='text.secondary' display='block'>
                                {review.authorEmail}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {renderStars(review.rating)}
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' className='line-clamp-2' style={{ maxWidth: '300px' }}>
                              {review.text || 'No comment'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='caption' color='text.secondary'>
                              {formatDate(review.reviewDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <Tooltip title={review.isVisible ? 'Visible on frontend' : 'Hidden from frontend'}>
                                <span>
                                  <Switch
                                    checked={review.isVisible}
                                    onChange={() => handleVenueReviewToggle(review.id)}
                                    size='small'
                                  />
                                </span>
                              </Tooltip>
                              <Typography variant='caption' color='text.secondary'>
                                {review.isVisible ? 'Visible' : 'Hidden'}
                              </Typography>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              </>
            ) : (
              <>
                {/* Service Reviews Table */}
                <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell>Author</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Review</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Visible</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredServiceReviews.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align='center'>
                          <Typography variant='body2' color='text.secondary' className='py-12'>
                            No service reviews found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredServiceReviews.map(review => (
                        <TableRow key={review.id} hover>
                          <TableCell>
                            <Typography variant='body2' fontWeight={600}>
                              {review.service.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2'>
                              {review.authorName}
                            </Typography>
                            {review.authorEmail && (
                              <Typography variant='caption' color='text.secondary' display='block'>
                                {review.authorEmail}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {renderStars(review.rating)}
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' className='line-clamp-2' style={{ maxWidth: '300px' }}>
                              {review.text || 'No comment'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='caption' color='text.secondary'>
                              {formatDate(review.reviewDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <Tooltip title={review.isVisible ? 'Visible on frontend' : 'Hidden from frontend'}>
                                <span>
                                  <Switch
                                    checked={review.isVisible}
                                    onChange={() => handleServiceReviewToggle(review.id)}
                                    size='small'
                                  />
                                </span>
                              </Tooltip>
                              <Typography variant='caption' color='text.secondary'>
                                {review.isVisible ? 'Visible' : 'Hidden'}
                              </Typography>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ReviewsListView
