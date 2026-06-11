'use client'

// React Imports
import { useState, useTransition } from 'react'

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
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Rating from '@mui/material/Rating'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'

// Type Imports
import type { Venue, ReviewStatus } from '@prisma/client'

// Actions
import { approveReview, rejectReview, deleteReview } from '@/actions/review-actions'

type SerializedReview = {
  id: string
  venueId: string
  authorName: string
  authorEmail: string | null
  rating: number
  text: string | null
  reviewDate: string
  source: string
  status: ReviewStatus
  createdAt: string
  updatedAt: string
}

type VenueReviewsViewProps = {
  venue: Venue
  reviews: SerializedReview[]
}

const VenueReviewsView = ({ venue, reviews }: VenueReviewsViewProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedReview, setSelectedReview] = useState<SerializedReview | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApprove = async (reviewId: string) => {
    setError(null)

    startTransition(async () => {
      try {
        await approveReview(reviewId)
        setDetailsOpen(false)
        router.refresh()
      } catch (error) {
        setError('Failed to approve review')
        console.error(error)
      }
    })
  }

  const handleReject = async (reviewId: string) => {
    setError(null)

    startTransition(async () => {
      try {
        await rejectReview(reviewId)
        setDetailsOpen(false)
        router.refresh()
      } catch (error) {
        setError('Failed to reject review')
        console.error(error)
      }
    })
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }

    setError(null)

    startTransition(async () => {
      try {
        await deleteReview(reviewId)
        setDetailsOpen(false)
        router.refresh()
      } catch (error) {
        setError('Failed to delete review')
        console.error(error)
      }
    })
  }

  const handleViewDetails = (review: SerializedReview) => {
    setSelectedReview(review)
    setDetailsOpen(true)
  }

  const getStatusColor = (status: ReviewStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'success'
      case 'REJECTED':
        return 'error'
      case 'PENDING':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title={
              <div className='flex items-center gap-2'>
                <IconButton size='small' onClick={() => router.push('/admin/reviews')}>
                  <i className='tabler-arrow-left' />
                </IconButton>
                <Typography variant='h5'>Reviews for {venue.name}</Typography>
              </div>
            }
            subheader={`Manage all reviews for this venue`}
          />
          <CardContent>
            {error && (
              <Alert severity='error' className='mb-4' onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Author</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Review</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align='right'>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align='center'>
                        <Typography variant='body2' color='text.secondary' className='py-12'>
                          No reviews yet
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reviews.map(review => (
                      <TableRow key={review.id} hover>
                        <TableCell>
                          <Typography variant='body2' fontWeight={600}>
                            {review.authorName}
                          </Typography>
                          {review.authorEmail && (
                            <Typography variant='caption' color='text.secondary'>
                              {review.authorEmail}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Rating value={review.rating} readOnly size='small' />
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' className='max-w-xs truncate'>
                            {review.text || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='caption'>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={review.status}
                            color={getStatusColor(review.status)}
                            size='small'
                            variant='tonal'
                          />
                        </TableCell>
                        <TableCell align='right'>
                          <IconButton size='small' onClick={() => handleViewDetails(review)}>
                            <i className='tabler-eye' />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Review Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Review Details</DialogTitle>
        <DialogContent>
          {selectedReview && (
            <div className='space-y-4'>
              <div>
                <Typography variant='caption' color='text.secondary'>
                  Author
                </Typography>
                <Typography variant='body1'>{selectedReview.authorName}</Typography>
                {selectedReview.authorEmail && (
                  <Typography variant='body2' color='text.secondary'>
                    {selectedReview.authorEmail}
                  </Typography>
                )}
              </div>

              <div>
                <Typography variant='caption' color='text.secondary'>
                  Rating
                </Typography>
                <div>
                  <Rating value={selectedReview.rating} readOnly />
                </div>
              </div>

              <div>
                <Typography variant='caption' color='text.secondary'>
                  Review Text
                </Typography>
                <Typography variant='body1'>{selectedReview.text || 'No text provided'}</Typography>
              </div>

              <div>
                <Typography variant='caption' color='text.secondary'>
                  Status
                </Typography>
                <div>
                  <Chip
                    label={selectedReview.status}
                    color={getStatusColor(selectedReview.status)}
                    size='small'
                    variant='tonal'
                  />
                </div>
              </div>

              <div>
                <Typography variant='caption' color='text.secondary'>
                  Submitted
                </Typography>
                <Typography variant='body2'>
                  {new Date(selectedReview.createdAt).toLocaleString()}
                </Typography>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDetailsOpen(false)}
            color='inherit'
          >
            Close
          </Button>
          <div className='flex-1' />
          {selectedReview && selectedReview.status === 'PENDING' && (
            <>
              <Button
                onClick={() => handleReject(selectedReview.id)}
                color='error'
                variant='outlined'
                disabled={isPending}
                startIcon={<i className='tabler-x' />}
              >
                Reject
              </Button>
              <Button
                onClick={() => handleApprove(selectedReview.id)}
                color='success'
                variant='contained'
                disabled={isPending}
                startIcon={<i className='tabler-check' />}
              >
                Approve
              </Button>
            </>
          )}
          {selectedReview && (
            <Button
              onClick={() => handleDelete(selectedReview.id)}
              color='error'
              variant='contained'
              disabled={isPending}
              startIcon={<i className='tabler-trash' />}
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default VenueReviewsView
