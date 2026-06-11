'use server'

import prisma from '@/libs/prisma'
import { revalidatePath } from 'next/cache'
import type { ServiceReview } from '@prisma/client'

// ============================================
// TYPES
// ============================================

export type CreateServiceReviewInput = {
  serviceId: string
  authorName: string
  rating: number // 1-5
  text?: string
  reviewDate: Date
  source?: string // default 'manual'
}

export type UpdateServiceReviewInput = Partial<CreateServiceReviewInput>

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Get all reviews for a service
 */
export async function getServiceReviews(serviceId: string, limit = 50): Promise<ServiceReview[]> {
  try {
    const reviews = await prisma.serviceReview.findMany({
      where: { serviceId },
      take: limit,
      orderBy: { reviewDate: 'desc' }
    })

    return reviews
  } catch (error) {
    console.error('Error fetching service reviews:', error)
    throw new Error('Failed to fetch reviews')
  }
}

/**
 * Get a single review by ID
 */
export async function getServiceReviewById(reviewId: string): Promise<ServiceReview | null> {
  try {
    const review = await prisma.serviceReview.findUnique({
      where: { id: reviewId }
    })

    return review
  } catch (error) {
    console.error('Error fetching review:', error)
    throw new Error('Failed to fetch review')
  }
}

/**
 * Create a new review (Admin only)
 */
export async function createServiceReview(data: CreateServiceReviewInput): Promise<ServiceReview> {
  try {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    const review = await prisma.serviceReview.create({
      data: {
        serviceId: data.serviceId,
        authorName: data.authorName,
        rating: data.rating,
        text: data.text,
        reviewDate: data.reviewDate,
        source: data.source || 'manual'
      }
    })

    revalidatePath(`/admin/services/edit/${data.serviceId}`)
    revalidatePath('/admin/services/list')

    return review
  } catch (error) {
    console.error('Error creating review:', error)
    throw new Error('Failed to create review')
  }
}

/**
 * Update an existing review (Admin only)
 */
export async function updateServiceReview(reviewId: string, data: UpdateServiceReviewInput): Promise<ServiceReview> {
  try {
    // Validate rating if provided
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new Error('Rating must be between 1 and 5')
    }

    const review = await prisma.serviceReview.update({
      where: { id: reviewId },
      data: {
        ...(data.authorName && { authorName: data.authorName }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.text !== undefined && { text: data.text }),
        ...(data.reviewDate && { reviewDate: data.reviewDate }),
        ...(data.source && { source: data.source })
      }
    })

    const serviceReview = await prisma.serviceReview.findUnique({
      where: { id: reviewId },
      select: { serviceId: true }
    })

    if (serviceReview) {
      revalidatePath(`/admin/services/edit/${serviceReview.serviceId}`)
      revalidatePath('/admin/services/list')
    }

    return review
  } catch (error) {
    console.error('Error updating review:', error)
    throw new Error('Failed to update review')
  }
}

/**
 * Delete a review (Admin only)
 */
export async function deleteServiceReview(reviewId: string): Promise<void> {
  try {
    const review = await prisma.serviceReview.findUnique({
      where: { id: reviewId },
      select: { serviceId: true }
    })

    await prisma.serviceReview.delete({
      where: { id: reviewId }
    })

    if (review) {
      revalidatePath(`/admin/services/edit/${review.serviceId}`)
      revalidatePath('/admin/services/list')
    }
  } catch (error) {
    console.error('Error deleting review:', error)
    throw new Error('Failed to delete review')
  }
}

/**
 * Get average rating for a service
 */
export async function getServiceAverageRating(serviceId: string): Promise<number> {
  try {
    const result = await prisma.serviceReview.aggregate({
      where: { serviceId },
      _avg: { rating: true },
      _count: true
    })

    return result._avg.rating || 0
  } catch (error) {
    console.error('Error calculating average rating:', error)
    return 0
  }
}
