'use client'

import { useState, useTransition, useEffect } from 'react'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

import { createServicePackage, updateServicePackage } from '@/actions/service-package-actions'
import type { ServicePackage, ServicePackageTheme, Theme as PrismaTheme } from '@prisma/client'

type PackageWithThemes = Omit<ServicePackage, 'price'> & {
  price: number
  themes: (ServicePackageTheme & {
    theme: PrismaTheme
  })[]
}

interface Theme {
  id: string
  name: string
  slug: string
}

interface Props {
  serviceId: string
  packageData?: PackageWithThemes | null
  onSuccess?: () => void
  onCancel?: () => void
}

const genderOptions = [
  { value: 'neutral', label: 'Neutral (Any)', icon: '👥' },
  { value: 'boy', label: 'Boys', icon: '👦' },
  { value: 'girl', label: 'Girls', icon: '👧' }
]

export default function ServicePackageForm({ serviceId, packageData, onSuccess, onCancel }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [themes, setThemes] = useState<Theme[]>([])

  // Form state
  const [formData, setFormData] = useState({
    name: packageData?.name || '',
    description: packageData?.description || '',
    price: packageData?.price ? Number(packageData.price) : 0,
    discountPrice: packageData?.discountPrice ? Number(packageData.discountPrice) : undefined,
    minKids: packageData?.minKids || 1,
    maxKids: packageData?.maxKids || 10,
    ageMin: packageData?.ageMin || 1,
    ageMax: packageData?.ageMax || 12,
    gender_focus: packageData?.gender_focus || 'neutral',
    themeIds: packageData?.themes?.map(t => t.themeId) || []
  })

  // Update form when packageData changes
  useEffect(() => {
    if (packageData) {
      setFormData({
        name: packageData.name || '',
        description: packageData.description || '',
        price: packageData.price ? Number(packageData.price) : 0,
        discountPrice: packageData.discountPrice ? Number(packageData.discountPrice) : undefined,
        minKids: packageData.minKids || 1,
        maxKids: packageData.maxKids || 10,
        ageMin: packageData.ageMin || 1,
        ageMax: packageData.ageMax || 12,
        gender_focus: packageData.gender_focus || 'neutral',
        themeIds: packageData.themes?.map(t => t.themeId) || []
      })
    }
  }, [packageData])

  // Fetch themes
  useEffect(() => {
    async function fetchThemes() {
      try {
        const response = await fetch('/api/themes')
        if (response.ok) {
          const data = await response.json()
          setThemes(data.themes || [])
        }
      } catch (error) {
        console.error('Error fetching themes:', error)
      }
    }
    fetchThemes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validations
    if (!formData.name.trim()) {
      setError('Package name is required')
      return
    }

    if (formData.price <= 0) {
      setError('Price must be greater than 0')
      return
    }

    if (formData.minKids > formData.maxKids) {
      setError('Minimum kids cannot be greater than maximum kids')
      return
    }

    if (formData.ageMin && formData.ageMax && formData.ageMin > formData.ageMax) {
      setError('Minimum age cannot be greater than maximum age')
      return
    }

    if (formData.themeIds.length === 0) {
      setError('Please select at least one theme')
      return
    }

    startTransition(async () => {
      try {
        console.log('=== SUBMITTING PACKAGE FORM ===')
        console.log('Package Data (editing):', packageData?.id)
        console.log('Form Data:', JSON.stringify(formData, null, 2))

        if (!packageData) {
          // Create - needs all data including serviceId
          await createServicePackage({
            serviceId,
            ...formData
          })
        } else {
          // Update - exclude serviceId
          console.log('Updating package ID:', packageData.id)
          await updateServicePackage(packageData.id, formData)
        }

        console.log('Success!')
        // Success - close dialog
        onSuccess?.()
      } catch (err) {
        console.error('Error submitting form:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    })
  }

  const handleThemeToggle = (themeId: string) => {
    setFormData(prev => ({
      ...prev,
      themeIds: prev.themeIds.includes(themeId)
        ? prev.themeIds.filter(id => id !== themeId)
        : [...prev.themeIds, themeId]
    }))
  }

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={4} className='mt-2'>
        {error && (
          <Grid size={{ xs: 12 }}>
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Basic Information */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label='Package Name'
            placeholder='e.g., Magic Show Premium'
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label='Description'
            placeholder='Describe what this package includes...'
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type='number'
            label='Regular Price'
            value={formData.price}
            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
            InputProps={{
              startAdornment: <InputAdornment position='start'>$</InputAdornment>
            }}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type='number'
            label='BashWish Discount Price (Optional)'
            placeholder='Leave empty if no discount'
            value={formData.discountPrice || ''}
            onChange={e => setFormData({ ...formData, discountPrice: e.target.value ? Number(e.target.value) : undefined })}
            InputProps={{
              startAdornment: <InputAdornment position='start'>$</InputAdornment>
            }}
            helperText='💰 Special discounted price exclusive to BashWish customers'
          />
        </Grid>

        {/* Capacity */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            select
            label='Gender Focus'
            value={formData.gender_focus}
            onChange={e => setFormData({ ...formData, gender_focus: e.target.value as 'neutral' | 'boy' | 'girl' })}
          >
            {genderOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.icon} {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            fullWidth
            type='number'
            label='Min Kids'
            value={formData.minKids}
            onChange={e => setFormData({ ...formData, minKids: Number(e.target.value) })}
            InputProps={{ inputProps: { min: 1 } }}
            required
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            fullWidth
            type='number'
            label='Max Kids'
            value={formData.maxKids}
            onChange={e => setFormData({ ...formData, maxKids: Number(e.target.value) })}
            InputProps={{ inputProps: { min: 1 } }}
            required
          />
        </Grid>

        {/* Age Range */}
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            fullWidth
            type='number'
            label='Min Age'
            value={formData.ageMin}
            onChange={e => setFormData({ ...formData, ageMin: Number(e.target.value) })}
            InputProps={{ inputProps: { min: 0 } }}
            required
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            fullWidth
            type='number'
            label='Max Age'
            value={formData.ageMax}
            onChange={e => setFormData({ ...formData, ageMax: Number(e.target.value) })}
            InputProps={{ inputProps: { min: 0 } }}
            required
          />
        </Grid>

        {/* Party Themes */}
        <Grid size={{ xs: 12 }}>
          <FormControl component='fieldset' fullWidth>
            <FormLabel component='legend' className='mb-3'>
              Party Themes (select at least one) *
            </FormLabel>
            <FormGroup>
              <Grid container spacing={2}>
                {themes.map(theme => (
                  <Grid key={theme.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.themeIds.includes(theme.id)}
                          onChange={() => handleThemeToggle(theme.id)}
                        />
                      }
                      label={theme.name}
                    />
                  </Grid>
                ))}
              </Grid>
            </FormGroup>
          </FormControl>
        </Grid>

        {/* Selected Themes Preview */}
        {formData.themeIds.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant='body2' color='text.secondary' className='mb-2'>
              Selected Themes ({formData.themeIds.length}):
            </Typography>
            <div className='flex flex-wrap gap-2'>
              {formData.themeIds.map(themeId => {
                const theme = themes.find(t => t.id === themeId)
                return theme ? <Chip key={theme.id} label={theme.name} size='small' color='primary' /> : null
              })}
            </div>
          </Grid>
        )}

        {/* Actions */}
        <Grid size={{ xs: 12 }} className='flex gap-4 justify-end'>
          {onCancel && (
            <Button variant='outlined' onClick={onCancel} disabled={isPending}>
              Cancel
            </Button>
          )}
          <Button
            type='submit'
            variant='contained'
            disabled={isPending}
            startIcon={isPending && <CircularProgress size={20} />}
          >
            {isPending ? 'Saving...' : packageData ? 'Update Package' : 'Create Package'}
          </Button>
        </Grid>
      </Grid>
    </form>
  )
}
