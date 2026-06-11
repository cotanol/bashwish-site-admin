'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'

interface ImageUploaderProps {
  venueId: string
  onUploadComplete: (url: string, publicId: string) => void
  onUploadError?: (error: string) => void
  maxFiles?: number
  maxSizeMB?: number
}

interface UploadingFile {
  file: File
  preview: string
  progress: number
  error?: string
}

export default function ImageUploader({
  venueId,
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  maxSizeMB = 5
}: ImageUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('venueId', venueId)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Validate file count
      if (acceptedFiles.length > maxFiles) {
        const error = `Maximum ${maxFiles} files allowed`
        onUploadError?.(error)
        alert(error)
        return
      }

      // Validate file sizes
      const maxSizeBytes = maxSizeMB * 1024 * 1024
      const oversizedFiles = acceptedFiles.filter(file => file.size > maxSizeBytes)

      if (oversizedFiles.length > 0) {
        const error = `Some files exceed ${maxSizeMB}MB limit`
        onUploadError?.(error)
        alert(error)
        return
      }

      setIsUploading(true)

      // Create preview objects
      const filesWithPreview = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        progress: 0
      }))

      setUploadingFiles(filesWithPreview)

      // Upload files sequentially
      for (let i = 0; i < acceptedFiles.length; i++) {
        try {
          // Update progress to uploading
          setUploadingFiles(prev =>
            prev.map((f, idx) => (idx === i ? { ...f, progress: 50 } : f))
          )

          const result = await uploadFile(acceptedFiles[i])

          // Update progress to complete
          setUploadingFiles(prev =>
            prev.map((f, idx) => (idx === i ? { ...f, progress: 100 } : f))
          )

          // Notify parent component
          onUploadComplete(result.url, result.publicId)

          // Remove from uploading list after short delay
          setTimeout(() => {
            setUploadingFiles(prev => prev.filter((_, idx) => idx !== i))
          }, 1000)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed'

          setUploadingFiles(prev =>
            prev.map((f, idx) =>
              idx === i ? { ...f, progress: 0, error: errorMessage } : f
            )
          )

          onUploadError?.(errorMessage)
        }
      }

      setIsUploading(false)
    },
    [venueId, maxFiles, maxSizeMB, onUploadComplete, onUploadError]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxFiles,
    disabled: isUploading
  })

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => {
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, idx) => idx !== index)
    })
  }

  return (
    <Box>
      {/* Dropzone */}
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: isUploading ? 'divider' : 'primary.main',
            bgcolor: isUploading ? 'background.paper' : 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <i
            className={`tabler-cloud-upload text-6xl ${isDragActive ? 'text-primary' : 'text-textSecondary'}`}
          />

          {isDragActive ? (
            <Typography variant='h6' color='primary'>
              Suelta las imágenes aquí...
            </Typography>
          ) : (
            <>
              <Typography variant='h6'>
                Arrastra imágenes aquí o haz clic para seleccionar
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Formatos: JPG, PNG, WebP, GIF • Máximo: {maxFiles} archivos • {maxSizeMB}MB por archivo
              </Typography>
            </>
          )}

          {isUploading && (
            <Chip
              label='Subiendo...'
              color='primary'
              size='small'
              icon={<i className='tabler-loader animate-spin' />}
            />
          )}
        </Box>
      </Box>

      {/* Uploading Files Preview */}
      {uploadingFiles.length > 0 && (
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant='subtitle2' color='text.secondary'>
            Uploading {uploadingFiles.length} image{uploadingFiles.length > 1 ? 's' : ''}...
          </Typography>

          {uploadingFiles.map((uploadFile, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                border: '1px solid',
                borderColor: uploadFile.error ? 'error.main' : 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper'
              }}
            >
              {/* Preview Image */}
              <Box
                component='img'
                src={uploadFile.preview}
                alt={uploadFile.file.name}
                sx={{
                  width: 60,
                  height: 60,
                  objectFit: 'cover',
                  borderRadius: 1
                }}
              />

              {/* File Info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant='body2' noWrap>
                  {uploadFile.file.name}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                </Typography>

                {uploadFile.error ? (
                  <Typography variant='caption' color='error.main' sx={{ display: 'block', mt: 0.5 }}>
                    <i className='tabler-alert-circle' /> {uploadFile.error}
                  </Typography>
                ) : (
                  <LinearProgress
                    variant='determinate'
                    value={uploadFile.progress}
                    sx={{ mt: 1 }}
                    color={uploadFile.progress === 100 ? 'success' : 'primary'}
                  />
                )}
              </Box>

              {/* Actions */}
              <IconButton
                size='small'
                onClick={() => removeUploadingFile(index)}
                disabled={uploadFile.progress > 0 && uploadFile.progress < 100}
              >
                <i className='tabler-x' />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
