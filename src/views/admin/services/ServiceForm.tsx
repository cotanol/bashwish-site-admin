'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
// 1. Importamos dynamic para cargar el mapa sin SSR
import dynamic from 'next/dynamic'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography' // Agregado para títulos del mapa

import type { SerializedServiceWithRelations, SerializedServiceWithFullRelations } from '@/actions/service-actions'
import { createService, updateService } from '@/actions/service-actions'

// 2. Importación dinámica del mismo componente LeafletMap que ya creaste
// Ajusta la ruta si está en components: por ejemplo '@/components/LeafletMap'
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
        borderRadius: '8px'
      }}
    >
      <Typography color='text.secondary'>Loading Map...</Typography>
    </div>
  )
})

interface Props {
  serviceData?: SerializedServiceWithRelations | SerializedServiceWithFullRelations
  mode: 'create' | 'edit'
}

const ServiceForm = ({ serviceData, mode }: Props) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    name: serviceData?.name || '',
    slug: serviceData?.slug || '',
    description: serviceData?.description || '',
    website: serviceData?.website || '',
    phone: serviceData?.phone || '',
    address: serviceData?.address || '',
    city: serviceData?.city || '',
    state: serviceData?.state || '',
    postalCode: serviceData?.postalCode || '',
    latitude: serviceData?.latitude?.toString() || '',
    longitude: serviceData?.longitude?.toString() || '',
    startingPrice: serviceData?.startingPrice?.toString() || '',
    discountPrice: serviceData?.discountPrice?.toString() || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      setFormData(prev => ({ ...prev, name: value, slug }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // 3. Nuevo handler para conectar el Mapa con el Formulario
  const handleMapChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      // Convertimos a string porque tus inputs de texto esperan strings
      latitude: lat.toString(),
      longitude: lng.toString()
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required'
    if (formData.startingPrice && isNaN(Number(formData.startingPrice))) {
      newErrors.startingPrice = 'Starting price must be a valid number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    startTransition(async () => {
      try {
        const payload = {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          website: formData.website || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          postalCode: formData.postalCode || undefined,
          latitude: formData.latitude ? Number(formData.latitude) : undefined,
          longitude: formData.longitude ? Number(formData.longitude) : undefined,
          startingPrice: formData.startingPrice ? Number(formData.startingPrice) : undefined,
          discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined
        }

        if (mode === 'create') {
          const service = await createService(payload)
          // Ajusta esta ruta según tu estructura real
          router.push(`/admin/services/edit/${service.id}`)
        } else {
          if (!serviceData?.id) return
          await updateService(serviceData.id, payload)
          router.refresh()
        }
      } catch (error) {
        console.error('Error saving service:', error)
        alert('Failed to save service. Please try again.')
      }
    })
  }

  return (
    <Card>
      <CardHeader
        title={mode === 'create' ? 'Create New Service' : 'Edit Service'}
        subheader={mode === 'create' ? 'Fill in the basic information' : 'Update service information'}
      />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            {/* ... CAMPOS ANTERIORES (Name, Slug, Desc, Website, Phone) SE MANTIENEN IGUAL ... */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label='Service Name'
                placeholder='e.g. Professional Photography'
                value={formData.name}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                required
                disabled={isPending}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label='Slug'
                value={formData.slug}
                onChange={handleChange('slug')}
                error={!!errors.slug}
                helperText={errors.slug}
                required
                disabled={isPending}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label='Description'
                value={formData.description}
                onChange={handleChange('description')}
                disabled={isPending}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label='Website'
                value={formData.website}
                onChange={handleChange('website')}
                disabled={isPending}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label='Phone'
                value={formData.phone}
                onChange={handleChange('phone')}
                disabled={isPending}
              />
            </Grid>

            {/* SECCIÓN DE DIRECCIÓN */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Address'
                value={formData.address}
                onChange={handleChange('address')}
                disabled={isPending}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label='City'
                value={formData.city}
                onChange={handleChange('city')}
                disabled={isPending}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label='State'
                value={formData.state}
                onChange={handleChange('state')}
                disabled={isPending}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label='ZIP Code'
                value={formData.postalCode}
                onChange={handleChange('postalCode')}
                disabled={isPending}
              />
            </Grid>

            {/* 4. SECCIÓN DEL MAPA INTEGRADA */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='body2' className='font-medium mbe-1 mbs-4'>
                📍 Service Location
              </Typography>
              <Typography variant='caption' color='text.secondary' className='block mbe-2'>
                Drag the marker to set the exact location for this service.
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <div style={{ height: '400px', width: '100%', marginBottom: '16px' }}>
                <MapPicker
                  // Convertimos los strings del form a numbers para el mapa
                  // Si está vacío, pasamos undefined para que use el default
                  lat={formData.latitude ? parseFloat(formData.latitude) : undefined}
                  lng={formData.longitude ? parseFloat(formData.longitude) : undefined}
                  onPositionChange={handleMapChange}
                />
              </div>
            </Grid>

            {/* INPUTS DE LAT/LONG (Se actualizan solos) */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label='Latitude'
                placeholder='29.7604'
                value={formData.latitude}
                onChange={handleChange('latitude')}
                helperText='Latitude'
                disabled={isPending}
                type='number' // Recomendado poner type number
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label='Longitude'
                placeholder='-95.3698'
                value={formData.longitude}
                onChange={handleChange('longitude')}
                helperText='Longitude'
                disabled={isPending}
                type='number'
              />
            </Grid>

            {/* PRECIOS */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label='Regular Starting Price'
                value={formData.startingPrice}
                onChange={handleChange('startingPrice')}
                error={!!errors.startingPrice}
                helperText={errors.startingPrice}
                disabled={isPending}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label='BashWish Discount Price'
                value={formData.discountPrice}
                onChange={handleChange('discountPrice')}
                disabled={isPending}
              />
            </Grid>

            {/* BOTONES */}
            <Grid size={{ xs: 12 }}>
              <div className='flex gap-4'>
                <Button
                  variant='contained'
                  type='submit'
                  disabled={isPending}
                  startIcon={isPending ? <CircularProgress size={20} /> : null}
                >
                  {isPending ? 'Saving...' : mode === 'create' ? 'Create Service' : 'Update Service'}
                </Button>
                <Button variant='tonal' color='secondary' onClick={() => router.back()} disabled={isPending}>
                  Cancel
                </Button>
              </div>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default ServiceForm
