'use server'

import prisma from '@/libs/prisma'

/**
 * Click Actions
 * Handles click tracking and analytics
 */

// ============================================
// TYPES
// ============================================

export type ClickWithRelations = {
  id: string
  targetId: string
  targetType: 'VENUE' | 'SERVICE'
  vendorId: string | null
  createdAt: Date
  // Extended properties for display
  clickType?: 'website' | 'phone' | 'email' // Optional, for UI display
  timestamp: Date // Alias for createdAt
  converted?: boolean // Optional, for conversion tracking
  search?: {
    id: string
    userEmail: string | null
    numberOfKids: number
    kidsAge: number
    eventDate: Date | null
  } | null
}

// ============================================
// QUERIES
// ============================================

/**
 * Get clicks for a specific vendor
 */
export async function getVendorClicks(vendorId: string): Promise<ClickWithRelations[]> {
  try {
    const clicks = await prisma.click.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' }
    })

    // Map to expected structure with placeholder search data
    // TODO: When Search model exists, join with actual search data
    return clicks.map(click => ({
      id: click.id,
      targetId: click.targetId,
      targetType: click.targetType,
      vendorId: click.vendorId,
      createdAt: click.createdAt,
      clickType: 'website' as const, // Default to website, TODO: Add click type tracking
      timestamp: click.createdAt,
      converted: false, // TODO: Add conversion tracking
      search: null // TODO: Join with Search model when it exists
    }))
  } catch (error) {
    console.error('Error fetching vendor clicks:', error)
    throw new Error('Failed to fetch vendor clicks')
  }
}

/**
 * Get clicks for a specific venue
 */
export async function getVenueClicks(venueId: string): Promise<ClickWithRelations[]> {
  try {
    const clicks = await prisma.click.findMany({
      where: {
        targetId: venueId,
        targetType: 'VENUE'
      },
      orderBy: { createdAt: 'desc' }
    })

    return clicks.map(click => ({
      id: click.id,
      targetId: click.targetId,
      targetType: click.targetType,
      vendorId: click.vendorId,
      createdAt: click.createdAt,
      clickType: 'website' as const,
      timestamp: click.createdAt,
      converted: false,
      search: null
    }))
  } catch (error) {
    console.error('Error fetching venue clicks:', error)
    throw new Error('Failed to fetch venue clicks')
  }
}

/**
 * Get all clicks with filters
 */
export async function getClicks(filters?: {
  vendorId?: string
  targetType?: 'VENUE' | 'SERVICE'
  startDate?: Date
  endDate?: Date
}): Promise<ClickWithRelations[]> {
  try {
    const whereClause: any = {}

    if (filters?.vendorId) whereClause.vendorId = filters.vendorId
    if (filters?.targetType) whereClause.targetType = filters.targetType
    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {}
      if (filters.startDate) whereClause.createdAt.gte = filters.startDate
      if (filters.endDate) whereClause.createdAt.lte = filters.endDate
    }

    const clicks = await prisma.click.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    return clicks.map(click => ({
      id: click.id,
      targetId: click.targetId,
      targetType: click.targetType,
      vendorId: click.vendorId,
      createdAt: click.createdAt,
      clickType: 'website' as const,
      timestamp: click.createdAt,
      converted: false,
      search: null
    }))
  } catch (error) {
    console.error('Error fetching clicks:', error)
    throw new Error('Failed to fetch clicks')
  }
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Record a new click
 */
export async function recordClick(data: {
  targetId: string
  targetType: 'VENUE' | 'SERVICE'
  vendorId?: string | null
}): Promise<void> {
  try {
    await prisma.click.create({
      data: {
        targetId: data.targetId,
        targetType: data.targetType,
        vendorId: data.vendorId
      }
    })
  } catch (error) {
    console.error('Error recording click:', error)
    throw new Error('Failed to record click')
  }
}
