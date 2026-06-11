'use server'

import prisma from '@/libs/prisma'
import { Prisma } from '@prisma/client'
import type { Service, ServiceImage, ServicePackage, ServiceReview, ServicePackageTheme, Theme } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { serializeService } from '@/utils/serializers'

// ============================================
// TYPES
// ============================================

export type ServiceWithRelations = Service & {
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
}

// Serialized version for Client Components (Decimal → number)
export type SerializedServiceWithRelations = Omit<ServiceWithRelations, 'startingPrice' | 'latitude' | 'longitude' | 'packages'> & {
  startingPrice: number | null
  latitude: number | null
  longitude: number | null
  packages: {
    id: string
    name: string
    price: number
  }[]
}

// Full service with all relations for edit page
export type ServiceWithFullRelations = Service & {
  images: ServiceImage[]
  packages: (ServicePackage & {
    themes: (ServicePackageTheme & {
      theme: Theme
    })[]
  })[]
  reviews: ServiceReview[]
}

// Serialized version for edit page
export type SerializedServiceWithFullRelations = Omit<ServiceWithFullRelations, 'startingPrice' | 'latitude' | 'longitude' | 'packages'> & {
  startingPrice: number | null
  latitude: number | null
  longitude: number | null
  packages: (Omit<ServicePackage, 'price'> & {
    price: number
    themes: (ServicePackageTheme & {
      theme: Theme
    })[]
  })[]
  reviews: ServiceReview[]
}

export type ServiceFilters = {
  isPublished?: boolean
  isFeatured?: boolean
  search?: string
  // Package-based filters
  kids?: number
  age?: number
  gender?: 'boy' | 'girl'
  themeIds?: string[]
}

export type CreateServiceInput = {
  name: string
  slug: string
  description?: string
  website?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  latitude?: number
  longitude?: number
  isPublished?: boolean
  isFeatured?: boolean
  specialOffer?: string | null
  startingPrice?: number
  discountPrice?: number
}

export type UpdateServiceInput = Partial<CreateServiceInput>

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Get services with optional filters and pagination
 * Now uses scoring system to show all results but prioritize matches
 */
export async function getServices(filters: ServiceFilters = {}, page = 1, limit = 10) {
  try {
    const { isPublished, isFeatured, search, kids, age, gender, themeIds } = filters

    // Base filters (hard filters - must match)
    const where: Prisma.ServiceWhereInput = {}

    if (isPublished !== undefined) where.isPublished = isPublished
    if (isFeatured !== undefined) where.isFeatured = isFeatured
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Soft filters for package matching (used for scoring, not exclusion)
    const hasPackageFilters = kids || age || gender || (themeIds && themeIds.length > 0)

    // Fetch ALL services matching base filters
    const allServices = await prisma.service.findMany({
      where,
      include: {
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

    // Score each service based on filter matches
    const scoredServices = allServices.map(service => {
      let score = 0

      // Check if service has packages matching filters
      if (hasPackageFilters) {
        const matchingPackages = service.packages.filter(pkg => {
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

      // Featured services get bonus score
      if (service.isFeatured) {
        score += 50
      }

      return { service, score }
    })

    // Sort by score (highest first), then by featured, then by creation date
    scoredServices.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (b.service.isFeatured !== a.service.isFeatured) return b.service.isFeatured ? 1 : -1
      return new Date(b.service.createdAt).getTime() - new Date(a.service.createdAt).getTime()
    })

    // Apply pagination to sorted results
    const total = scoredServices.length
    const paginatedServices = scoredServices.slice((page - 1) * limit, page * limit).map(ss => ss.service)

    return {
      services: paginatedServices,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    }
  } catch (error) {
    console.error('❌ [getServices] Database error:', error)
    throw error
  }
}

/**
 * Get a single service by ID
 */
export async function getServiceById(id: string) {
  return prisma.service.findUnique({
    where: { id },
    include: {
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
 * Get a single service by slug (for public site)
 */
export async function getServiceBySlug(slug: string) {
  return prisma.service.findUnique({
    where: { slug },
    include: {
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
        where: {
          status: 'APPROVED',
          isVisible: true
        },
        orderBy: { reviewDate: 'desc' }
      }
    }
  })
}

/**
 * Create a new service (Admin only)
 */
export async function createService(data: CreateServiceInput) {
  const { startingPrice, discountPrice, latitude, longitude, ...rest } = data

  const service = await prisma.service.create({
    data: {
      ...rest,
      startingPrice: startingPrice ? new Prisma.Decimal(startingPrice) : null,
      discountPrice: discountPrice ? new Prisma.Decimal(discountPrice) : null,
      latitude: latitude ? new Prisma.Decimal(latitude) : null,
      longitude: longitude ? new Prisma.Decimal(longitude) : null
    },
    include: {
      images: true
    }
  })

  revalidatePath('/admin/services/list')

  return serializeService(service)
}

/**
 * Update a service (Admin only)
 */
export async function updateService(id: string, data: UpdateServiceInput) {
  const { startingPrice, discountPrice, latitude, longitude, ...rest } = data

  const service = await prisma.service.update({
    where: { id },
    data: {
      ...rest,
      ...(startingPrice !== undefined && {
        startingPrice: startingPrice ? new Prisma.Decimal(startingPrice) : null
      }),
      ...(discountPrice !== undefined && {
        discountPrice: discountPrice ? new Prisma.Decimal(discountPrice) : null
      }),
      ...(latitude !== undefined && {
        latitude: latitude ? new Prisma.Decimal(latitude) : null
      }),
      ...(longitude !== undefined && {
        longitude: longitude ? new Prisma.Decimal(longitude) : null
      })
    },
    include: {
      images: true,
      packages: true
    }
  })

  revalidatePath('/admin/services/list')
  revalidatePath(`/admin/services/edit/${id}`)

  return serializeService(service)
}

/**
 * Delete a service (Admin only)
 */
export async function deleteService(id: string): Promise<void> {
  await prisma.service.delete({
    where: { id }
  })

  revalidatePath('/admin/services/list')
}

/**
 * Toggle service published status (Admin only)
 */
export async function toggleServicePublished(id: string): Promise<Service> {
  const service = await prisma.service.findUnique({
    where: { id },
    select: { isPublished: true }
  })

  if (!service) {
    throw new Error('Service not found')
  }

  const updated = await prisma.service.update({
    where: { id },
    data: { isPublished: !service.isPublished }
  })

  revalidatePath('/admin/services/list')

  // Serialize to convert Decimal to number
  return serializeService(updated)
}

/**
 * Toggle service featured status (Admin only)
 */
export async function toggleServiceFeatured(id: string): Promise<Service> {
  const service = await prisma.service.findUnique({
    where: { id },
    select: { isFeatured: true }
  })

  if (!service) {
    throw new Error('Service not found')
  }

  const updated = await prisma.service.update({
    where: { id },
    data: { isFeatured: !service.isFeatured }
  })

  revalidatePath('/admin/services/list')

  // Serialize to convert Decimal to number
  return serializeService(updated)
}
