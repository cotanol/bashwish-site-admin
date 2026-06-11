'use server'

import prisma from '@/libs/prisma'
import type { VenueImage } from '@prisma/client'

// ============================================
// VENUE IMAGES CRUD
// ============================================

/**
 * Get all images for a venue
 */
export async function getVenueImages(venueId: string, limit = 100): Promise<VenueImage[]> {
  try {
    return await prisma.venueImage.findMany({
      where: { venueId },
      take: limit,
      // Order by custom order, then primary images first, then by id
      orderBy: [{ order: 'asc' }, { isPrimary: 'desc' }, { id: 'asc' }]
    })
  } catch (error) {
    console.error('Error fetching venue images:', error)
    throw new Error('Failed to fetch venue images')
  }
}

/**
 * Add image to venue
 */
export async function addVenueImage(data: {
  venueId: string
  url: string
  altText?: string
  isPrimary?: boolean
}): Promise<VenueImage> {
  try {
    // Get the current max order for this venue
    const maxOrderImage = await prisma.venueImage.findFirst({
      where: { venueId: data.venueId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const nextOrder = maxOrderImage ? maxOrderImage.order + 1 : 0

    // If this is set as primary, unset other primary images
    if (data.isPrimary) {
      await prisma.venueImage.updateMany({
        where: {
          venueId: data.venueId,
          isPrimary: true
        },
        data: {
          isPrimary: false
        }
      })
    }

    // Create the image with order
    return await prisma.venueImage.create({
      data: {
        venueId: data.venueId,
        url: data.url,
        altText: data.altText || null,
        isPrimary: data.isPrimary ?? false,
        order: nextOrder
      }
    })
  } catch (error) {
    console.error('Error adding venue image:', error)
    throw new Error('Failed to add venue image')
  }
}

/**
 * Update venue image
 */
export async function updateVenueImage(
  id: string,
  data: {
    url?: string
    altText?: string
    isPrimary?: boolean
  }
): Promise<VenueImage> {
  try {
    // If this is set as primary, unset other primary images
    if (data.isPrimary) {
      const image = await prisma.venueImage.findUnique({
        where: { id },
        select: { venueId: true }
      })

      if (image) {
        await prisma.venueImage.updateMany({
          where: {
            venueId: image.venueId,
            isPrimary: true,
            id: { not: id }
          },
          data: {
            isPrimary: false
          }
        })
      }
    }

    return await prisma.venueImage.update({
      where: { id },
      data
    })
  } catch (error) {
    console.error('Error updating venue image:', error)
    throw new Error('Failed to update venue image')
  }
}

/**
 * Delete venue image
 */
export async function deleteVenueImage(id: string): Promise<void> {
  try {
    await prisma.venueImage.delete({
      where: { id }
    })
  } catch (error) {
    console.error('Error deleting venue image:', error)
    throw new Error('Failed to delete venue image')
  }
}

/**
 * Reorder venue images
 */
export async function reorderVenueImages(updates: { id: string; order: number }[]): Promise<void> {
  try {
    // Update each image's order
    await Promise.all(
      updates.map(update =>
        prisma.venueImage.update({
          where: { id: update.id },
          data: { order: update.order }
        })
      )
    )
  } catch (error) {
    console.error('Error reordering venue images:', error)
    throw new Error('Failed to reorder venue images')
  }
}

/**
 * Set primary image
 */
export async function setPrimaryImage(id: string): Promise<VenueImage> {
  try {
    const image = await prisma.venueImage.findUnique({
      where: { id },
      select: { venueId: true }
    })

    if (!image) {
      throw new Error('Image not found')
    }

    // Unset all primary images for this venue
    await prisma.venueImage.updateMany({
      where: {
        venueId: image.venueId,
        isPrimary: true
      },
      data: {
        isPrimary: false
      }
    })

    // Set this image as primary
    return await prisma.venueImage.update({
      where: { id },
      data: { isPrimary: true }
    })
  } catch (error) {
    console.error('Error setting primary image:', error)
    throw new Error('Failed to set primary image')
  }
}
