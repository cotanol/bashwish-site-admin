'use client'

import { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import { useRouter } from 'next/navigation'
import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { animations } from '@formkit/drag-and-drop'

import type { VenueImage } from '@prisma/client'
import {
  addVenueImage,
  deleteVenueImage,
  setPrimaryImage,
  updateVenueImage,
  reorderVenueImages
} from '@/actions/venue-image-actions'
import ImageUploader from '@/components/upload/ImageUploader'

interface Props {
  venueId: string
  images: VenueImage[]
}

const VendorImageGallery = ({ venueId, images: initialImages }: Props) => {
  const router = useRouter()
  const [images, setImages] = useState<VenueImage[]>(initialImages)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<VenueImage | null>(null)
  const [altText, setAltText] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // Initialize drag and drop
  const [galleryRef, imagesList, setImagesList] = useDragAndDrop<HTMLDivElement, VenueImage>(images, {
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

      reorderVenueImages(updates)
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

  const handleOpenEditDialog = (image: VenueImage) => {
    setSelectedImage(image)
    setAltText(image.altText || '')
    setEditDialogOpen(true)
  }

  const handleFileUploadComplete = async (url: string, publicId: string) => {
    try {
      const newImage = await addVenueImage({
        venueId,
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
      const updated = await updateVenueImage(selectedImage.id, { altText })
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
      await deleteVenueImage(id)
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
      const updated = await setPrimaryImage(id)
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
          title='Image Gallery'
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
                Add photos of your venue to attract more customers. The first image you mark as primary will be displayed in searches.
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
                        alt={image.altText || 'Venue image'}
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
                mt: 3,
                p: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: 1,
                borderColor: 'divider'
              }}
            >
              <Typography variant='body2' color='text.secondary' className='flex items-center gap-2'>
                <i className='tabler-info-circle' />
                <span>
                  <strong>Tip:</strong> Drag images to reorder them. The image marked as "Primary" will
                  be displayed first in searches and results.
                </span>
              </Typography>
            </Box>
          </CardContent>
        )}
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Add New Image</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <ImageUploader
              venueId={venueId}
              onUploadComplete={handleFileUploadComplete}
              onUploadError={handleFileUploadError}
              maxFiles={10}
              maxSizeMB={5}
            />

            <TextField
              fullWidth
              label='Alternative Text (Alt Text)'
              value={altText}
              onChange={e => setAltText(e.target.value)}
              placeholder='Image description'
              helperText='Optional: Will be applied to uploaded images'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} variant='contained'>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Alt Text Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Edit Alternative Text</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {selectedImage && (
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: 1,
                  borderColor: 'divider',
                  mb: 1
                }}
              >
                <img
                  src={selectedImage.url}
                  alt={selectedImage.altText || 'Image'}
                  className='w-full h-full object-cover'
                />
              </Box>
            )}

            <TextField
              fullWidth
              label='Alternative Text (Alt Text)'
              value={altText}
              onChange={e => setAltText(e.target.value)}
              placeholder='Image description'
              helperText='Helps with SEO and accessibility'
              multiline
              rows={2}
            />
          </Box>
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

export default VendorImageGallery
