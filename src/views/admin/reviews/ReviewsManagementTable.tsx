'use client'

import { useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Rating from '@mui/material/Rating'

import { approveReview, rejectReview } from '@/actions/review-actions'

interface Review {
  id: string
  venueId: string
  authorName: string
  authorEmail: string | null
  rating: number
  text: string | null
  reviewDate: string
  status: string
  createdAt: string
  venue: {
    name: string
    slug: string
  }
}

interface Props {
  reviews: Review[]
}

export default function ReviewsManagementTable({ reviews }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleApprove = async (reviewId: string) => {
    startTransition(async () => {
      try {
        await approveReview(reviewId)
        router.refresh()
      } catch (error) {
        console.error('Error approving review:', error)
        alert('Failed to approve review')
      }
    })
  }

  const handleReject = async (reviewId: string) => {
    if (!confirm('Are you sure you want to reject this review?')) return

    startTransition(async () => {
      try {
        await rejectReview(reviewId)
        router.refresh()
      } catch (error) {
        console.error('Error rejecting review:', error)
        alert('Failed to reject review')
      }
    })
  }

  const handleViewDetails = (review: Review) => {
    setSelectedReview(review)
    setDialogOpen(true)
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader title="Review Management" />
        <CardContent>
          <div className="text-center py-12">
            <Typography variant="h6" color="text.secondary" gutterBottom>
              🎉 No pending reviews
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All reviews have been reviewed!
            </Typography>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Pending Reviews"
          subheader={`${reviews.length} review${reviews.length !== 1 ? 's' : ''} waiting for approval`}
        />
        <CardContent>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border border-divider rounded-lg p-4 hover:bg-actionHover transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Review Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Typography variant="h6" className="font-bold">
                        {review.authorName}
                      </Typography>
                      <Rating value={review.rating} readOnly size="small" />
                      <Chip label={review.rating} size="small" color="primary" />
                    </div>

                    <Typography variant="body2" color="text.secondary" className="mb-2">
                      Venue: <strong>{review.venue.name}</strong>
                      {review.authorEmail && ` • Email: ${review.authorEmail}`}
                    </Typography>

                    {review.text && (
                      <Typography variant="body2" className="mt-2 mb-3">
                        &quot;{review.text}&quot;
                      </Typography>
                    )}

                    <Typography variant="caption" color="text.secondary">
                      Submitted: {new Date(review.createdAt).toLocaleString()}
                    </Typography>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[120px]">
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleApprove(review.id)}
                      disabled={isPending}
                      startIcon={<i className="tabler-check" />}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleReject(review.id)}
                      disabled={isPending}
                      startIcon={<i className="tabler-x" />}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => handleViewDetails(review)}
                      startIcon={<i className="tabler-eye" />}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedReview && (
          <>
            <DialogTitle>
              Review Details
              <IconButton
                onClick={() => setDialogOpen(false)}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <i className="tabler-x" />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <div className="space-y-4">
                <div>
                  <Typography variant="caption" color="text.secondary">
                    Venue
                  </Typography>
                  <Typography variant="body1" className="font-bold">
                    {selectedReview.venue.name}
                  </Typography>
                </div>

                <div>
                  <Typography variant="caption" color="text.secondary">
                    Author
                  </Typography>
                  <Typography variant="body1">{selectedReview.authorName}</Typography>
                  {selectedReview.authorEmail && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedReview.authorEmail}
                    </Typography>
                  )}
                </div>

                <div>
                  <Typography variant="caption" color="text.secondary">
                    Rating
                  </Typography>
                  <div className="flex items-center gap-2 mt-1">
                    <Rating value={selectedReview.rating} readOnly />
                    <Typography variant="body2">({selectedReview.rating}/5)</Typography>
                  </div>
                </div>

                {selectedReview.text && (
                  <div>
                    <Typography variant="caption" color="text.secondary">
                      Review
                    </Typography>
                    <Typography variant="body1" className="mt-1">
                      {selectedReview.text}
                    </Typography>
                  </div>
                )}

                <div>
                  <Typography variant="caption" color="text.secondary">
                    Submitted
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedReview.createdAt).toLocaleString()}
                  </Typography>
                </div>

                <div>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <div className="mt-1">
                    <Chip label={selectedReview.status} color="warning" size="small" />
                  </div>
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  handleReject(selectedReview.id)
                  setDialogOpen(false)
                }}
                disabled={isPending}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  handleApprove(selectedReview.id)
                  setDialogOpen(false)
                }}
                disabled={isPending}
              >
                Approve
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  )
}
