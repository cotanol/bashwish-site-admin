'use server'

import prisma from '@/libs/prisma'
import { Prisma } from '@prisma/client'
import type { Venue, VenueStatus } from '@prisma/client'
import { serializeVenue } from '@/utils/serializers'
import { revalidatePath } from 'next/cache'

// ============================================
// TYPES
// ============================================

export type VenueWithRelations = Venue & {
  vendor: {
    id: string
    businessName: string | null
    contactName: string
  }
  images: {
    id: string
    url: string
    altText: string | null
    isPrimary: boolean
  }[]
  packages: {
    id: string
    name: string
    price: Prisma.Decimal
  }[]
  _count?: {
    reviews: number
  }
  discountCode?: string | null
}

// Serialized version for Client Components (Decimal → number)
export type SerializedVenueWithRelations = Omit<
  VenueWithRelations,
  'startingPrice' | 'latitude' | 'longitude' | 'packages'
> & {
  startingPrice: number | null
  latitude: number | null
  longitude: number | null
  packages: {
    id: string
    name: string
    price: number
  }[]
  discountCode?: string | null
}

export type VenueFilters = {
  status?: VenueStatus | VenueStatus[]
  isFeatured?: boolean
  vendorId?: string
  city?: string
  zipCode?: string
  search?: string
  // Package-based filters
  kids?: number
  age?: number
  gender?: 'boy' | 'girl'
  themeIds?: string[]
}

export type CreateVenueInput = {
  vendorId: string // REQUIRED - every venue must belong to a vendor
  name: string
  slug: string
  description?: string
  address: string
  city?: string
  postalCode: string // REQUIRED - matches Prisma schema
  latitude?: number
  longitude?: number
  website?: string
  phone?: string
  status?: VenueStatus
  startingPrice?: number
  discountPrice?: number
}

export type UpdateVenueInput = Partial<CreateVenueInput> & {
  isFeatured?: boolean
  specialOffer?: string | null
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Get venues with optional filters and pagination
 */
export async function getVenues(filters: VenueFilters = {}, page = 1, limit = 10) {
  try {
    const { status, isFeatured, vendorId, city, zipCode, search, kids, age, gender, themeIds } = filters

    // Base filters (hard filters - must match)
    const where: Prisma.VenueWhereInput = {}

    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status
    }
    if (isFeatured !== undefined) where.isFeatured = isFeatured
    if (vendorId) where.vendorId = vendorId
    if (city) where.city = city
    // Note: zipCode is now used for scoring, not hard filtering
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Soft filters for package matching (used for scoring, not exclusion)
    const hasPackageFilters = kids || age || gender || (themeIds && themeIds.length > 0)

    // Fetch ALL venues matching base filters (no pagination yet)
    const allVenues = await prisma.venue.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            contactName: true
          }
        },
        images: {
          select: {
            id: true,
            url: true,
            altText: true,
            isPrimary: true
          },
          orderBy: { isPrimary: 'desc' }
        },
        packages: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            discountPrice: true,
            minKids: true,
            maxKids: true,
            ageMin: true,
            ageMax: true,
            gender_focus: true,
            themes: {
              include: {
                theme: {
                  select: {
                    id: true,
                    name: true,
                    slug: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            reviews: true
          }
        }
      }
    })

    // Score each venue based on filter matches
    const scoredVenues = allVenues.map(venue => {
      let score = 0

      // ZIP Code match (highest priority)
      if (zipCode && venue.postalCode === zipCode) {
        score += 1000
      }

      // Check if venue has packages matching filters
      if (hasPackageFilters) {
        const matchingPackages = venue.packages.filter(pkg => {
          let matches = true

          // Kids filter
          if (kids && (pkg.minKids > kids || pkg.maxKids < kids)) {
            matches = false
          }

          // Age filter
          if (age && pkg.ageMin && pkg.ageMax && (pkg.ageMin > age || pkg.ageMax < age)) {
            matches = false
          }

          // Gender filter
          if (gender && pkg.gender_focus !== 'neutral' && pkg.gender_focus !== gender) {
            matches = false
          }

          // Theme filter (at least one theme must match)
          if (themeIds && themeIds.length > 0) {
            const packageThemeIds = pkg.themes.map(t => t.theme.id)
            const hasMatchingTheme = themeIds.some(tid => packageThemeIds.includes(tid))
            if (!hasMatchingTheme) {
              matches = false
            }
          }

          return matches
        })

        // Add score based on number of matching packages
        score += matchingPackages.length * 100
      }

      // Featured venues get bonus score
      if (venue.isFeatured) {
        score += 50
      }

      return { venue, score }
    })

    // Sort by score (highest first), then by featured, then by creation date
    scoredVenues.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (b.venue.isFeatured !== a.venue.isFeatured) return b.venue.isFeatured ? 1 : -1
      return new Date(b.venue.createdAt).getTime() - new Date(a.venue.createdAt).getTime()
    })

    // Apply pagination to sorted results
    const total = scoredVenues.length
    const paginatedVenues = scoredVenues.slice((page - 1) * limit, page * limit).map(sv => sv.venue)

    return {
      venues: paginatedVenues,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  } catch (error) {
    console.error('❌ [getVenues] Database error:', error)
    throw error // Re-throw para que API route lo maneje
  }
}

/**
 * Get featured venues
 */
export async function getFeaturedVenues(limit = 6) {
  try {
    return prisma.venue.findMany({
      where: {
        isFeatured: true,
        status: 'published'
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            contactName: true
          }
        },
        images: {
          where: { isPrimary: true },
          take: 1
        },
        _count: {
          select: {
            reviews: true
          }
        }
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error('❌ [getFeaturedVenues] Database error:', error)
    throw error
  }
}

/**
 * Get venue by ID with all relations
 */
export async function getVenueById(id: string) {
  return prisma.venue.findUnique({
    where: { id },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          contactName: true,
          phone: true
        }
      },
      images: {
        orderBy: { isPrimary: 'desc' }
      },
      packages: {
        include: {
          themes: {
            include: {
              theme: true
            }
          }
        }
      },
      reviews: {
        orderBy: { reviewDate: 'desc' }
      }
    }
  })
}

/**
 * Get venue by slug (for public pages)
 */
export async function getVenueBySlug(slug: string, options?: { includeAllReviews?: boolean }) {
  return prisma.venue.findUnique({
    where: { slug },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          contactName: true
        }
      },
      images: {
        orderBy: { isPrimary: 'desc' }
      },
      packages: {
        include: {
          themes: {
            include: {
              theme: true
            }
          }
        }
      },
      reviews: {
        where: options?.includeAllReviews
          ? {}
          : {
              status: 'APPROVED',
              isVisible: true
            },
        orderBy: { createdAt: 'desc' }
      }
    }
  })
}

/**
 * Create a new venue
 */
export async function createVenue(data: CreateVenueInput) {
  const { latitude, longitude, startingPrice, discountPrice, ...rest } = data

  const venue = await prisma.venue.create({
    data: {
      ...rest,
      latitude: latitude ? new Prisma.Decimal(latitude) : null,
      longitude: longitude ? new Prisma.Decimal(longitude) : null,
      startingPrice: startingPrice ? new Prisma.Decimal(startingPrice) : null,
      discountPrice: discountPrice ? new Prisma.Decimal(discountPrice) : null
    },
    include: {
      vendor: true,
      images: true
    }
  })

  revalidatePath('/vendor/venues')
  revalidatePath('/admin/venues/list')

  return serializeVenue(venue)
}

/**
 * Update a venue
 */
export async function updateVenue(id: string, data: UpdateVenueInput) {
  const { latitude, longitude, startingPrice, discountPrice, ...rest } = data

  const venue = await prisma.venue.update({
    where: { id },
    data: {
      ...rest,
      ...(latitude !== undefined && { latitude: latitude ? new Prisma.Decimal(latitude) : null }),
      ...(longitude !== undefined && { longitude: longitude ? new Prisma.Decimal(longitude) : null }),
      ...(startingPrice !== undefined && { startingPrice: startingPrice ? new Prisma.Decimal(startingPrice) : null }),
      ...(discountPrice !== undefined && { discountPrice: discountPrice ? new Prisma.Decimal(discountPrice) : null })
    },
    include: {
      vendor: true,
      images: true,
      packages: true
    }
  })

  revalidatePath('/vendor/venues')
  revalidatePath('/admin/venues/list')

  return serializeVenue(venue)
}

/**
 * Toggle venue featured status
 */
export async function toggleVenueFeatured(id: string, isFeatured: boolean) {
  'use server'

  await prisma.venue.update({
    where: { id },
    data: { isFeatured }
  })

  revalidatePath('/admin/venues/list')

  return { success: true, id, isFeatured }
}

/**
 * Toggle venue active status (changes between published and suspended)
 */
export async function toggleVenueActive(id: string, isActive: boolean) {
  'use server'

  // If suspending, also remove featured status
  const updateData = isActive ? { status: 'published' as const } : { status: 'suspended' as const, isFeatured: false }

  await prisma.venue.update({
    where: { id },
    data: updateData
  })

  revalidatePath('/admin/venues/list')

  return { success: true, id, isActive }
}

/**
 * Soft delete venue (set status to suspended)
 */
export async function softDeleteVenue(id: string) {
  await prisma.venue.update({
    where: { id },
    data: { status: 'suspended' }
  })

  return { success: true, id }
}

/**
 * Permanently delete venue
 */
export async function deleteVenue(id: string) {
  await prisma.venue.delete({
    where: { id }
  })

  return { success: true, id }
}

/**
 * Bulk update venues
 */
export async function bulkUpdateVenues(ids: string[], data: UpdateVenueInput) {
  const { latitude, longitude, startingPrice, ...rest } = data

  const result = await prisma.venue.updateMany({
    where: { id: { in: ids } },
    data: {
      ...rest,
      ...(latitude !== undefined && { latitude: latitude ? new Prisma.Decimal(latitude) : null }),
      ...(longitude !== undefined && { longitude: longitude ? new Prisma.Decimal(longitude) : null }),
      ...(startingPrice !== undefined && { startingPrice: startingPrice ? new Prisma.Decimal(startingPrice) : null })
    }
  })

  return { success: true, count: result.count }
}

/**
 * Bulk soft delete venues
 */
export async function bulkSoftDeleteVenues(ids: string[]) {
  const result = await prisma.venue.updateMany({
    where: { id: { in: ids } },
    data: { status: 'suspended' }
  })

  return { success: true, count: result.count }
}

/**
 * Get venues with special offers
 */
export async function getVenuesWithOffers(limit = 10) {
  return prisma.venue.findMany({
    where: {
      specialOffer: { not: null },
      status: 'published'
    },
    take: limit,
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          contactName: true
        }
      },
      images: {
        where: { isPrimary: true },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Update venue special offer
 */
export async function updateVenueOffer(id: string, specialOffer: string, discountCode?: string) {
  const venue = await prisma.venue.update({
    where: { id },
    data: {
      specialOffer,
      ...(discountCode !== undefined && { discountCode })
    }
  })

  return serializeVenue(venue)
}

/**
 * Remove venue special offer
 */
export async function removeVenueOffer(id: string) {
  const venue = await prisma.venue.update({
    where: { id },
    data: { specialOffer: null }
  })

  return serializeVenue(venue)
}

/**
 * Set featured until date (for future implementation)
 * This is a placeholder for when you add featuredUntil field
 */
export async function setFeaturedUntil(id: string, date: Date) {
  // For now, just toggle featured status
  return prisma.venue.update({
    where: { id },
    data: { isFeatured: true }
  })
}

/**
 * Check and update expired featured venues
 * Placeholder for future implementation
 */
export async function checkAndUpdateExpiredFeatured() {
  // For now, return empty array
  return []
}

// ============================================
// ANALYTICS & REPORTS (MVP - Fake Data)
// ============================================

export type AdminAnalyticsData = {
  // Basic venue stats
  totalVenues: number
  publishedVenues: number
  pendingVenues: number
  featuredVenues: number
  activeVenues: number

  // Vendor & review stats
  totalVendors: number
  totalReviews: number
  averageRating: number

  // Search & click analytics (placeholders until models exist)
  totalSearches: number
  totalClicks: number
  totalConversions: number
  conversionRate: number

  // Email captures (placeholder)
  emailCaptures: number
  acceptsMarketing: number
  venuesWithOffers: number

  // Weekly activity data
  weeklyActivity: {
    date: string
    searches: number
    clicks: number
    conversions: number
  }[]

  // Top themes
  topThemes: {
    name: string
    count: number
    percentage: number
  }[]

  // Top venues by clicks
  topVenues: {
    id: string
    name: string
    clicks: number
    conversions: number
    conversionRate: number
  }[]

  // Click type breakdown
  clickTypeBreakdown: {
    website: number
    phone: number
    email: number
  }

  // Recent venues
  recentVenues: VenueWithRelations[]
}

/**
 * Get admin analytics data (MVP version with basic stats)
 */
export async function getAdminAnalytics(): Promise<AdminAnalyticsData> {
  const [
    totalVenues,
    publishedVenues,
    pendingVenues,
    featuredVenues,
    activeVenues,
    totalVendors,
    totalReviews,
    venuesWithOffers,
    totalClicks,
    recentVenues
  ] = await Promise.all([
    prisma.venue.count(),
    prisma.venue.count({ where: { status: 'published' } }),
    prisma.venue.count({ where: { status: 'pending_review' } }),
    prisma.venue.count({ where: { isFeatured: true } }),
    prisma.venue.count({ where: { status: 'published' } }),
    prisma.vendor.count(),
    prisma.review.count(),
    prisma.venue.count({ where: { specialOffer: { not: null } } }),
    prisma.click.count(),
    prisma.venue.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            contactName: true
          }
        },
        images: {
          where: { isPrimary: true },
          take: 1
        },
        packages: {
          select: {
            id: true,
            name: true,
            price: true
          }
        },
        _count: {
          select: {
            reviews: true
          }
        }
      }
    })
  ])

  // Calculate average rating
  const allReviews = await prisma.review.findMany({ select: { rating: true } })
  const averageRating = allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length : 0

  // Get top themes by venue count
  const themesData = await prisma.theme.findMany({
    where: { isActive: true },
    include: {
      packages: {
        include: {
          package: {
            include: {
              venue: { select: { id: true } }
            }
          }
        }
      }
    }
  })

  const topThemes = themesData
    .map(theme => ({
      name: theme.name,
      count: new Set(theme.packages.map(p => p.package.venue.id)).size
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Calculate percentage for top themes
  const totalThemeVenues = topThemes.reduce((sum, theme) => sum + theme.count, 0)
  const topThemesWithPercentage = topThemes.map(theme => ({
    ...theme,
    percentage: totalThemeVenues > 0 ? (theme.count / totalThemeVenues) * 100 : 0
  }))

  // Get top venues by clicks (placeholder - would need to join with Click table)
  const topVenues = await prisma.venue.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true
    }
  })

  // Generate weekly activity (placeholder data)
  const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return {
      date: date.toISOString(),
      searches: 0, // TODO: Implement when Search model exists
      clicks: 0, // TODO: Get from Click table grouped by day
      conversions: 0 // TODO: Implement conversion tracking
    }
  })

  return {
    totalVenues,
    publishedVenues,
    pendingVenues,
    featuredVenues,
    activeVenues,
    totalVendors,
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10,

    // Placeholder data for features not yet implemented
    totalSearches: 0,
    totalClicks,
    totalConversions: 0,
    conversionRate: 0,
    emailCaptures: 0,
    acceptsMarketing: 0,
    venuesWithOffers,

    weeklyActivity,
    topThemes: topThemesWithPercentage,
    topVenues: topVenues.map(v => ({
      id: v.id,
      name: v.name,
      clicks: 0,
      conversions: 0,
      conversionRate: 0 // Will be calculated when clicks > 0
    })),

    clickTypeBreakdown: {
      website: 0,
      phone: 0,
      email: 0
    },

    recentVenues
  }
}

/**
 * Get ecommerce data (legacy function - returns mock data for now)
 * This is kept for backward compatibility with existing views
 */
export async function getEcommerceData(): Promise<{
  statsHorizontalWithBorder: Array<{ title: string; value: string; avatarIcon: string }>
  orderData: Array<{
    id: number
    order: string
    customer: string
    email: string
    avatar: string
    payment: number
    status: string
    spent: number
    method: string
    date: string
    time: string
    methodNumber: number
  }>
}> {
  const analytics = await getAdminAnalytics()

  // Return data in expected format for ecommerce views
  return {
    statsHorizontalWithBorder: [
      { title: 'Total Venues', value: analytics.totalVenues.toString(), avatarIcon: 'tabler-map-pin' },
      { title: 'Published', value: analytics.publishedVenues.toString(), avatarIcon: 'tabler-check' },
      { title: 'Pending', value: analytics.pendingVenues.toString(), avatarIcon: 'tabler-clock' },
      { title: 'Featured', value: analytics.featuredVenues.toString(), avatarIcon: 'tabler-star' }
    ],
    // Placeholder order data - will be replaced with real venue bookings/reservations
    orderData: []
  }
}

// ============================================
// ADMIN BLOCK/UNBLOCK FUNCTIONS (Legacy aliases)
// ============================================

/**
 * Admin block venue (suspends it)
 * @param venueId - The venue ID to block
 * @param reason - Optional reason for blocking (currently not stored in DB, for future use)
 */
export async function adminBlockVenue(venueId: string, reason?: string) {
  // For now, reason is not stored in the database
  // In the future, you could add a 'suspensionReason' field to the Venue model
  await prisma.venue.update({
    where: { id: venueId },
    data: { status: 'suspended' }
  })

  return { success: true, id: venueId, status: 'suspended' }
}

/**
 * Admin unblock venue (restores it to published)
 */
export async function adminUnblockVenue(venueId: string) {
  await prisma.venue.update({
    where: { id: venueId },
    data: { status: 'published' }
  })

  return { success: true, id: venueId, status: 'published' }
}
