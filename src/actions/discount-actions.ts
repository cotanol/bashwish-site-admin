'use server'

/**
 * Discount Actions
 *
 * NOTE: This module provides types and placeholder functions for discount code management.
 * Discount codes are stored as venue.discountCode field.
 * TODO: Implement real discount tracking and analytics when needed
 */

// ============================================
// TYPES
// ============================================

export type DiscountCodeData = {
  code: string
  venueName: string
  venueId: string
  specialOffer: string | null
  usageCount: number
  isActive: boolean
}

export type TopDiscountCode = {
  code: string
  venueName: string
  usageCount: number
}

export type DiscountCodeStats = {
  totalCodes: number
  activeCodes: number
  totalUsages: number
  topCodes: TopDiscountCode[]
}

// ============================================
// QUERIES
// ============================================

/**
 * Get all discount codes with usage statistics
 * TODO: Implement real usage tracking from database
 */
export async function getDiscountCodes(): Promise<DiscountCodeData[]> {
  // Placeholder - return empty array
  // When implemented, query venues with discountCode field and join with usage data
  return []
}

/**
 * Get discount code statistics
 * TODO: Implement real analytics when usage tracking exists
 */
export async function getDiscountCodeStats(): Promise<DiscountCodeStats> {
  // Placeholder - return empty stats
  return {
    totalCodes: 0,
    activeCodes: 0,
    totalUsages: 0,
    topCodes: []
  }
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Track discount code usage
 * TODO: Implement when discount usage tracking model exists
 */
export async function trackDiscountUsage(code: string, venueId: string): Promise<void> {
  console.warn('trackDiscountUsage called but discount tracking is not implemented yet')
  // Placeholder - do nothing
  // When implemented, create a DiscountUsage record in database
}
