'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

type VenueCapacityProps = {
  data?: {
    minKids: number
    maxKids: number
    ageMin: number | null
    ageMax: number | null
    startingPrice: number
  }
  onChange?: (data: any) => void
}

const VenueCapacity = ({ data, onChange }: VenueCapacityProps) => {
  const [formData, setFormData] = useState(
    data || {
      minKids: 10,
      maxKids: 50,
      ageMin: null,
      ageMax: null,
      startingPrice: 0
    }
  )

  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onChange?.(newData)
  }

  return (
    <Card>
      <CardHeader title='Capacity & Pricing' />
      <CardContent>
        <Grid container spacing={5}>
          <Grid size={{ xs: 12 }}>
            <Typography variant='body2' className='font-medium mbe-1'>
              Kids Capacity
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              type='number'
              label='Minimum Kids'
              placeholder='10'
              value={formData.minKids}
              onChange={e => handleChange('minKids', parseInt(e.target.value) || 0)}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              type='number'
              label='Maximum Kids'
              placeholder='50'
              value={formData.maxKids}
              onChange={e => handleChange('maxKids', parseInt(e.target.value) || 0)}
              required
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant='body2' className='font-medium mbe-1'>
              Age Range (Optional)
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              type='number'
              label='Minimum Age'
              placeholder='3'
              value={formData.ageMin || ''}
              onChange={e => handleChange('ageMin', e.target.value ? parseInt(e.target.value) : null)}
              InputProps={{
                endAdornment: <InputAdornment position='end'>years</InputAdornment>
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              type='number'
              label='Maximum Age'
              placeholder='12'
              value={formData.ageMax || ''}
              onChange={e => handleChange('ageMax', e.target.value ? parseInt(e.target.value) : null)}
              InputProps={{
                endAdornment: <InputAdornment position='end'>years</InputAdornment>
              }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant='body2' className='font-medium mbe-1'>
              Pricing
            </Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              type='number'
              label='Starting Price'
              placeholder='299'
              value={formData.startingPrice}
              onChange={e => handleChange('startingPrice', parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: <InputAdornment position='start'>$</InputAdornment>
              }}
              required
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default VenueCapacity
