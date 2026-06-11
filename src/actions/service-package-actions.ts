'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import type { GenderFocus } from '@prisma/client'
import prisma from '@/libs/prisma'
import { serializeServicePackage } from '@/utils/serializers'

// ============================================
// TYPES
// ============================================

export type ServicePackageWithRelations = Prisma.ServicePackageGetPayload<{
  include: {
    service: {
      select: {
        id: true
        name: true
        slug: true
        isPublished: true
      }
    }
    themes: {
      include: {
        theme: true
      }
    }
  }
}>

// Serialized version for Client Components
export type SerializedServicePackage = Omit<ServicePackageWithRelations, 'price'> & {
  price: number
}

export type CreateServicePackageInput = {
  serviceId: string
  name: string
  description?: string
  price: number
  discountPrice?: number
  minKids: number
  maxKids: number
  ageMin?: number
  ageMax?: number
  gender_focus?: GenderFocus
  themeIds?: string[] // Array of theme IDs
}

export type UpdateServicePackageInput = Omit<CreateServicePackageInput, 'serviceId'>

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Get all packages for a service
 */
export async function getServicePackages(serviceId: string, limit = 100): Promise<ServicePackageWithRelations[]> {
  try {
    const packages = await prisma.servicePackage.findMany({
      where: { serviceId },
      take: limit,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
            isPublished: true
          }
        },
        themes: {
          include: {
            theme: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return packages
  } catch (error) {
    console.error('Error fetching service packages:', error)
    throw new Error('Failed to fetch packages')
  }
}

/**
 * Get a single package by ID
 */
export async function getServicePackageById(packageId: string): Promise<ServicePackageWithRelations | null> {
  try {
    const pkg = await prisma.servicePackage.findUnique({
      where: { id: packageId },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
            isPublished: true
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
    console.error('Error fetching service package:', error)
    throw new Error('Failed to fetch package')
  }
}

/**
 * Create a new service package
 */
export async function createServicePackage(data: CreateServicePackageInput): Promise<SerializedServicePackage> {
  try {
    const { themeIds, price, discountPrice, ...rest } = data

    // Create package
    const pkg = await prisma.servicePackage.create({
      data: {
        ...rest,
        price: new Prisma.Decimal(price),
        discountPrice: discountPrice ? discountPrice : null,
        themes: themeIds
          ? {
              create: themeIds.map(themeId => ({
                theme: {
                  connect: { id: themeId }
                }
              }))
            }
          : undefined
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
            isPublished: true
          }
        },
        themes: {
          include: {
            theme: true
          }
        }
      }
    })

    revalidatePath(`/admin/services/edit/${data.serviceId}`)
    revalidatePath('/admin/services/list')

    return serializeServicePackage(pkg)
  } catch (error) {
    console.error('Error creating service package:', error)
    throw new Error('Failed to create package')
  }
}

/**
 * Update an existing service package
 */
export async function updateServicePackage(
  packageId: string,
  data: UpdateServicePackageInput
): Promise<SerializedServicePackage> {
  try {
    const { themeIds, price, discountPrice, ...rest } = data

    // If themes are being updated, delete old ones and create new ones
    if (themeIds !== undefined) {
      await prisma.servicePackageTheme.deleteMany({
        where: { packageId }
      })
    }
    const pkg = await prisma.servicePackage.update({
      where: { id: packageId },
      data: {
        ...rest,
        ...(price !== undefined && { price: new Prisma.Decimal(price) }),
        ...(discountPrice !== undefined && { discountPrice: discountPrice ? discountPrice : null }),
        ...(themeIds !== undefined && {
          themes: {
            create: themeIds.map(themeId => ({
              theme: {
                connect: { id: themeId }
              }
            }))
          }
        })
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
            isPublished: true
          }
        },
        themes: {
          include: {
            theme: true
          }
        }
      }
    })

    revalidatePath(`/admin/services/edit/${pkg.service.id}`)
    revalidatePath('/admin/services/list')

    return serializeServicePackage(pkg)
  } catch (error) {
    console.error('Error updating service package:', error)
    throw new Error('Failed to update package')
  }
}

/**
 * Delete a service package
 */
export async function deleteServicePackage(packageId: string): Promise<void> {
  try {
    const pkg = await prisma.servicePackage.findUnique({
      where: { id: packageId },
      select: { serviceId: true }
    })

    // Delete themes first (cascade should handle this, but being explicit)
    await prisma.servicePackageTheme.deleteMany({
      where: { packageId }
    })

    // Delete package
    await prisma.servicePackage.delete({
      where: { id: packageId }
    })

    if (pkg) {
      revalidatePath(`/admin/services/edit/${pkg.serviceId}`)
      revalidatePath('/admin/services/list')
    }
  } catch (error) {
    console.error('Error deleting service package:', error)
    throw new Error('Failed to delete package')
  }
}

/**
 * Get packages by service ID with specific filters (for search)
 */
export async function searchServicePackages(filters: {
  age?: number
  kids?: number
  gender?: GenderFocus
  themeIds?: string[]
}): Promise<ServicePackageWithRelations[]> {
  try {
    const packageWhere: Prisma.ServicePackageWhereInput = {
      // Age filter
      ...(filters.age && {
        AND: [
          { OR: [{ ageMin: null }, { ageMin: { lte: filters.age } }] },
          { OR: [{ ageMax: null }, { ageMax: { gte: filters.age } }] }
        ]
      }),

      // Kids count filter
      ...(filters.kids && {
        minKids: { lte: filters.kids },
        maxKids: { gte: filters.kids }
      }),

      // Gender filter
      ...(filters.gender &&
        filters.gender !== 'neutral' && {
          gender_focus: { in: [filters.gender, 'neutral'] }
        }),

      // Theme filter
      ...(filters.themeIds &&
        filters.themeIds.length > 0 && {
          themes: {
            some: {
              themeId: { in: filters.themeIds }
            }
          }
        }),

      // Only published services
      service: {
        isPublished: true
      }
    }

    const packages = await prisma.servicePackage.findMany({
      where: packageWhere,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
            isPublished: true
          }
        },
        themes: {
          include: {
            theme: true
          }
        }
      }
    })

    return packages
  } catch (error) {
    console.error('Error searching service packages:', error)
    throw new Error('Failed to search packages')
  }
}
