'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

import { vendorSubmitVenueForReview } from '@/actions/vendor-actions'
import type { VendorWithRelations } from '@/actions/vendor-actions'
import type { Venue } from '@prisma/client'

// Serialized venue type for this specific component (no vendor field needed)
type VenueWithDetails = Omit<Venue, 'startingPrice' | 'latitude' | 'longitude' | 'createdAt' | 'updatedAt'> & {
  startingPrice: number | null
  latitude: number | null
  longitude: number | null
  createdAt: Date
  updatedAt: Date
  images: Array<{ id: string; url: string; isPrimary: boolean; [key: string]: any }>
  packages: Array<{ id: string; name: string; price: number }>
  _count: { reviews: number; packages: number }
}

interface Props {
  vendor: VendorWithRelations
  venues: VenueWithDetails[]
  userId: string
}

const statusColors: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  draft: 'default',
  pending_review: 'warning',
  published: 'success',
  suspended: 'error'
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  published: 'Published',
  suspended: 'Suspended'
}

const VendorVenuesList = ({ vendor, venues, userId }: Props) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, venueId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedVenueId(venueId)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
    setSelectedVenueId(null)
  }

  const handleSubmitForReview = async (venueId: string) => {
    startTransition(async () => {
      const result = await vendorSubmitVenueForReview(venueId, userId)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Failed to submit venue for review')
      }
    })
  }

  const handleEdit = () => {
    if (selectedVenueId) {
      router.push(`/vendor/venues/${selectedVenueId}/edit`)
    }
    handleCloseMenu()
  }

  const handleManagePackages = () => {
    if (selectedVenueId) {
      router.push(`/vendor/venues/${selectedVenueId}/packages`)
    }
    handleCloseMenu()
  }

  const handleManageImages = () => {
    if (selectedVenueId) {
      router.push(`/vendor/venues/${selectedVenueId}/gallery`)
    }
    handleCloseMenu()
  }

  const handleManageReviews = () => {
    if (selectedVenueId) {
      router.push(`/vendor/venues/${selectedVenueId}/reviews`)
    }
    handleCloseMenu()
  }

  const getPrimaryImage = (venue: VenueWithDetails) => {
    const primary = venue.images.find(img => img.isPrimary)
    return primary?.url || venue.images[0]?.url || '/images/pages/venue-placeholder.jpg'
  }

  return (
    <Grid container spacing={6}>
      {/* Header */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title={`My Venues (${venues.length})`}
            subheader='Manage all your venues, packages, and content'
            action={
              <Button
                variant='contained'
                startIcon={<i className='tabler-plus' />}
                onClick={() => router.push('/vendor/venues/create')}
              >
                Add New Venue
              </Button>
            }
          />
        </Card>
      </Grid>

      {/* Empty State */}
      {venues.length === 0 && (
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent className='text-center py-12'>
              <i className='tabler-building-store text-6xl text-textSecondary mb-4' />
              <Typography variant='h5' className='mb-2'>
                No Venues Yet
              </Typography>
              <Typography variant='body2' color='text.secondary' className='mb-6'>
                Create your first venue to start receiving bookings
              </Typography>
              <Button
                variant='contained'
                size='large'
                startIcon={<i className='tabler-plus' />}
                onClick={() => router.push('/vendor/venues/create')}
              >
                Create Your First Venue
              </Button>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Venues Grid */}
      {venues.map(venue => (
        <Grid key={venue.id} size={{ xs: 12, md: 6, lg: 4 }}>
          <Card className='h-full flex flex-col'>
            {/* Venue Image */}
            <div className='relative h-48 bg-gray-100'>
              <img src={getPrimaryImage(venue)} alt={venue.name} className='w-full h-full object-cover' />
              <div className='absolute top-3 right-3'>
                <Chip label={statusLabels[venue.status]} color={statusColors[venue.status]} size='small' />
              </div>
              {venue.isFeatured && (
                <div className='absolute top-3 left-3'>
                  <Chip label='Featured' color='primary' size='small' icon={<i className='tabler-star' />} />
                </div>
              )}
            </div>

            {/* Venue Info */}
            <CardContent className='flex-grow'>
              <div className='flex items-start justify-between mb-2'>
                <Typography variant='h6' className='line-clamp-1'>
                  {venue.name}
                </Typography>
                <IconButton size='small' onClick={e => handleOpenMenu(e, venue.id)}>
                  <i className='tabler-dots-vertical' />
                </IconButton>
              </div>

              <div className='flex items-center gap-2 text-textSecondary mb-3'>
                <i className='tabler-map-pin text-sm' />
                <Typography variant='body2' color='text.secondary'>
                  {venue.city}
                </Typography>
              </div>

              <div className='flex items-center gap-4 mb-3'>
                <div className='flex items-center gap-1'>
                  <i className='tabler-package text-sm' />
                  <Typography variant='body2'>{venue._count.packages} packages</Typography>
                </div>
                <div className='flex items-center gap-1'>
                  <i className='tabler-photo text-sm' />
                  <Typography variant='body2'>{venue.images.length} photos</Typography>
                </div>
                <div className='flex items-center gap-1'>
                  <i className='tabler-star text-sm' />
                  <Typography variant='body2'>{venue._count.reviews} reviews</Typography>
                </div>
              </div>

              {/* Status Info */}
              {venue.status === 'draft' && (
                <div className='bg-gray-100 rounded p-2 mb-3'>
                  <Typography variant='caption' color='text.secondary'>
                    <i className='tabler-info-circle text-sm mr-1' />
                    Draft - Complete and submit for admin review
                  </Typography>
                </div>
              )}
              {venue.status === 'pending_review' && (
                <div className='bg-warning-light rounded p-2 mb-3'>
                  <Typography variant='caption' color='warning.dark'>
                    <i className='tabler-clock text-sm mr-1' />
                    Pending Review - Waiting for admin approval
                  </Typography>
                </div>
              )}
              {venue.status === 'published' && (
                <div className='bg-success-light rounded p-2 mb-3'>
                  <Typography variant='caption' color='success.dark'>
                    <i className='tabler-check text-sm mr-1' />
                    Published - Visible on public site
                  </Typography>
                </div>
              )}
              {venue.status === 'suspended' && (
                <div className='bg-error-light rounded p-2 mb-3'>
                  <Typography variant='caption' color='error.dark'>
                    <i className='tabler-x text-sm mr-1' />
                    Suspended - Blocked by admin
                  </Typography>
                </div>
              )}

              {venue.description && (
                <Typography variant='body2' color='text.secondary' className='line-clamp-2'>
                  {venue.description}
                </Typography>
              )}
            </CardContent>

            {/* Actions */}
            <CardActions className='border-t p-4 gap-2 flex-col'>
              <div className='flex gap-2 w-full'>
                <Button
                  size='small'
                  variant='outlined'
                  fullWidth
                  onClick={() => router.push(`/vendor/venues/${venue.id}/edit`)}
                  disabled={isPending}
                  startIcon={<i className='tabler-edit' />}
                >
                  Edit
                </Button>
              </div>

              <div className='flex gap-2 w-full'>
                <Button
                  size='small'
                  variant='tonal'
                  fullWidth
                  onClick={() => router.push(`/vendor/venues/${venue.id}/packages`)}
                  disabled={isPending}
                  startIcon={<i className='tabler-package' />}
                >
                  Packages
                </Button>
                <Button
                  size='small'
                  variant='tonal'
                  fullWidth
                  onClick={() => router.push(`/vendor/venues/${venue.id}/gallery`)}
                  disabled={isPending}
                  startIcon={<i className='tabler-photo' />}
                >
                  Gallery
                </Button>
              </div>

              <div className='flex gap-2 w-full'>
                <Button
                  size='small'
                  variant='tonal'
                  fullWidth
                  onClick={() => router.push(`/vendor/venues/${venue.id}/reviews`)}
                  disabled={isPending}
                  startIcon={<i className='tabler-star' />}
                >
                  Reviews
                </Button>
              </div>

              {/* Submit for Review button (only for draft venues) */}
              {venue.status === 'draft' && (
                <Button
                  size='small'
                  variant='contained'
                  color='success'
                  fullWidth
                  onClick={() => handleSubmitForReview(venue.id)}
                  disabled={isPending}
                  startIcon={<i className='tabler-send' />}
                >
                  {isPending ? 'Submitting...' : 'Submit for Review'}
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
      ))}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <MenuItem onClick={handleEdit}>
          <i className='tabler-edit mr-2' />
          Edit Venue
        </MenuItem>
        <MenuItem onClick={handleManagePackages}>
          <i className='tabler-package mr-2' />
          Manage Packages
        </MenuItem>
        <MenuItem onClick={handleManageImages}>
          <i className='tabler-photo mr-2' />
          Manage Images
        </MenuItem>
        <MenuItem onClick={handleManageReviews}>
          <i className='tabler-star mr-2' />
          Manage Reviews
        </MenuItem>
      </Menu>
    </Grid>
  )
}

export default VendorVenuesList
