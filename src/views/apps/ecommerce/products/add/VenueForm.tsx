'use client'

// React Imports
import { useState, useTransition } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'

// Component Imports
import VenueInformation from './VenueInformation'

// Server Actions
import { createVenue, updateVenue, type CreateVenueInput } from '@/actions/venue-actions'
import type { VenueWithRelations } from '@/actions/venue-actions'

type VenueFormProps = {
  venue?: VenueWithRelations
  mode?: 'add' | 'edit' | 'create'
  vendorId: string // REQUIRED - all venues must belong to a vendor
  isAdmin?: boolean // If true, hide "Submit for Review" button
}

const VenueForm = ({ venue, mode = 'add', vendorId, isAdmin = false }: VenueFormProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [venueInfo, setVenueInfo] = useState({
    name: venue?.name || '',
    description: venue?.description || '',
    address: venue?.address || '',
    city: venue?.city || 'Houston',
    postalCode: venue?.postalCode || '',
    phone: venue?.phone || '',
    website: venue?.website || '',
    latitude: venue?.latitude ? Number(venue.latitude) : undefined,
    longitude: venue?.longitude ? Number(venue.longitude) : undefined
  })

  const [venuePricing, setVenuePricing] = useState({
    startingPrice: venue?.startingPrice ? Number(venue.startingPrice) : 0,
    discountPrice: venue?.discountPrice ? Number(venue.discountPrice) : undefined
  })

  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (submitForReview: boolean = false) => {
    setError(null)

    // Validation
    if (!venueInfo.name || !venueInfo.address || !venueInfo.city || !venueInfo.postalCode) {
      setError('Please fill in all required fields')
      return
    }

    if (venuePricing.startingPrice <= 0) {
      setError('Starting price must be greater than 0')
      return
    }

    if (!vendorId) {
      setError('Vendor ID is required')
      return
    }

    startTransition(async () => {
      try {
        // Generate slug from name
        const slug = venueInfo.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')

        const venueData: CreateVenueInput = {
          vendorId, // REQUIRED
          name: venueInfo.name,
          slug: mode === 'edit' && venue ? venue.slug : slug, // Keep existing slug on edit
          description: venueInfo.description || undefined,
          address: venueInfo.address,
          city: venueInfo.city,
          postalCode: venueInfo.postalCode,
          latitude: venueInfo.latitude,
          longitude: venueInfo.longitude,
          phone: venueInfo.phone || undefined,
          website: venueInfo.website || undefined,
          startingPrice: venuePricing.startingPrice,
          discountPrice: venuePricing.discountPrice,
          // Set status based on submit type
          status: submitForReview ? 'pending_review' : 'draft'
        }

        if (mode === 'edit' && venue) {
          await updateVenue(venue.id, venueData)
        } else {
          await createVenue(venueData)
        }

        // Navigate based on context
        if (isAdmin) {
          router.push('/admin/venues/list')
        } else {
          router.push('/vendor/venues')
        }
        router.refresh()
      } catch (err) {
        console.error('Error saving venue:', err)
        setError('Failed to save venue. Please try again.')
      }
    })
  }

  return (
    <Grid container spacing={6}>
      {/* Header */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent className='flex flex-wrap justify-between items-center gap-4'>
            <div>
              <Typography variant='h5'>{mode === 'edit' ? 'Edit Venue' : 'Create New Venue'}</Typography>
              <Typography variant='body2'>
                {mode === 'edit' ? 'Update venue information' : 'Add a new venue to your business'}
              </Typography>
            </div>
            <div className='flex gap-4'>
              <Button
                variant='tonal'
                color='secondary'
                onClick={() => router.push(isAdmin ? '/admin/venues/list' : '/vendor/venues')}
                disabled={isPending}
              >
                Cancel
              </Button>

              {/* Admin only gets Save button, Vendor gets Save Draft + Submit */}
              {isAdmin ? (
                <Button variant='contained' onClick={() => handleSubmit(false)} disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              ) : (
                <>
                  <Button variant='outlined' onClick={() => handleSubmit(false)} disabled={isPending}>
                    {isPending ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button variant='contained' onClick={() => handleSubmit(true)} disabled={isPending}>
                    {isPending ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Error Message */}
      {error && (
        <Grid size={{ xs: 12 }}>
          <Card sx={{ bgcolor: 'error.light' }}>
            <CardContent>
              <Typography color='error'>{error}</Typography>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Form Sections */}
      <Grid size={{ xs: 12, md: 9 }}>
        <VenueInformation data={venueInfo} onChange={setVenueInfo} />
      </Grid>

      <Grid size={{ xs: 12, md: 3 }}>
        <Card>
          <CardHeader title='Pricing' />
          <CardContent className='flex flex-col gap-4'>
            <TextField
              fullWidth
              label='Regular Starting Price'
              type='number'
              value={venuePricing.startingPrice}
              onChange={e => setVenuePricing({ ...venuePricing, startingPrice: Number(e.target.value) })}
              InputProps={{
                startAdornment: '$'
              }}
              helperText='Regular starting price for parties'
            />
            <TextField
              fullWidth
              label='BashWish Discount Price (Optional)'
              type='number'
              placeholder='Leave empty if no discount'
              value={venuePricing.discountPrice || ''}
              onChange={e =>
                setVenuePricing({ ...venuePricing, discountPrice: e.target.value ? Number(e.target.value) : undefined })
              }
              InputProps={{
                startAdornment: '$'
              }}
              helperText='💰 Special discounted starting price'
            />
            <Typography variant='caption' color='text.secondary' className='mt-2 block'>
              Note: Specific capacity and age ranges are set per package
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default VenueForm
