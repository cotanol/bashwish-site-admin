'use client'

// React Imports
import { useState } from 'react'
import dynamic from 'next/dynamic' // 1. Importamos dynamic

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// 2. Definimos el MapPicker dinámico (sin SSR)
// Asumimos que LeafletMap.tsx está en la misma carpeta. Si no, ajusta la ruta.
const MapPicker = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '400px',
        width: '100%',
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        color: '#aaa'
      }}
    >
      Loading Map...
    </div>
  )
})

type VenueInformationProps = {
  data?: {
    name: string
    description: string
    address: string
    city: string
    postalCode: string
    phone: string
    website: string
    latitude?: number
    longitude?: number
  }
  onChange?: (data: any) => void
}

const VenueInformation = ({ data, onChange }: VenueInformationProps) => {
  const [formData, setFormData] = useState(
    data || {
      name: '',
      description: '',
      address: '',
      city: 'Houston',
      postalCode: '',
      phone: '',
      website: '',
      latitude: undefined,
      longitude: undefined
    }
  )

  // Maneja inputs de texto normales
  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onChange?.(newData)
  }

  // 3. Maneja la actualización desde el Mapa (Drag & Drop)
  const handleMapChange = (lat: number, lng: number) => {
    const newData = { ...formData, latitude: lat, longitude: lng }
    setFormData(newData)
    onChange?.(newData)
  }

  return (
    <Card>
      <CardHeader title='Venue Information' />
      <CardContent>
        <Grid container spacing={5}>
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label='Venue Name'
              placeholder='Enter venue name'
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              required
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label='Description'
              placeholder='Enter venue description'
              multiline
              rows={4}
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant='body2' className='font-medium mbe-1'>
              Location
            </Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label='Address'
              placeholder='Street address'
              value={formData.address}
              onChange={e => handleChange('address', e.target.value)}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='City'
              placeholder='Houston'
              value={formData.city}
              onChange={e => handleChange('city', e.target.value)}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='ZIP Code'
              placeholder='77001'
              value={formData.postalCode}
              onChange={e => handleChange('postalCode', e.target.value)}
              required
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant='body2' className='font-medium mbe-1'>
              Contact Information
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Phone'
              placeholder='(555) 123-4567'
              value={formData.phone}
              onChange={e => handleChange('phone', e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Website'
              placeholder='https://www.example.com'
              value={formData.website}
              onChange={e => handleChange('website', e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant='body2' className='font-medium mbe-1 mbs-4'>
              📍 Map Coordinates (Optional)
            </Typography>
            <Typography variant='caption' color='text.secondary' className='block mbe-2'>
              Drag the marker to set the exact location on the map.
            </Typography>
          </Grid>

          {/* 4. Renderizamos el Mapa Visual */}
          <Grid size={{ xs: 12 }}>
            <div style={{ height: '400px', width: '100%', marginBottom: '16px' }}>
              <MapPicker lat={formData.latitude} lng={formData.longitude} onPositionChange={handleMapChange} />
            </div>
          </Grid>

          {/* Inputs Manuales (Sincronizados) */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Latitude'
              placeholder='29.7604'
              type='number'
              inputProps={{ step: 'any' }}
              // Usamos ?? '' para evitar warning de componente no controlado si es undefined
              value={formData.latitude ?? ''}
              onChange={e => handleChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
              helperText='Example: 29.7604 (Houston, TX)'
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Longitude'
              placeholder='-95.3698'
              type='number'
              inputProps={{ step: 'any' }}
              value={formData.longitude ?? ''}
              onChange={e => handleChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
              helperText='Example: -95.3698 (Houston, TX)'
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default VenueInformation
