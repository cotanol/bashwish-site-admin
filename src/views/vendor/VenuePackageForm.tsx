'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
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
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

import { createVenuePackage, updateVenuePackage } from '@/actions/venue-package-actions'
import type { VenuePackageWithRelations } from '@/actions/venue-package-actions'

interface Theme {
  id: string
  name: string
  slug: string
}

interface Props {
  venueId: string
  venueName: string
  themes: Theme[]
  mode: 'create' | 'edit'
  packageData?: VenuePackageWithRelations
}

const genderOptions = [
  { value: 'neutral', label: 'Neutral (Any)', icon: '👥' },
  { value: 'boy', label: 'Boys', icon: '👦' },
  { value: 'girl', label: 'Girls', icon: '👧' }
]

export default function VenuePackageForm({ venueId, venueName, themes, mode, packageData }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

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
        let result

        if (mode === 'create') {
          result = await createVenuePackage(venueId, formData)
        } else {
          result = await updateVenuePackage(packageData!.id, formData)
        }

        if (result.success) {
          router.push(`/vendor/venues/${venueId}/packages`)
        } else {
          setError(result.error || 'Failed to save package')
        }
      } catch (err) {
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
      <Grid container spacing={6}>
        {/* Header */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader
              title={
                <div className='flex items-center gap-2'>
                  <i className='tabler-package text-2xl' />
                  <div>
                    <Typography variant='h5'>{mode === 'create' ? 'Create New Package' : 'Edit Package'}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      For venue: {venueName}
                    </Typography>
                  </div>
                </div>
              }
            />
          </Card>
        </Grid>

        {error && (
          <Grid size={{ xs: 12 }}>
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Basic Information */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader title='Basic Information' />
            <CardContent>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label='Package Name'
                    placeholder='e.g., Birthday Party Premium'
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
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
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Capacity & Age Filters */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader title='Kids Capacity' subheader='How many kids can participate' />
            <CardContent>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type='number'
                    label='Minimum Kids'
                    value={formData.minKids}
                    onChange={e => setFormData({ ...formData, minKids: Number(e.target.value) })}
                    inputProps={{ min: 1 }}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type='number'
                    label='Maximum Kids'
                    value={formData.maxKids}
                    onChange={e => setFormData({ ...formData, maxKids: Number(e.target.value) })}
                    inputProps={{ min: 1 }}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant='caption' color='text.secondary'>
                    💡 This will appear in search filters when parents search for venues
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader title='Age Range' subheader='Recommended age for kids' />
            <CardContent>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type='number'
                    label='Minimum Age'
                    value={formData.ageMin}
                    onChange={e => setFormData({ ...formData, ageMin: Number(e.target.value) })}
                    inputProps={{ min: 0, max: 18 }}
                    InputProps={{
                      endAdornment: <InputAdornment position='end'>years</InputAdornment>
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type='number'
                    label='Maximum Age'
                    value={formData.ageMax}
                    onChange={e => setFormData({ ...formData, ageMax: Number(e.target.value) })}
                    inputProps={{ min: 0, max: 18 }}
                    InputProps={{
                      endAdornment: <InputAdornment position='end'>years</InputAdornment>
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant='caption' color='text.secondary'>
                    💡 Leave blank for all ages
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Gender Focus */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader title='Gender Focus' subheader='Is this package better suited for boys, girls, or any?' />
            <CardContent>
              <TextField
                select
                fullWidth
                value={formData.gender_focus}
                onChange={e => setFormData({ ...formData, gender_focus: e.target.value as any })}
              >
                {genderOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    <span className='flex items-center gap-2'>
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </span>
                  </MenuItem>
                ))}
              </TextField>

              <Typography variant='caption' color='text.secondary' className='mt-2 block'>
                💡 This helps parents find packages that match their child's interests
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Themes Selection */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader title='Party Themes' subheader='Select all themes that apply to this package' />
            <CardContent>
              <FormControl component='fieldset' fullWidth>
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

              {formData.themeIds.length > 0 && (
                <div className='mt-4'>
                  <Typography variant='caption' color='text.secondary' className='mb-2 block'>
                    Selected themes:
                  </Typography>
                  <div className='flex flex-wrap gap-2'>
                    {formData.themeIds.map(themeId => {
                      const theme = themes.find(t => t.id === themeId)
                      return theme ? (
                        <Chip
                          key={themeId}
                          label={theme.name}
                          onDelete={() => handleThemeToggle(themeId)}
                          color='primary'
                          variant='outlined'
                        />
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardActions className='justify-between'>
              <Button
                variant='outlined'
                color='secondary'
                onClick={() => router.push(`/vendor/venues/${venueId}/packages`)}
                disabled={isPending}
              >
                Cancel
              </Button>

              <Button type='submit' variant='contained' disabled={isPending} startIcon={<i className='tabler-check' />}>
                {isPending ? 'Saving...' : mode === 'create' ? 'Create Package' : 'Update Package'}
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </form>
  )
}
