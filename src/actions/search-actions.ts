'use server'

import prisma from '@/libs/prisma'

/**
 * Search Actions
 *
 * NOTE: Search model doesn't exist in Prisma schema yet.
 * These are placeholder actions with the expected structure.
 * TODO: Add Search model to schema.prisma
 */

// ============================================
// TYPES
// ============================================

export type SearchWithRelations = {
  id: string
  createdAt: Date
  userEmail: string | null
  kidsAge: number
  gender: 'male' | 'female' | 'both'
  numberOfKids: number
  postalCode: string
  eventDate: Date | null
  resultsCount: number
  venuesShown: string[] // Array of venue IDs
  clicks: {
    id: string
    targetId: string
    targetType: 'VENUE' | 'SERVICE'
    converted: boolean
    createdAt: Date
  }[]
}

// ============================================
// QUERIES
// ============================================

/**
 * Get all searches with relations
 * TODO: Implement when Search model exists in schema
 */
export async function getSearches(): Promise<SearchWithRelations[]> {
  // Placeholder - return empty array
  // When Search model exists, implement:
  // return await prisma.search.findMany({
  //   include: {
  //     clicks: true
  //   },
  //   orderBy: { createdAt: 'desc' }
  // })

  console.warn('getSearches called but Search model does not exist in schema yet')
  return []
}

/**
 * Get searches with filters
 * TODO: Implement when Search model exists
 */
export async function getSearchesWithFilters(filters: {
  startDate?: Date
  endDate?: Date
  postalCode?: string
  hasClicks?: boolean
}): Promise<SearchWithRelations[]> {
  console.warn('getSearchesWithFilters called but Search model does not exist yet')
  return []
}

/**
 * Get search by ID
 * TODO: Implement when Search model exists
 */
export async function getSearchById(id: string): Promise<SearchWithRelations | null> {
  console.warn('getSearchById called but Search model does not exist yet')
  return null
}
