'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/libs/prisma'
import type { GenderFocus, Prisma } from '@prisma/client'
import { serializePackage } from '@/utils/serializers'

// ============================================
// TYPES
// ============================================

export type VenuePackageWithRelations = Prisma.VenuePackageGetPayload<{
  include: {
    venue: {
      select: {
        id: true
        name: true
        slug: true
        city: true
        status: true
      }
    }
    themes: {
      include: {
        theme: true
      }
    }
  }
}>

export type SearchFilters = {
  age?: number // Kid's age
  kids?: number // Number of kids
  gender?: GenderFocus // Boy/Girl preference
  themeIds?: string[] // Theme preferences (IDs)
  city?: string // Location filter
}

// ============================================
// SEARCH & FILTER LOGIC (Core of the system)
// ============================================

/**
 * Main search function - filters by PACKAGES, returns unique VENUES
 * Following the architecture: Search packages first, then get venues
 */
export async function searchVenues(filters: SearchFilters) {
  console.log('🔍 Search Filters:', filters)

  // Build WHERE clause for VenuePackage based on filters
  const packageWhere: Prisma.VenuePackageWhereInput = {
    // Age filter (if provided)
    ...(filters.age && {
      AND: [
        {
          OR: [{ ageMin: null }, { ageMin: { lte: filters.age } }]
        },
        {
          OR: [{ ageMax: null }, { ageMax: { gte: filters.age } }]
        }
      ]
    }),

    // Kids count filter (if provided)
    ...(filters.kids && {
      minKids: { lte: filters.kids },
      maxKids: { gte: filters.kids }
    }),

    // Gender filter (if provided, include neutral packages too)
    ...(filters.gender &&
      filters.gender !== 'neutral' && {
        gender_focus: { in: [filters.gender, 'neutral'] }
      }),

    // Theme filter (if provided) - package must have at least one of the selected themes
    ...(filters.themeIds &&
      filters.themeIds.length > 0 && {
        themes: {
          some: {
            themeId: { in: filters.themeIds }
          }
        }
      }),

    // Venue filters (venue must be published and optionally in specific city)
    venue: {
      status: 'published', // CRITICAL: Only show published venues
      ...(filters.city && { city: filters.city })
    }
  }

  // Step 1: Find matching packages
  const matchingPackages = await prisma.venuePackage.findMany({
    where: packageWhere,
    select: {
      venueId: true
    }
  })

  console.log(`📦 Found ${matchingPackages.length} matching packages`)

  // Step 2: Get unique venue IDs
  const uniqueVenueIds = [...new Set(matchingPackages.map(p => p.venueId))]

  console.log(`🏢 Unique venues: ${uniqueVenueIds.length}`)

  // Step 3: Fetch full venue data
  const venues = await prisma.venue.findMany({
    where: {
      id: { in: uniqueVenueIds },
      status: 'published' // Double-check status
    },
    include: {
      images: {
        where: { isPrimary: true },
        take: 1
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
      vendor: {
        select: {
          businessName: true,
          contactName: true
        }
      },
      _count: {
        select: {
          reviews: true
        }
      }
    },
    orderBy: {
      isFeatured: 'desc' // Featured venues first
    }
  })

  console.log(`✅ Returning ${venues.length} venues`)

  return venues
}

// ============================================
// PACKAGE CRUD (Vendor operations)
// ============================================

/**
 * Get all packages for a specific venue
 */
export async function getVenuePackages(venueId: string, limit = 100) {
  try {
    const packages = await prisma.venuePackage.findMany({
      where: { venueId },
      take: limit,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            status: true
          }
        },
        themes: {
          include: {
            theme: true
          }
        }
      },
      orderBy: {
        price: 'asc'
      }
    })

    return packages
  } catch (error) {
    console.error('❌ Error fetching venue packages:', error)
    throw new Error('Failed to fetch packages')
  }
}

/**
 * Get all packages across ALL venues owned by a vendor
 */
export async function getVendorPackages(vendorId: string) {
  try {
    const packages = await prisma.venuePackage.findMany({
      where: {
        venue: {
          vendorId: vendorId
        }
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            status: true
          }
        },
        themes: {
          include: {
            theme: true
          }
        }
      },
      orderBy: [{ venue: { name: 'asc' } }, { price: 'asc' }]
    })

    return packages
  } catch (error) {
    console.error('❌ Error fetching vendor packages:', error)
    throw new Error('Failed to fetch vendor packages')
  }
}

/**
 * Get single package by ID
 */
export async function getPackageById(packageId: string) {
  try {
    const pkg = await prisma.venuePackage.findUnique({
      where: { id: packageId },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            status: true,
            vendorId: true
          }
        },
        themes: {
          include: {
            theme: true
          }
        }
      }
    })

    return pkg
  } catch (error) {
    console.error('❌ Error fetching package:', error)
    throw new Error('Failed to fetch package')
  }
}

/**
 * Create a new package for a venue
 */
export async function createVenuePackage(
  venueId: string,
  data: {
    name: string
    description?: string
    price: number
    discountPrice?: number
    minKids: number
    maxKids: number
    ageMin?: number
    ageMax?: number
    gender_focus: GenderFocus
    themeIds: string[]
  }
) {
  try {
    // Verify venue exists and get vendor ID
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, vendorId: true }
    })

    if (!venue) {
      throw new Error('Venue not found')
    }

    // Create package with theme relations
    const pkg = await prisma.venuePackage.create({
      data: {
        venueId,
        name: data.name,
        description: data.description,
        price: data.price,
        discountPrice: data.discountPrice ? data.discountPrice : null,
        minKids: data.minKids,
        maxKids: data.maxKids,
        ageMin: data.ageMin,
        ageMax: data.ageMax,
        gender_focus: data.gender_focus,
        themes: {
          create: data.themeIds.map(themeId => ({
            themeId
          }))
        }
      },
      include: {
        themes: {
          include: {
            theme: true
          }
        }
      }
    })

    revalidatePath(`/vendor/venues/${venueId}`)
    revalidatePath('/vendor/venues') // Revalidate venues list
    revalidatePath('/api/public/venues') // Revalidate public API

    return { success: true, package: serializePackage(pkg) }
  } catch (error) {
    console.error('❌ Error creating package:', error)
    return { success: false, error: 'Failed to create package' }
  }
}

/**
 * Update an existing package
 */
export async function updateVenuePackage(
  packageId: string,
  data: {
    name: string
    description?: string
    price: number
    discountPrice?: number
    minKids: number
    maxKids: number
    ageMin?: number
    ageMax?: number
    gender_focus: GenderFocus
    themeIds: string[]
  }
) {
  try {
    // Get current package to verify ownership
    const currentPackage = await prisma.venuePackage.findUnique({
      where: { id: packageId },
      include: {
        venue: { select: { id: true, vendorId: true } }
      }
    })

    if (!currentPackage) {
      throw new Error('Package not found')
    }

    // Delete existing theme relations and create new ones
    await prisma.packageTheme.deleteMany({
      where: { packageId }
    })

    // Update package
    const pkg = await prisma.venuePackage.update({
      where: { id: packageId },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        discountPrice: data.discountPrice !== undefined ? (data.discountPrice ? data.discountPrice : null) : undefined,
        minKids: data.minKids,
        maxKids: data.maxKids,
        ageMin: data.ageMin,
        ageMax: data.ageMax,
        gender_focus: data.gender_focus,
        themes: {
          create: data.themeIds.map(themeId => ({
            themeId
          }))
        }
      },
      include: {
        themes: {
          include: {
            theme: true
          }
        }
      }
    })

    revalidatePath(`/vendor/venues/${currentPackage.venue.id}`)
    revalidatePath('/vendor/venues') // Revalidate venues list
    revalidatePath('/api/public/venues') // Revalidate public API

    return { success: true, package: serializePackage(pkg) }
  } catch (error) {
    console.error('❌ Error updating package:', error)
    return { success: false, error: 'Failed to update package' }
  }
}

/**
 * Delete a package
 */
export async function deleteVenuePackage(packageId: string, userId: string) {
  try {
    // Verify ownership
    const pkg = await prisma.venuePackage.findUnique({
      where: { id: packageId },
      include: {
        venue: {
          include: {
            vendor: {
              select: { userId: true }
            }
          }
        }
      }
    })

    if (!pkg) {
      throw new Error('Package not found')
    }

    if (pkg.venue.vendor.userId !== userId) {
      throw new Error('Unauthorized - you do not own this package')
    }

    // Delete package (cascades to PackageTheme)
    await prisma.venuePackage.delete({
      where: { id: packageId }
    })

    revalidatePath(`/vendor/venues/${pkg.venueId}`)
    revalidatePath('/vendor/venues') // Revalidate venues list
    revalidatePath('/api/public/venues') // Revalidate public API

    return { success: true }
  } catch (error) {
    console.error('❌ Error deleting package:', error)
    return { success: false, error: 'Failed to delete package' }
  }
}

// ============================================
// THEME HELPERS
// ============================================

/**
 * Get all available themes
 */
export async function getAllThemes() {
  try {
    const themes = await prisma.theme.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return themes
  } catch (error) {
    console.error('❌ Error fetching themes:', error)
    throw new Error('Failed to fetch themes')
  }
}

/**
 * Create a new theme (admin only)
 */
export async function createPackageTheme(name: string, slug: string) {
  try {
    const theme = await prisma.theme.create({
      data: {
        name,
        slug
      }
    })

    revalidatePath('/admin/themes')

    return { success: true, theme }
  } catch (error) {
    console.error('❌ Error creating theme:', error)
    return { success: false, error: 'Failed to create theme' }
  }
}
