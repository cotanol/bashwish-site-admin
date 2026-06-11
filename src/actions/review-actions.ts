'use server'

import prisma from '@/libs/prisma'
import { revalidatePath } from 'next/cache'
import type { Review, ReviewStatus, ServiceReview } from '@prisma/client'

// ============================================
// TYPES
// ============================================

export type CreateReviewInput = {
  venueId: string
  authorName: string
  authorEmail?: string
  rating: number // 1-5
  text?: string
  reviewDate: Date
  source?: string // default 'manual'
  status?: ReviewStatus // default 'PENDING'
}

export type CreateServiceReviewInput = {
  serviceId: string
  authorName: string
  authorEmail?: string
  rating: number // 1-5
  text?: string
  reviewDate: Date
  source?: string // default 'manual'
  status?: ReviewStatus // default 'PENDING'
}

export type UpdateReviewInput = Partial<CreateReviewInput> & {
  status?: ReviewStatus
}

// Types with relations for admin views
export type VenueReviewWithVenue = Review & {
  venue: {
    name: string
    slug: string
  }
}

export type ServiceReviewWithService = ServiceReview & {
  service: {
    name: string
    slug: string
  }
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Get all reviews for a venue (for admin - includes all statuses)
 */
export async function getVenueReviews(venueId: string, limit = 50): Promise<Review[]> {
  try {
    const reviews = await prisma.review.findMany({
      where: { venueId },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    return reviews
  } catch (error) {
    console.error('Error fetching venue reviews:', error)
    throw new Error('Failed to fetch reviews')
  }
}

/**
 * Get only approved reviews for a venue (for public display)
 */
export async function getApprovedVenueReviews(venueId: string, limit = 50): Promise<Review[]> {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        venueId,
        status: 'APPROVED',
        isVisible: true
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    return reviews
  } catch (error) {
    console.error('Error fetching approved venue reviews:', error)
    throw new Error('Failed to fetch approved reviews')
  }
}

/**
 * Get pending reviews (for admin approval queue)
 */
export async function getPendingReviews(limit = 50): Promise<VenueReviewWithVenue[]> {
  try {
    const reviews = await prisma.review.findMany({
      where: { status: 'PENDING' },
      take: limit,
      include: {
        venue: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return reviews
  } catch (error) {
    console.error('Error fetching pending reviews:', error)
    throw new Error('Failed to fetch pending reviews')
  }
}

/**
 * Get a single review by ID
 */
export async function getReviewById(reviewId: string): Promise<Review | null> {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    })

    return review
  } catch (error) {
    console.error('Error fetching review:', error)
    throw new Error('Failed to fetch review')
  }
}

/**
 * Create a new review
 */
export async function createReview(data: CreateReviewInput): Promise<Review> {
  try {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    const review = await prisma.review.create({
      data: {
        venueId: data.venueId,
        authorName: data.authorName,
        authorEmail: data.authorEmail,
        rating: data.rating,
        text: data.text,
        reviewDate: data.reviewDate,
        source: data.source || 'manual',
        status: data.status || 'PENDING'
      }
    })

    revalidatePath(`/vendor/venues/${data.venueId}`)
    revalidatePath('/vendor/venues')
    revalidatePath('/admin/reviews')

    return review
  } catch (error) {
    console.error('Error creating review:', error)
    throw new Error('Failed to create review')
  }
}

/**
 * Update an existing review
 */
export async function updateReview(reviewId: string, data: UpdateReviewInput): Promise<Review> {
  try {
    // Validate rating if provided
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new Error('Rating must be between 1 and 5')
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(data.authorName && { authorName: data.authorName }),
        ...(data.authorEmail !== undefined && { authorEmail: data.authorEmail }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.text !== undefined && { text: data.text }),
        ...(data.reviewDate && { reviewDate: data.reviewDate }),
        ...(data.source && { source: data.source }),
        ...(data.status && { status: data.status })
      }
    })

    const venue = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { venueId: true }
    })

    if (venue) {
      revalidatePath(`/vendor/venues/${venue.venueId}`)
      revalidatePath('/vendor/venues')
      revalidatePath('/admin/reviews')
    }

    return review
  } catch (error) {
    console.error('Error updating review:', error)
    throw new Error('Failed to update review')
  }
}

/**
 * Approve a review (admin action)
 */
export async function approveReview(reviewId: string): Promise<Review> {
  try {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status: 'APPROVED' }
    })

    revalidatePath('/admin/reviews')
    revalidatePath(`/venues/${review.venueId}`)

    return review
  } catch (error) {
    console.error('Error approving review:', error)
    throw new Error('Failed to approve review')
  }
}

/**
 * Reject a review (admin action)
 */
export async function rejectReview(reviewId: string): Promise<Review> {
  try {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status: 'REJECTED' }
    })

    revalidatePath('/admin/reviews')

    return review
  } catch (error) {
    console.error('Error rejecting review:', error)
    throw new Error('Failed to reject review')
  }
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string): Promise<void> {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { venueId: true }
    })

    await prisma.review.delete({
      where: { id: reviewId }
    })

    if (review) {
      revalidatePath(`/vendor/venues/${review.venueId}`)
      revalidatePath('/vendor/venues')
    }
  } catch (error) {
    console.error('Error deleting review:', error)
    throw new Error('Failed to delete review')
  }
}

/**
 * Get average rating for a venue (only approved reviews)
 */
export async function getVenueAverageRating(venueId: string): Promise<{ average: number; count: number }> {
  try {
    const result = await prisma.review.aggregate({
      where: {
        venueId,
        status: 'APPROVED'
      },
      _avg: { rating: true },
      _count: true
    })

    return {
      average: result._avg.rating || 0,
      count: result._count || 0
    }
  } catch (error) {
    console.error('Error calculating average rating:', error)
    return { average: 0, count: 0 }
  }
}

/**
 * Verify vendor owns the venue before allowing review operations
 */
export async function verifyVenueOwnership(venueId: string, userId: string): Promise<boolean> {
  try {
    const venue = await prisma.venue.findFirst({
      where: {
        id: venueId,
        vendor: {
          userId: userId
        }
      }
    })

    return !!venue
  } catch (error) {
    console.error('Error verifying venue ownership:', error)
    return false
  }
}

// ============================================
// SERVICE REVIEW OPERATIONS
// ============================================

/**
 * Get all reviews for a service (for admin - includes all statuses)
 */
export async function getServiceReviews(serviceId: string): Promise<ServiceReview[]> {
  try {
    const reviews = await prisma.serviceReview.findMany({
      where: { serviceId },
      orderBy: { createdAt: 'desc' }
    })

    return reviews
  } catch (error) {
    console.error('Error fetching service reviews:', error)
    throw new Error('Failed to fetch reviews')
  }
}

/**
 * Get only approved reviews for a service (for public display)
 */
export async function getApprovedServiceReviews(serviceId: string): Promise<ServiceReview[]> {
  try {
    const reviews = await prisma.serviceReview.findMany({
      where: {
        serviceId,
        status: 'APPROVED',
        isVisible: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return reviews
  } catch (error) {
    console.error('Error fetching approved service reviews:', error)
    throw new Error('Failed to fetch approved reviews')
  }
}

/**
 * Get pending service reviews (for admin approval queue)
 */
export async function getPendingServiceReviews(): Promise<ServiceReviewWithService[]> {
  try {
    const reviews = await prisma.serviceReview.findMany({
      where: { status: 'PENDING' },
      include: {
        service: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return reviews
  } catch (error) {
    console.error('Error fetching pending service reviews:', error)
    throw new Error('Failed to fetch pending service reviews')
  }
}

/**
 * Create a new service review
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
        authorEmail: data.authorEmail,
        rating: data.rating,
        text: data.text,
        reviewDate: data.reviewDate,
        source: data.source || 'manual',
        status: data.status || 'PENDING'
      }
    })

    revalidatePath(`/admin/services/${data.serviceId}`)
    revalidatePath('/admin/services/list')
    revalidatePath('/admin/reviews')

    return review
  } catch (error) {
    console.error('Error creating service review:', error)
    throw new Error('Failed to create service review')
  }
}

/**
 * Approve a service review (admin action)
 */
export async function approveServiceReview(reviewId: string): Promise<ServiceReview> {
  try {
    const review = await prisma.serviceReview.update({
      where: { id: reviewId },
      data: { status: 'APPROVED' }
    })

    revalidatePath('/admin/reviews')
    revalidatePath(`/services/${review.serviceId}`)

    return review
  } catch (error) {
    console.error('Error approving service review:', error)
    throw new Error('Failed to approve service review')
  }
}

/**
 * Reject a service review (admin action)
 */
export async function rejectServiceReview(reviewId: string): Promise<ServiceReview> {
  try {
    const review = await prisma.serviceReview.update({
      where: { id: reviewId },
      data: { status: 'REJECTED' }
    })

    revalidatePath('/admin/reviews')

    return review
  } catch (error) {
    console.error('Error rejecting service review:', error)
    throw new Error('Failed to reject service review')
  }
}

/**
 * Delete a service review
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
      revalidatePath(`/admin/services/${review.serviceId}`)
      revalidatePath('/admin/services/list')
      revalidatePath('/admin/reviews')
    }
  } catch (error) {
    console.error('Error deleting service review:', error)
    throw new Error('Failed to delete service review')
  }
}

/**
 * Get average rating for a service (only approved reviews)
 */
export async function getServiceAverageRating(serviceId: string): Promise<{ average: number; count: number }> {
  try {
    const result = await prisma.serviceReview.aggregate({
      where: {
        serviceId,
        status: 'APPROVED'
      },
      _avg: { rating: true },
      _count: true
    })

    return {
      average: result._avg.rating || 0,
      count: result._count || 0
    }
  } catch (error) {
    console.error('Error calculating average rating:', error)
    return { average: 0, count: 0 }
  }
}

// ============================================
// VISIBILITY TOGGLE OPERATIONS
// ============================================

/**
 * Toggle visibility of a venue review
 */
export async function toggleVenueReviewVisibility(reviewId: string): Promise<Review> {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    })

    if (!review) {
      throw new Error('Review not found')
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { isVisible: !review.isVisible }
    })

    revalidatePath('/admin/reviews')
    revalidatePath(`/venues/${review.venueId}`)

    return updatedReview
  } catch (error) {
    console.error('Error toggling venue review visibility:', error)
    throw new Error('Failed to toggle review visibility')
  }
}

/**
 * Toggle visibility of a service review
 */
export async function toggleServiceReviewVisibility(reviewId: string): Promise<ServiceReview> {
  try {
    const review = await prisma.serviceReview.findUnique({
      where: { id: reviewId }
    })

    if (!review) {
      throw new Error('Review not found')
    }

    const updatedReview = await prisma.serviceReview.update({
      where: { id: reviewId },
      data: { isVisible: !review.isVisible }
    })

    revalidatePath('/admin/reviews')
    revalidatePath(`/services/${review.serviceId}`)

    return updatedReview
  } catch (error) {
    console.error('Error toggling service review visibility:', error)
    throw new Error('Failed to toggle review visibility')
  }
}

/**
 * Toggle visibility of venue reviews (show/hide from public)
 */
export async function toggleVenueReviewsVisibility(venueId: string, isVisible: boolean): Promise<void> {
  try {
    await prisma.review.updateMany({
      where: {
        venueId,
        status: 'APPROVED' // Only affect approved reviews
      },
      data: {
        isVisible
      }
    })

    revalidatePath(`/venues/${venueId}`)
    revalidatePath('/admin/reviews')
  } catch (error) {
    console.error('Error toggling venue reviews visibility:', error)
    throw new Error('Failed to toggle venue reviews visibility')
  }
}

/**
 * Toggle visibility of service reviews (show/hide from public)
 */
export async function toggleServiceReviewsVisibility(serviceId: string, isVisible: boolean): Promise<void> {
  try {
    await prisma.serviceReview.updateMany({
      where: {
        serviceId,
        status: 'APPROVED' // Only affect approved reviews
      },
      data: {
        isVisible
      }
    })

    revalidatePath(`/services/${serviceId}`)
    revalidatePath('/admin/reviews')
  } catch (error) {
    console.error('Error toggling service reviews visibility:', error)
    throw new Error('Failed to toggle service reviews visibility')
  }
}
