'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Chip from '@mui/material/Chip'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { animations } from '@formkit/drag-and-drop'

import type { ServiceImage } from '@prisma/client'
import {
  createServiceImage,
  deleteServiceImage,
  setServiceImageAsPrimary,
  updateServiceImage,
  reorderServiceImages
} from '@/actions/service-image-actions'
import ImageUploader from '@/components/upload/ImageUploader'

interface Props {
  serviceId: string
  serviceName: string
  images: ServiceImage[]
}

const ServiceGalleryManager = ({ serviceId, serviceName, images: initialImages }: Props) => {
  const router = useRouter()
  const [images, setImages] = useState<ServiceImage[]>(initialImages)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ServiceImage | null>(null)
  const [altText, setAltText] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // Initialize drag and drop
  const [galleryRef, imagesList, setImagesList] = useDragAndDrop<HTMLDivElement, ServiceImage>(images, {
    group: 'images',
    plugins: [animations()],
    dragHandle: '.drag-handle'
  })

  // Sync state when drag completes
  useEffect(() => {
    if (imagesList.length > 0 && imagesList !== images) {
      const updates = imagesList.map((img, index) => ({
        id: img.id,
        order: index
      }))

      reorderServiceImages(updates)
        .then(() => router.refresh())
        .catch(error => {
          console.error('Error reordering images:', error)
          setImagesList(initialImages)
        })
    }
  }, [imagesList])

  const handleOpenUploadDialog = () => {
    setAltText('')
    setUploadDialogOpen(true)
  }

  const handleOpenEditDialog = (image: ServiceImage) => {
    setSelectedImage(image)
    setAltText(image.altText || '')
    setEditDialogOpen(true)
  }

  const handleFileUploadComplete = async (url: string, publicId: string) => {
    try {
      const newImage = await createServiceImage({
        serviceId,
        url,
        altText: altText || undefined,
        isPrimary: imagesList.length === 0 // First image is primary
      })
      setImages(prev => [...prev, newImage])
      setImagesList(prev => [...prev, newImage])
      setUploadDialogOpen(false)
      setAltText('')
      router.refresh()
    } catch (error) {
      console.error('Error saving uploaded image:', error)
      alert('Failed to save image')
    }
  }

  const handleFileUploadError = (error: string) => {
    console.error('Upload error:', error)
    alert(`Error uploading image: ${error}`)
  }

  const handleUpdateAltText = async () => {
    if (!selectedImage) return

    setIsUploading(true)
    try {
      const updated = await updateServiceImage(selectedImage.id, { altText })
      setImages(prev => prev.map(img => (img.id === updated.id ? updated : img)))
      setImagesList(prev => prev.map(img => (img.id === updated.id ? updated : img)))
      setEditDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating alt text:', error)
      alert('Failed to update alt text')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image? This action cannot be undone.')) {
      return
    }

    try {
      await deleteServiceImage(id)
      setImages(prev => prev.filter(img => img.id !== id))
      setImagesList(prev => prev.filter(img => img.id !== id))
      router.refresh()
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Failed to delete image')
    }
  }

  const handleSetPrimary = async (id: string) => {
    try {
      const updated = await setServiceImageAsPrimary(id)
      setImages(prev => prev.map(img => ({ ...img, isPrimary: img.id === updated.id })))
      setImagesList(prev => prev.map(img => ({ ...img, isPrimary: img.id === updated.id })))
      router.refresh()
    } catch (error) {
      console.error('Error setting primary image:', error)
      alert('Failed to set primary image')
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          title={`Gallery for ${serviceName}`}
          subheader={`${imagesList.length} image${imagesList.length !== 1 ? 's' : ''} • Drag to reorder`}
          action={
            <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={handleOpenUploadDialog}>
              Add Image
            </Button>
          }
        />

        {imagesList.length === 0 ? (
          <CardContent>
            <div className='flex flex-col items-center justify-center py-12 gap-4'>
              <i className='tabler-photo text-6xl text-textSecondary' />
              <Typography variant='h6' color='text.secondary'>
                No images in your gallery
              </Typography>
              <Typography variant='body2' color='text.secondary' className='text-center max-w-md'>
                Add photos of your service to attract more clients.
              </Typography>
              <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={handleOpenUploadDialog}>
                Add First Image
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <div ref={galleryRef} className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
              {imagesList.map((image, index) => (
                <Box key={image.id} data-id={image.id} className='relative group'>
                  <Badge
                    badgeContent={image.isPrimary ? 'Primary' : null}
                    color='primary'
                    anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                    sx={{
                      width: '100%',
                      '& .MuiBadge-badge': {
                        left: 8,
                        top: 8
                      }
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/9',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: 2,
                        borderColor: 'divider',
                        cursor: 'move',
                        transition: 'border-color 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      {/* Drag Handle */}
                      <Box
                        className='drag-handle'
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 10,
                          bgcolor: 'background.paper',
                          opacity: 0.95,
                          borderRadius: 1,
                          p: 0.75,
                          cursor: 'grab',
                          transition: 'opacity 0.2s',
                          '.group:hover &': {
                            opacity: 1
                          },
                          '&:active': {
                            cursor: 'grabbing'
                          }
                        }}
                      >
                        <i className='tabler-grip-vertical text-lg' />
                      </Box>

                      <img
                        src={image.url}
                        alt={image.altText || 'Service image'}
                        className='w-full h-full object-cover pointer-events-none'
                      />

                      {/* Overlay with actions */}
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          bgcolor: 'rgba(0,0,0,0)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          opacity: 0,
                          transition: 'all 0.2s',
                          '.group:hover &': {
                            bgcolor: 'rgba(0,0,0,0.6)',
                            opacity: 1
                          }
                        }}
                      >
                        <IconButton
                          size='small'
                          sx={{
                            bgcolor: 'background.paper',
                            color: 'text.primary',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              color: 'primary.main'
                            }
                          }}
                          onClick={() => handleOpenEditDialog(image)}
                        >
                          <i className='tabler-edit text-lg' />
                        </IconButton>

                        {!image.isPrimary && (
                          <IconButton
                            size='small'
                            sx={{
                              bgcolor: 'background.paper',
                              color: 'text.primary',
                              '&:hover': {
                                bgcolor: 'warning.main',
                                color: 'warning.contrastText'
                              }
                            }}
                            onClick={() => handleSetPrimary(image.id)}
                          >
                            <i className='tabler-star text-lg' />
                          </IconButton>
                        )}

                        <IconButton
                          size='small'
                          sx={{
                            bgcolor: 'background.paper',
                            color: 'text.primary',
                            '&:hover': {
                              bgcolor: 'error.main',
                              color: 'error.contrastText'
                            }
                          }}
                          onClick={() => handleDelete(image.id)}
                        >
                          <i className='tabler-trash text-lg' />
                        </IconButton>
                      </Box>

                      {/* Order indicator */}
                      <Chip
                        label={`#${index + 1}`}
                        size='small'
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: 'white'
                        }}
                      />
                    </Box>
                  </Badge>

                  {image.altText && (
                    <Typography variant='caption' color='text.secondary' className='mt-1 block truncate'>
                      {image.altText}
                    </Typography>
                  )}
                </Box>
              ))}
            </div>

            <Box
              sx={{
                mt: 6,
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 2,
                border: 1,
                borderColor: 'divider'
              }}
            >
              <Typography variant='body2' color='text.secondary' className='flex items-center gap-2'>
                <i className='tabler-info-circle' />
                <span>
                  <strong>Tip:</strong> Use the <i className='tabler-grip-vertical inline' /> icon to drag and reorder
                  images. The image marked as "Primary" will be displayed first.
                </span>
              </Typography>
            </Box>
          </CardContent>
        )}
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Upload New Image</DialogTitle>
        <DialogContent>
          <div className='flex flex-col gap-4 pt-2'>
            <TextField
              fullWidth
              label='Alt Text (Opcional)'
              value={altText}
              onChange={e => setAltText(e.target.value)}
              placeholder='Image description'
              helperText='Ayuda con SEO y accesibilidad'
            />

            <ImageUploader
              venueId={serviceId}
              onUploadComplete={handleFileUploadComplete}
              onUploadError={handleFileUploadError}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} color='secondary'>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Alt Text Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Edit Alt Text</DialogTitle>
        <DialogContent>
          <div className='flex flex-col gap-4 pt-2'>
            {selectedImage && (
              <div className='w-full aspect-video rounded-lg overflow-hidden border mb-2'>
                <img
                  src={selectedImage.url}
                  alt={selectedImage.altText || 'Image'}
                  className='w-full h-full object-cover'
                />
              </div>
            )}

            <TextField
              fullWidth
              label='Alt Text'
              value={altText}
              onChange={e => setAltText(e.target.value)}
              placeholder='Description of the image'
              helperText='Helps with SEO and accessibility'
              multiline
              rows={2}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color='secondary'>
            Cancel
          </Button>
          <Button onClick={handleUpdateAltText} variant='contained' disabled={isUploading}>
            {isUploading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ServiceGalleryManager
