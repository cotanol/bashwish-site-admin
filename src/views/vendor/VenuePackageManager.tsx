'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

import type { VenuePackageWithRelations } from '@/actions/venue-package-actions'
import { deleteVenuePackage } from '@/actions/venue-package-actions'

interface Props {
  venueId: string
  venueName: string
  packages: VenuePackageWithRelations[]
  userId: string
}

const VenuePackageManager = ({ venueId, venueName, packages, userId }: Props) => {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (packageId: string) => {
    if (!confirm('Delete this package? This action cannot be undone.')) {
      return
    }

    setIsDeleting(packageId)
    try {
      await deleteVenuePackage(packageId, userId)
      router.refresh()
    } catch (error) {
      console.error('Error deleting package:', error)
      alert('Failed to delete package')
    } finally {
      setIsDeleting(null)
    }
  }

  const formatPrice = (price: any) => {
    return `$${Number(price).toFixed(2)}`
  }

  const getGenderChipColor = (gender: string) => {
    switch (gender) {
      case 'boy':
        return 'info'
      case 'girl':
        return 'error'
      default:
        return 'default'
    }
  }

  return (
    <Grid container spacing={6}>
      {/* Header */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title={`Packages for ${venueName}`}
            subheader={`${packages.length} package${packages.length !== 1 ? 's' : ''} configured`}
            action={
              <Button
                variant='contained'
                startIcon={<i className='tabler-plus' />}
                onClick={() => router.push(`/vendor/venues/${venueId}/packages/create`)}
              >
                Add Package
              </Button>
            }
          />
        </Card>
      </Grid>

      {/* Empty State */}
      {packages.length === 0 && (
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent className='text-center py-12'>
              <i className='tabler-package text-6xl text-textSecondary mb-4' />
              <Typography variant='h5' className='mb-2'>
                No Packages Yet
              </Typography>
              <Typography variant='body2' color='text.secondary' className='mb-6'>
                Create your first package to start accepting bookings for this venue
              </Typography>
              <Button
                variant='contained'
                size='large'
                startIcon={<i className='tabler-plus' />}
                onClick={() => router.push(`/vendor/venues/${venueId}/packages/create`)}
              >
                Create First Package
              </Button>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Packages Table */}
      {packages.length > 0 && (
        <Grid size={{ xs: 12 }}>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Package Name</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Age Range</TableCell>
                    <TableCell>Gender Focus</TableCell>
                    <TableCell>Themes</TableCell>
                    <TableCell align='right'>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {packages.map(pkg => (
                    <TableRow key={pkg.id}>
                      <TableCell>
                        <Typography variant='body1' className='font-medium'>
                          {pkg.name}
                        </Typography>
                        {pkg.description && (
                          <Typography variant='body2' color='text.secondary' className='line-clamp-1'>
                            {pkg.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant='body1' className='font-medium'>
                          {formatPrice(pkg.price)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {pkg.minKids === pkg.maxKids ? `${pkg.minKids} kids` : `${pkg.minKids}-${pkg.maxKids} kids`}
                      </TableCell>
                      <TableCell>
                        {pkg.ageMin === pkg.ageMax ? `${pkg.ageMin} years` : `${pkg.ageMin}-${pkg.ageMax} years`}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={pkg.gender_focus}
                          color={getGenderChipColor(pkg.gender_focus)}
                          size='small'
                          variant='tonal'
                        />
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-wrap gap-1'>
                          {pkg.themes.slice(0, 3).map(({ theme }) => (
                            <Chip key={theme.id} label={theme.name} size='small' variant='outlined' />
                          ))}
                          {pkg.themes.length > 3 && (
                            <Chip label={`+${pkg.themes.length - 3}`} size='small' variant='outlined' />
                          )}
                        </div>
                      </TableCell>
                      <TableCell align='right'>
                        <IconButton
                          size='small'
                          onClick={() => router.push(`/vendor/venues/${venueId}/packages/${pkg.id}/edit`)}
                          disabled={isDeleting === pkg.id}
                        >
                          <i className='tabler-edit' />
                        </IconButton>
                        <IconButton
                          size='small'
                          color='error'
                          onClick={() => handleDelete(pkg.id)}
                          disabled={isDeleting === pkg.id}
                        >
                          <i className='tabler-trash' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      )}
    </Grid>
  )
}

export default VenuePackageManager
