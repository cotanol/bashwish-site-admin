'use client'

// React Imports
import { useState } from 'react'
import type { ChangeEvent } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Link from 'next/link'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Actions
import { updateUserProfile, updateVendorInfo } from '@/actions/account-actions'

type Props = {
  user: {
    id: string
    name?: string | null
    email?: string | null
    role?: string
    image?: string | null
  }
  vendor?: {
    id: string
    businessName: string | null
    contactName: string
    phone: string | null
    venues: {
      id: string
      name: string
      slug: string
      status: string
    }[]
    user: {
      id: string
      name: string | null
      email: string | null
    }
  } | null
}

const AccountDetails = ({ user, vendor }: Props) => {
  // States
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState({
    firstName: user.name?.split(' ')[0] || '',
    lastName: user.name?.split(' ').slice(1).join(' ') || '',
    email: user.email || '',
    phone: vendor?.phone || '',
    businessName: vendor?.businessName || '',
    contactEmail: vendor?.user?.email || ''
  })

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Update user profile
    const profileResult = await updateUserProfile({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone
    })

    // Update vendor info if vendor
    if (vendor) {
      const vendorResult = await updateVendorInfo({
        businessName: formData.businessName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.phone
      })

      setLoading(false)

      if (profileResult.success && vendorResult.success) {
        setMessage({ type: 'success', text: 'Profile and business information updated successfully' })
      } else {
        setMessage({
          type: 'error',
          text: !profileResult.success ? profileResult.message : vendorResult.message
        })
      }
    } else {
      setLoading(false)

      if (profileResult.success) {
        setMessage({ type: 'success', text: profileResult.message })
      } else {
        setMessage({ type: 'error', text: profileResult.message })
      }
    }
  }

  return (
    <Card>
      <CardContent>
        {message && (
          <Alert severity={message.type} className='mb-4' onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}
        <form onSubmit={handleSave}>
          <Grid container spacing={6}>
            {/* Role Badge */}
            <Grid size={{ xs: 12 }}>
              <div className='flex items-center gap-2'>
                <Typography variant='body2' color='text.secondary'>
                  Account Type:
                </Typography>
                <Chip
                  label={user.role === 'admin' ? 'Administrator' : 'Vendor'}
                  color={user.role === 'admin' ? 'primary' : 'success'}
                  size='small'
                  variant='tonal'
                />
              </div>
            </Grid>

            {/* Basic Info */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='First Name'
                value={formData.firstName}
                placeholder='John'
                onChange={e => handleFormChange('firstName', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Last Name'
                value={formData.lastName}
                placeholder='Doe'
                onChange={e => handleFormChange('lastName', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Email'
                value={formData.email}
                placeholder='john.doe@gmail.com'
                disabled
                helperText='Email cannot be changed'
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Phone Number'
                value={formData.phone}
                placeholder='+1 (123) 456-7890'
                onChange={e => handleFormChange('phone', e.target.value)}
              />
            </Grid>

            {/* Vendor-specific fields */}
            {vendor && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Typography variant='h6' className='mb-4'>
                    Business Information
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='Business Name'
                    value={formData.businessName}
                    placeholder='My Business'
                    onChange={e => handleFormChange('businessName', e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='Contact Email'
                    value={formData.contactEmail}
                    placeholder='contact@business.com'
                    onChange={e => handleFormChange('contactEmail', e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <div className='flex items-center gap-2'>
                    <Typography variant='body2' color='text.secondary'>
                      Venues:
                    </Typography>
                    {vendor.venues.length > 0 ? (
                      vendor.venues.map(venue => (
                        <Chip
                          key={venue.id}
                          label={venue.name}
                          component={Link}
                          href={`/vendor/venues`}
                          clickable
                          color='primary'
                          variant='outlined'
                          size='small'
                        />
                      ))
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        No venues yet
                      </Typography>
                    )}
                  </div>
                </Grid>
              </>
            )}

            {/* Save Button */}
            <Grid size={{ xs: 12 }} className='flex gap-4 flex-wrap'>
              <Button variant='contained' type='submit' disabled={loading}>
                {loading ? <CircularProgress size={20} color='inherit' /> : 'Save Changes'}
              </Button>
              <Button
                variant='tonal'
                color='secondary'
                type='button'
                onClick={() =>
                  setFormData({
                    firstName: user.name?.split(' ')[0] || '',
                    lastName: user.name?.split(' ').slice(1).join(' ') || '',
                    email: user.email || '',
                    phone: vendor?.phone || '',
                    businessName: vendor?.businessName || '',
                    contactEmail: vendor?.user?.email || ''
                  })
                }
                disabled={loading}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default AccountDetails
