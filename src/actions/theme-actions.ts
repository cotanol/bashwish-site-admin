'use server'

import prisma from '@/libs/prisma'
import type { Theme } from '@prisma/client'

// ============================================
// THEMES/CATEGORIES CRUD
// ============================================

export type ThemeWithPackages = Theme & {
  packages: {
    package: {
      id: string
      name: string
      venue: {
        id: string
        name: string
        slug: string
        status: string
      }
    }
  }[]
  _count?: {
    packages: number
  }
}

/**
 * Get all themes
 * For admin management page - limited to prevent DB overload
 */
export async function getThemes(limit = 50): Promise<ThemeWithPackages[]> {
  try {
    return await prisma.theme.findMany({
      take: limit,
      include: {
        packages: {
          include: {
            package: {
              select: {
                id: true,
                name: true,
                venue: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    status: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            packages: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Error fetching themes:', error)
    throw new Error('Failed to fetch themes')
  }
}

/**
 * Get all ACTIVE themes (for filters/dropdowns)
 * No limit needed as themes are a controlled catalog
 */
export async function getActiveThemes(): Promise<Theme[]> {
  try {
    return await prisma.theme.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true
      },
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Error fetching active themes:', error)
    throw new Error('Failed to fetch active themes')
  }
}

/**
 * Get theme by ID
 */
export async function getThemeById(id: string): Promise<ThemeWithPackages | null> {
  try {
    return await prisma.theme.findUnique({
      where: { id },
      include: {
        packages: {
          include: {
            package: {
              select: {
                id: true,
                name: true,
                venue: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    status: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            packages: true
          }
        }
      }
    })
  } catch (error) {
    console.error('Error fetching theme:', error)
    throw new Error('Failed to fetch theme')
  }
}

/**
 * Get theme by slug
 */
export async function getThemeBySlug(slug: string): Promise<ThemeWithPackages | null> {
  try {
    return await prisma.theme.findUnique({
      where: { slug },
      include: {
        packages: {
          include: {
            package: {
              select: {
                id: true,
                name: true,
                venue: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    status: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            packages: true
          }
        }
      }
    })
  } catch (error) {
    console.error('Error fetching theme by slug:', error)
    throw new Error('Failed to fetch theme')
  }
}

/**
 * Create theme
 */
export async function createTheme(data: {
  name: string
  slug: string
  icon?: string
  color?: string
  description?: string
}): Promise<Theme> {
  try {
    return await prisma.theme.create({
      data
    })
  } catch (error) {
    console.error('Error creating theme:', error)
    throw new Error('Failed to create theme')
  }
}

/**
 * Update theme
 */
export async function updateTheme(
  id: string,
  data: {
    name?: string
    slug?: string
    icon?: string
    color?: string
    description?: string
  }
): Promise<Theme> {
  try {
    return await prisma.theme.update({
      where: { id },
      data
    })
  } catch (error) {
    console.error('Error updating theme:', error)
    throw new Error('Failed to update theme')
  }
}

/**
 * Delete theme
 */
export async function deleteTheme(id: string): Promise<void> {
  try {
    // Check if theme has packages
    const theme = await prisma.theme.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            packages: true
          }
        }
      }
    })

    if (theme && theme._count.packages > 0) {
      throw new Error('Cannot delete theme with associated packages')
    }

    await prisma.theme.delete({
      where: { id }
    })
  } catch (error) {
    console.error('Error deleting theme:', error)
    throw new Error('Failed to delete theme')
  }
}

/**
 * Toggle theme active status
 */
export async function toggleThemeActive(id: string): Promise<Theme> {
  try {
    const theme = await prisma.theme.findUnique({
      where: { id },
      select: { isActive: true }
    })

    if (!theme) {
      throw new Error('Theme not found')
    }

    // If isActive is undefined, default to true, then toggle
    const currentStatus = theme.isActive ?? true

    return await prisma.theme.update({
      where: { id },
      data: {
        isActive: !currentStatus
      }
    })
  } catch (error: any) {
    console.error('Error toggling theme status:', error)
    throw error // Throw original error to see the actual issue
  }
}

/**
 * Get popular themes (by package count)
 */
export async function getPopularThemes(limit = 10): Promise<ThemeWithPackages[]> {
  try {
    const themes = await prisma.theme.findMany({
      include: {
        packages: {
          include: {
            package: {
              select: {
                id: true,
                name: true,
                venue: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    status: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            packages: true
          }
        }
      },
      orderBy: {
        packages: {
          _count: 'desc'
        }
      },
      take: limit
    })

    return themes
  } catch (error) {
    console.error('Error fetching popular themes:', error)
    throw new Error('Failed to fetch popular themes')
  }
}
