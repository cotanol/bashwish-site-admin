'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

import type { SerializedServiceWithRelations } from '@/actions/service-actions'
import { toggleServicePublished, toggleServiceFeatured } from '@/actions/service-actions'

interface Props {
  serviceData: SerializedServiceWithRelations[]
}

const ServiceListTable = ({ serviceData }: Props) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [services, setServices] = useState<SerializedServiceWithRelations[]>(serviceData)

  const handleTogglePublished = async (serviceId: string) => {
    // Optimistic update - instant UI feedback
    setServices(prevServices =>
      prevServices.map(service =>
        service.id === serviceId ? { ...service, isPublished: !service.isPublished } : service
      )
    )

    // Background sync
    startTransition(async () => {
      try {
        await toggleServicePublished(serviceId)
        router.refresh()
      } catch (error) {
        // Revert on error
        setServices(prevServices =>
          prevServices.map(service =>
            service.id === serviceId ? { ...service, isPublished: !service.isPublished } : service
          )
        )
        console.error('Error toggling published status:', error)
        alert('Failed to update service status')
      }
    })
  }

  const handleToggleFeatured = async (serviceId: string) => {
    // Optimistic update - instant UI feedback
    setServices(prevServices =>
      prevServices.map(service =>
        service.id === serviceId ? { ...service, isFeatured: !service.isFeatured } : service
      )
    )

    // Background sync
    startTransition(async () => {
      try {
        await toggleServiceFeatured(serviceId)
        router.refresh()
      } catch (error) {
        // Revert on error
        setServices(prevServices =>
          prevServices.map(service =>
            service.id === serviceId ? { ...service, isFeatured: !service.isFeatured } : service
          )
        )
        console.error('Error toggling featured status:', error)
        alert('Failed to update featured status')
      }
    })
  }

  const getPrimaryImage = (service: SerializedServiceWithRelations) => {
    const primary = service.images.find(img => img.isPrimary)
    return primary?.url || service.images[0]?.url || '/images/placeholder.jpg'
  }

  return (
    <>
      <Card>
        <CardHeader
          title='Services'
          subheader={`${services.length} total services`}
          action={
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => router.push('/admin/services/add')}
            >
              Add Service
            </Button>
          }
        />
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Packages</TableCell>
                  <TableCell>Reviews</TableCell>
                  <TableCell>Published</TableCell>
                  <TableCell>Featured</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align='center'>
                      <Typography variant='body2' color='text.secondary' className='py-12'>
                        No services found. Click "Add Service" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map(service => (
                    <TableRow key={service.id} hover>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <img
                            src={getPrimaryImage(service)}
                            alt={service.name}
                            className='w-12 h-12 object-cover rounded'
                          />
                          <div>
                            <Typography variant='body1' className='font-medium'>
                              {service.name}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {service.slug}
                            </Typography>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {service.startingPrice ? (
                          <Typography variant='body2'>${service.startingPrice}</Typography>
                        ) : (
                          <Typography variant='body2' color='text.secondary'>
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={service.packages.length} size='small' variant='tonal' />
                      </TableCell>
                      <TableCell>
                        <Chip label={service._count?.reviews || 0} size='small' variant='tonal' color='primary' />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={service.isPublished}
                          onChange={() => handleTogglePublished(service.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={service.isFeatured}
                          onChange={() => handleToggleFeatured(service.id)}
                        />
                      </TableCell>
                      <TableCell align='right'>
                        <IconButton
                          size='small'
                          onClick={() => router.push(`/admin/services/edit/${service.id}`)}
                        >
                          <i className='tabler-edit' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </>
  )
}

export default ServiceListTable
