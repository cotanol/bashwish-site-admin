'use server'

import prisma from '@/libs/prisma'
import { revalidatePath } from 'next/cache'
import type { ServiceImage } from '@prisma/client'

// ============================================
// TYPES
// ============================================

export type CreateServiceImageInput = {
  serviceId: string
  url: string
  altText?: string
  isPrimary?: boolean
}

export type UpdateServiceImageInput = Partial<Omit<CreateServiceImageInput, 'serviceId'>>

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Get all images for a service
 */
export async function getServiceImages(serviceId: string, limit = 100): Promise<ServiceImage[]> {
  try {
    const images = await prisma.serviceImage.findMany({
      where: { serviceId },
      take: limit,
      orderBy: [{ order: 'asc' }, { isPrimary: 'desc' }, { id: 'asc' }]
    })

    return images
  } catch (error) {
    console.error('Error fetching service images:', error)
    throw new Error('Failed to fetch images')
  }
}

/**
 * Get a single image by ID
 */
export async function getServiceImageById(imageId: string): Promise<ServiceImage | null> {
  try {
    const image = await prisma.serviceImage.findUnique({
      where: { id: imageId }
    })

    return image
  } catch (error) {
    console.error('Error fetching service image:', error)
    throw new Error('Failed to fetch image')
  }
}

/**
 * Create a new service image
 */
export async function createServiceImage(data: CreateServiceImageInput): Promise<ServiceImage> {
  try {
    // Get the current max order for this service
    const maxOrderImage = await prisma.serviceImage.findFirst({
      where: { serviceId: data.serviceId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const nextOrder = maxOrderImage ? maxOrderImage.order + 1 : 0

    // If this image is set as primary, unset other primary images
    if (data.isPrimary) {
      await prisma.serviceImage.updateMany({
        where: {
          serviceId: data.serviceId,
          isPrimary: true
        },
        data: { isPrimary: false }
      })
    }

    const image = await prisma.serviceImage.create({
      data: {
        serviceId: data.serviceId,
        url: data.url,
        altText: data.altText,
        isPrimary: data.isPrimary || false,
        order: nextOrder
      }
    })

    revalidatePath(`/admin/services/edit/${data.serviceId}`)
    revalidatePath('/admin/services/list')

    return image
  } catch (error) {
    console.error('Error creating service image:', error)
    throw new Error('Failed to create image')
  }
}

/**
 * Update an existing service image
 */
export async function updateServiceImage(imageId: string, data: UpdateServiceImageInput): Promise<ServiceImage> {
  try {
    // If setting as primary, unset other primary images first
    if (data.isPrimary) {
      const currentImage = await prisma.serviceImage.findUnique({
        where: { id: imageId },
        select: { serviceId: true }
      })

      if (currentImage) {
        await prisma.serviceImage.updateMany({
          where: {
            serviceId: currentImage.serviceId,
            isPrimary: true,
            id: { not: imageId }
          },
          data: { isPrimary: false }
        })
      }
    }

    const image = await prisma.serviceImage.update({
      where: { id: imageId },
      data: {
        ...(data.url && { url: data.url }),
        ...(data.altText !== undefined && { altText: data.altText }),
        ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary })
      }
    })

    const serviceImage = await prisma.serviceImage.findUnique({
      where: { id: imageId },
      select: { serviceId: true }
    })

    if (serviceImage) {
      revalidatePath(`/admin/services/edit/${serviceImage.serviceId}`)
      revalidatePath('/admin/services/list')
    }

    return image
  } catch (error) {
    console.error('Error updating service image:', error)
    throw new Error('Failed to update image')
  }
}

/**
 * Delete a service image
 */
export async function deleteServiceImage(imageId: string): Promise<void> {
  try {
    const image = await prisma.serviceImage.findUnique({
      where: { id: imageId },
      select: { serviceId: true, isPrimary: true }
    })

    await prisma.serviceImage.delete({
      where: { id: imageId }
    })

    // If we deleted the primary image, set another one as primary
    if (image?.isPrimary) {
      const firstImage = await prisma.serviceImage.findFirst({
        where: { serviceId: image.serviceId },
        orderBy: { id: 'asc' }
      })

      if (firstImage) {
        await prisma.serviceImage.update({
          where: { id: firstImage.id },
          data: { isPrimary: true }
        })
      }
    }

    if (image) {
      revalidatePath(`/admin/services/edit/${image.serviceId}`)
      revalidatePath('/admin/services/list')
    }
  } catch (error) {
    console.error('Error deleting service image:', error)
    throw new Error('Failed to delete image')
  }
}

/**
 * Set an image as primary
 */
export async function setServiceImageAsPrimary(imageId: string): Promise<ServiceImage> {
  try {
    const image = await prisma.serviceImage.findUnique({
      where: { id: imageId },
      select: { serviceId: true }
    })

    if (!image) {
      throw new Error('Image not found')
    }

    // Unset all other primary images for this service
    await prisma.serviceImage.updateMany({
      where: {
        serviceId: image.serviceId,
        isPrimary: true
      },
      data: { isPrimary: false }
    })

    // Set this image as primary
    const updated = await prisma.serviceImage.update({
      where: { id: imageId },
      data: { isPrimary: true }
    })

    revalidatePath(`/admin/services/edit/${image.serviceId}`)
    revalidatePath('/admin/services/list')

    return updated
  } catch (error) {
    console.error('Error setting service image as primary:', error)
    throw new Error('Failed to set image as primary')
  }
}

/**
 * Reorder service images
 */
export async function reorderServiceImages(updates: { id: string; order: number }[]): Promise<void> {
  try {
    // Update each image's order
    await Promise.all(
      updates.map(update =>
        prisma.serviceImage.update({
          where: { id: update.id },
          data: { order: update.order }
        })
      )
    )

    // Get serviceId from first image to revalidate
    if (updates.length > 0) {
      const firstImage = await prisma.serviceImage.findUnique({
        where: { id: updates[0].id },
        select: { serviceId: true }
      })

      if (firstImage) {
        revalidatePath(`/admin/services/edit/${firstImage.serviceId}`)
        revalidatePath('/admin/services/list')
      }
    }
  } catch (error) {
    console.error('Error reordering service images:', error)
    throw new Error('Failed to reorder service images')
  }
}
