'use client'

import { useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import { vendorToggleVenueActive } from '@/actions'

type Props = {
  venueId: string
  venueName: string
  isActive: boolean
  isBlockedByAdmin: boolean
  blockReason: string | null
  userId: string
  onUpdate?: () => void
}

export default function VenueActivationCard({
  venueId,
  venueName,
  isActive,
  isBlockedByAdmin,
  blockReason,
  userId,
  onUpdate
}: Props) {
  const [active, setActive] = useState(isActive)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToggle = async () => {
    if (isBlockedByAdmin) return

    setLoading(true)
    setError(null)

    try {
      const result = await vendorToggleVenueActive(venueId, userId)
      setActive(result.venue.isActive)
      if (onUpdate) setTimeout(() => onUpdate(), 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
      setActive(!active)
    } finally {
      setLoading(false)
    }
  }

  if (isBlockedByAdmin) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>
            <Typography variant='body2' className='font-bold mb-2'>
              Venue Blocked by Admin
            </Typography>
            <Typography variant='body2'>{blockReason || 'Contact support at hello@bashwish.com'}</Typography>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Box className='flex items-center justify-between'>
          <Box>
            <Typography variant='h6'>Venue Status</Typography>
            <Typography variant='body2' color='text.secondary'>
              {active ? 'Your venue is visible to customers' : 'Your venue is hidden from customers'}
            </Typography>
          </Box>
          <Box className='flex items-center gap-3'>
            <Chip label={active ? 'Active' : 'Paused'} color={active ? 'success' : 'default'} size='small' />
            <FormControlLabel
              control={<Switch checked={active} onChange={handleToggle} disabled={loading} color='success' />}
              label=''
            />
          </Box>
        </Box>
        {error && (
          <Alert severity='error' className='mt-3' onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
