'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import IconButton from '@mui/material/IconButton'
import Rating from '@mui/material/Rating'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'

import type { Review } from '@prisma/client'
import { createReview, deleteReview, updateReview } from '@/actions/review-actions'

interface Props {
  venueId: string
  venueName: string
  reviews: Review[]
  userId: string
}

const VenueReviewManager = ({ venueId, venueName, reviews, userId }: Props) => {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    authorName: '',
    rating: 5,
    text: '',
    reviewDate: new Date().toISOString().split('T')[0]
  })

  const handleOpenDialog = (review?: Review) => {
    if (review) {
      setEditingReview(review)
      setFormData({
        authorName: review.authorName,
        rating: review.rating,
        text: review.text || '',
        reviewDate: new Date(review.reviewDate).toISOString().split('T')[0]
      })
    } else {
      setEditingReview(null)
      setFormData({
        authorName: '',
        rating: 5,
        text: '',
        reviewDate: new Date().toISOString().split('T')[0]
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingReview(null)
    setFormData({
      authorName: '',
      rating: 5,
      text: '',
      reviewDate: new Date().toISOString().split('T')[0]
    })
  }

  const handleSubmit = async () => {
    if (!formData.authorName.trim()) {
      alert('Please enter the author name')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingReview) {
        await updateReview(editingReview.id, {
          authorName: formData.authorName,
          rating: formData.rating,
          text: formData.text || undefined,
          reviewDate: new Date(formData.reviewDate)
        })
      } else {
        await createReview({
          venueId,
          authorName: formData.authorName,
          rating: formData.rating,
          text: formData.text || undefined,
          reviewDate: new Date(formData.reviewDate),
          source: 'manual'
        })
      }

      handleCloseDialog()
      router.refresh()
    } catch (error) {
      console.error('Error saving review:', error)
      alert('Failed to save review')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Delete this review? This action cannot be undone.')) {
      return
    }

    setIsDeleting(reviewId)
    try {
      await deleteReview(reviewId)
      router.refresh()
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review')
    } finally {
      setIsDeleting(null)
    }
  }

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0

  return (
    <>
      <Grid container spacing={6}>
        {/* Header */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader
              title={`Reviews for ${venueName}`}
              subheader={
                <div className='flex items-center gap-4 mt-2'>
                  <div className='flex items-center gap-2'>
                    <Rating value={averageRating} readOnly precision={0.1} size='small' />
                    <Typography variant='body2' color='text.secondary'>
                      {averageRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                    </Typography>
                  </div>
                </div>
              }
              action={
                <Button
                  variant='contained'
                  startIcon={<i className='tabler-plus' />}
                  onClick={() => handleOpenDialog()}
                >
                  Add Review
                </Button>
              }
            />
          </Card>
        </Grid>

        {/* Empty State */}
        {reviews.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent className='text-center py-12'>
                <i className='tabler-star text-6xl text-textSecondary mb-4' />
                <Typography variant='h5' className='mb-2'>
                  No Reviews Yet
                </Typography>
                <Typography variant='body2' color='text.secondary' className='mb-6'>
                  Add customer reviews to build trust and showcase your venue
                </Typography>
                <Button
                  variant='contained'
                  size='large'
                  startIcon={<i className='tabler-plus' />}
                  onClick={() => handleOpenDialog()}
                >
                  Add First Review
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Reviews Table */}
        {reviews.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Author</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Review</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell align='right'>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reviews.map(review => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <Typography variant='body1' className='font-medium'>
                            {review.authorName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Rating value={review.rating} readOnly size='small' />
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' className='line-clamp-2 max-w-md'>
                            {review.text || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' color='text.secondary'>
                            {new Date(review.reviewDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={review.source} size='small' variant='tonal' />
                        </TableCell>
                        <TableCell align='right'>
                          <IconButton
                            size='small'
                            onClick={() => handleOpenDialog(review)}
                            disabled={isDeleting === review.id}
                          >
                            <i className='tabler-edit' />
                          </IconButton>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleDelete(review.id)}
                            disabled={isDeleting === review.id}
                          >
                            <i className='tabler-trash' />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{editingReview ? 'Edit Review' : 'Add New Review'}</DialogTitle>
        <DialogContent>
          <div className='flex flex-col gap-4 mt-4'>
            <TextField
              label='Author Name'
              value={formData.authorName}
              onChange={e => setFormData({ ...formData, authorName: e.target.value })}
              fullWidth
              required
              placeholder='e.g., Sarah M., John Rodriguez'
            />

            <div>
              <Typography variant='body2' className='mb-2'>
                Rating
              </Typography>
              <Rating
                value={formData.rating}
                onChange={(e, value) => setFormData({ ...formData, rating: value || 5 })}
                size='large'
              />
            </div>

            <TextField
              label='Review Text'
              value={formData.text}
              onChange={e => setFormData({ ...formData, text: e.target.value })}
              fullWidth
              multiline
              rows={4}
              placeholder='Share what you loved about this venue...'
            />

            <TextField
              label='Review Date'
              type='date'
              value={formData.reviewDate}
              onChange={e => setFormData({ ...formData, reviewDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </div>
        </DialogContent>
        <DialogActions className='p-4'>
          <Button onClick={handleCloseDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant='contained' onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : editingReview ? 'Update Review' : 'Add Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default VenueReviewManager
