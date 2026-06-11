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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'

import type { ServicePackage, ServicePackageTheme, Theme } from '@prisma/client'
import { deleteServicePackage } from '@/actions/service-package-actions'
import ServicePackageForm from '@/views/admin/services/ServicePackageForm'

type PackageWithThemes = Omit<ServicePackage, 'price'> & {
  price: number
  themes: (ServicePackageTheme & {
    theme: Theme
  })[]
}

interface Props {
  serviceId: string
  serviceName: string
  packages: PackageWithThemes[]
}

const ServicePackageManager = ({ serviceId, serviceName, packages }: Props) => {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<PackageWithThemes | null>(null)

  const handleOpenDialog = (pkg?: PackageWithThemes) => {
    setEditingPackage(pkg || null)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingPackage(null)
    // Use router.refresh() to reload data without full page refresh
    router.refresh()
  }

  const handleDelete = async (packageId: string) => {
    if (!confirm('Delete this package? This action cannot be undone.')) {
      return
    }

    setIsDeleting(packageId)
    try {
      await deleteServicePackage(packageId)
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
            title={`Packages for ${serviceName}`}
            subheader={`${packages.length} package${packages.length !== 1 ? 's' : ''} configured`}
            action={
              <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => handleOpenDialog()}>
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
                Create your first package to showcase different service options
              </Typography>
              <Button
                variant='contained'
                size='large'
                startIcon={<i className='tabler-plus' />}
                onClick={() => handleOpenDialog()}
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
                          {pkg.themes && pkg.themes.length > 0 ? (
                            <>
                              {pkg.themes.slice(0, 3).map(({ theme }) => (
                                <Chip key={theme.id} label={theme.name} size='small' variant='outlined' />
                              ))}
                              {pkg.themes.length > 3 && (
                                <Chip label={`+${pkg.themes.length - 3}`} size='small' variant='outlined' />
                              )}
                            </>
                          ) : (
                            <Typography variant='body2' color='text.secondary'>
                              No themes
                            </Typography>
                          )}
                        </div>
                      </TableCell>
                      <TableCell align='right'>
                        <IconButton size='small' onClick={() => handleOpenDialog(pkg)} disabled={isDeleting === pkg.id}>
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

      {/* Package Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth='md' fullWidth>
        <DialogTitle>{editingPackage ? 'Edit Package' : 'Create New Package'}</DialogTitle>
        <DialogContent>
          <ServicePackageForm
            serviceId={serviceId}
            packageData={editingPackage}
            onSuccess={handleCloseDialog}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </Grid>
  )
}

export default ServicePackageManager
