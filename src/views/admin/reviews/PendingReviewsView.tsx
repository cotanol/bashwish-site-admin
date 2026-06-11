'use client'

// React Imports
import { useMemo, useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Tooltip from '@mui/material/Tooltip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'

// Type Imports
import type { Review, ServiceReview } from '@prisma/client'

// Actions
import {
  approveReview,
  rejectReview,
  deleteReview,
  approveServiceReview,
  rejectServiceReview,
  deleteServiceReview,
  type VenueReviewWithVenue,
  type ServiceReviewWithService
} from '@/actions/review-actions'

interface PendingReviewsViewProps {
  venueReviews: VenueReviewWithVenue[]
  serviceReviews: ServiceReviewWithService[]
}

const PendingReviewsView = ({ venueReviews, serviceReviews }: PendingReviewsViewProps) => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [selectedVenueReview, setSelectedVenueReview] = useState<VenueReviewWithVenue | null>(null)
  const [selectedServiceReview, setSelectedServiceReview] = useState<ServiceReviewWithService | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Filter venue reviews based on search
  const filteredVenueReviews = useMemo(() => {
    if (!searchQuery) return venueReviews

    return venueReviews.filter(
      review =>
        review.venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.authorName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [venueReviews, searchQuery])

  // Filter service reviews based on search
  const filteredServiceReviews = useMemo(() => {
    if (!searchQuery) return serviceReviews

    return serviceReviews.filter(
      review =>
        review.service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.authorName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [serviceReviews, searchQuery])

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

  const handleOpenVenueReview = (review: VenueReviewWithVenue) => {
    setSelectedVenueReview(review)
    setSelectedServiceReview(null)
    setIsDialogOpen(true)
  }

  const handleOpenServiceReview = (review: ServiceReviewWithService) => {
    setSelectedServiceReview(review)
    setSelectedVenueReview(null)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedVenueReview(null)
    setSelectedServiceReview(null)
  }

  const handleApprove = async () => {
    try {
      if (selectedVenueReview) {
        await approveReview(selectedVenueReview.id)
      } else if (selectedServiceReview) {
        await approveServiceReview(selectedServiceReview.id)
      }

      handleCloseDialog()
      router.refresh()
    } catch (error) {
      console.error('Error approving review:', error)
    }
  }

  const handleReject = async () => {
    try {
      if (selectedVenueReview) {
        await rejectReview(selectedVenueReview.id)
      } else if (selectedServiceReview) {
        await rejectServiceReview(selectedServiceReview.id)
      }

      handleCloseDialog()
      router.refresh()
    } catch (error) {
      console.error('Error rejecting review:', error)
    }
  }

  const handleDelete = async () => {
    try {
      if (selectedVenueReview) {
        await deleteReview(selectedVenueReview.id)
      } else if (selectedServiceReview) {
        await deleteServiceReview(selectedServiceReview.id)
      }

      handleCloseDialog()
      router.refresh()
    } catch (error) {
      console.error('Error deleting review:', error)
    }
  }

  return (
    <Card>
      <CardHeader title='Pending Reviews' subheader='Review and approve pending reviews from venues and services' />
      <CardContent>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} className='mb-6'>
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
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Venue</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Review</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVenueReviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      <Typography variant='body2' color='text.secondary' className='py-12'>
                        No pending venue reviews
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
                        <Typography variant='body2'>{review.authorName}</Typography>
                        {review.authorEmail && (
                          <Typography variant='caption' color='text.secondary' display='block'>
                            {review.authorEmail}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
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
                      <TableCell align='right'>
                        <Tooltip title='View & Manage'>
                          <IconButton size='small' color='primary' onClick={() => handleOpenVenueReview(review)}>
                            <i className='tabler-eye' />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Review</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredServiceReviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      <Typography variant='body2' color='text.secondary' className='py-12'>
                        No pending service reviews
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
                        <Typography variant='body2'>{review.authorName}</Typography>
                        {review.authorEmail && (
                          <Typography variant='caption' color='text.secondary' display='block'>
                            {review.authorEmail}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
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
                      <TableCell align='right'>
                        <Tooltip title='View & Manage'>
                          <IconButton size='small' color='primary' onClick={() => handleOpenServiceReview(review)}>
                            <i className='tabler-eye' />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>

      {/* Review Detail Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth='md' fullWidth>
        <DialogTitle>
          {selectedVenueReview && <>Review for {selectedVenueReview.venue.name}</>}
          {selectedServiceReview && <>Review for {selectedServiceReview.service.name}</>}
        </DialogTitle>
        <DialogContent>
          {(selectedVenueReview || selectedServiceReview) && (
            <div className='space-y-4 pt-4'>
              {/* Author Info */}
              <div>
                <Typography variant='subtitle2' color='text.secondary'>
                  Author
                </Typography>
                <Typography variant='body1' fontWeight={600}>
                  {selectedVenueReview?.authorName || selectedServiceReview?.authorName}
                </Typography>
                {(selectedVenueReview?.authorEmail || selectedServiceReview?.authorEmail) && (
                  <Typography variant='body2' color='text.secondary'>
                    {selectedVenueReview?.authorEmail || selectedServiceReview?.authorEmail}
                  </Typography>
                )}
              </div>

              <Divider />

              {/* Rating */}
              <div>
                <Typography variant='subtitle2' color='text.secondary' className='mb-2'>
                  Rating
                </Typography>
                {renderStars(selectedVenueReview?.rating || selectedServiceReview?.rating || 0)}
              </div>

              <Divider />

              {/* Review Text */}
              <div>
                <Typography variant='subtitle2' color='text.secondary' className='mb-2'>
                  Review
                </Typography>
                <Typography variant='body1'>
                  {selectedVenueReview?.text || selectedServiceReview?.text || 'No comment provided'}
                </Typography>
              </div>

              <Divider />

              {/* Date */}
              <div>
                <Typography variant='subtitle2' color='text.secondary'>
                  Date
                </Typography>
                <Typography variant='body2'>
                  {formatDate(selectedVenueReview?.reviewDate || selectedServiceReview?.reviewDate || new Date())}
                </Typography>
              </div>

              <Divider />

              {/* Status */}
              <div>
                <Typography variant='subtitle2' color='text.secondary'>
                  Status
                </Typography>
                <Typography variant='body2' color='warning.main' fontWeight={600}>
                  PENDING
                </Typography>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className='p-4 gap-2'>
          <Button variant='outlined' color='error' onClick={handleDelete} startIcon={<i className='tabler-trash' />}>
            Delete
          </Button>
          <div className='flex-1' />
          <Button variant='outlined' color='secondary' onClick={handleReject} startIcon={<i className='tabler-x' />}>
            Reject
          </Button>
          <Button
            variant='contained'
            color='success'
            onClick={handleApprove}
            startIcon={<i className='tabler-check' />}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default PendingReviewsView
