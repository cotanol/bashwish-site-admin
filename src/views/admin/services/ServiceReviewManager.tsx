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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'

import type { ServiceReview } from '@prisma/client'
import { createServiceReview, deleteServiceReview, updateServiceReview } from '@/actions/service-review-actions'

interface Props {
  serviceId: string
  serviceName: string
  reviews: ServiceReview[]
}

const ServiceReviewManager = ({ serviceId, serviceName, reviews = [] }: Props) => {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<ServiceReview | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    authorName: '',
    rating: 5,
    text: '',
    reviewDate: new Date().toISOString().split('T')[0]
  })

  const handleOpenDialog = (review?: ServiceReview) => {
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
        await updateServiceReview(editingReview.id, {
          authorName: formData.authorName,
          rating: formData.rating,
          text: formData.text || undefined,
          reviewDate: new Date(formData.reviewDate)
        })
      } else {
        await createServiceReview({
          serviceId,
          authorName: formData.authorName,
          rating: formData.rating,
          text: formData.text || undefined,
          reviewDate: new Date(formData.reviewDate)
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
      await deleteServiceReview(reviewId)
      router.refresh()
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review')
    } finally {
      setIsDeleting(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  return (
    <>
      <Grid container spacing={6}>
        {/* Stats Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader title='Review Statistics' />
            <CardContent>
              <div className='flex items-center gap-4'>
                <div className='text-center'>
                  <Typography variant='h3' className='font-bold'>
                    {averageRating.toFixed(1)}
                  </Typography>
                  <Rating value={averageRating} readOnly precision={0.1} />
                  <Typography variant='body2' color='text.secondary'>
                    {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Header */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader
              title={`Reviews for ${serviceName}`}
              subheader={`Manage customer reviews (Admin only)`}
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
                  Add the first customer review for this service
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
                          <Typography variant='body2' className='line-clamp-2'>
                            {review.text || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' color='text.secondary'>
                            {formatDate(review.reviewDate)}
                          </Typography>
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
          <div className='flex flex-col gap-4 pt-2'>
            <TextField
              fullWidth
              label='Author Name'
              placeholder='Customer name'
              value={formData.authorName}
              onChange={e => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
              required
              disabled={isSubmitting}
            />
            <div>
              <Typography variant='body2' className='mb-1'>
                Rating
              </Typography>
              <Rating
                value={formData.rating}
                onChange={(_, value) => setFormData(prev => ({ ...prev, rating: value || 5 }))}
                disabled={isSubmitting}
              />
            </div>
            <TextField
              fullWidth
              multiline
              rows={4}
              label='Review Text'
              placeholder='What did they say about the service?'
              value={formData.text}
              onChange={e => setFormData(prev => ({ ...prev, text: e.target.value }))}
              disabled={isSubmitting}
            />
            <TextField
              fullWidth
              type='date'
              label='Review Date'
              value={formData.reviewDate}
              onChange={e => setFormData(prev => ({ ...prev, reviewDate: e.target.value }))}
              disabled={isSubmitting}
              InputLabelProps={{ shrink: true }}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant='contained' onClick={handleSubmit} disabled={isSubmitting || !formData.authorName.trim()}>
            {isSubmitting ? 'Saving...' : editingReview ? 'Update Review' : 'Add Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ServiceReviewManager
