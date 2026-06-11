'use server'

import prisma from '@/libs/prisma'
import { startOfDay, subDays } from 'date-fns'

/**
 * Analytics Actions for Dashboard
 * Provides analytics data for the vendor/admin dashboards
 */

// ============================================
// TYPES
// ============================================

export type AnalyticsDashboardData = {
  overview: {
    totalSearches: number
    totalClicks: number
    conversions: number
    conversionRate: number
    totalEmailCaptures: number
    marketingOptIns: number
    activeVenues: number
    totalVenues: number
    featuredVenues: number
    totalReviews: number
    averageRating: number
    weeklyGrowth: number
  }
  chartData: {
    monthlySearches: number
    searchesByDay: {
      day: string
      searches: number
      clicks: number
    }[]
  }
  themes: {
    name: string
    venueCount: number
    popularity: string
    icon?: string | null
  }[]
  cities: {
    city: string
    count: number
  }[]
  recentActivity: {
    lastSearch: Date
    lastClick: Date
    lastReview: Date
  }
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Get dashboard analytics data
 */
export async function getDashboardAnalytics(): Promise<AnalyticsDashboardData> {
  const now = new Date()
  const last7Days = subDays(now, 7)
  const last30Days = subDays(now, 30)

  try {
    // Get basic counts
    const [totalVenues, activeVenues, featuredVenues, totalReviews, totalClicks] = await Promise.all([
      prisma.venue.count(),
      prisma.venue.count({ where: { status: 'published' } }),
      prisma.venue.count({ where: { isFeatured: true } }),
      prisma.review.count(),
      prisma.click.count()
    ])

    // Get clicks for last 7 days
    const clicksLast7Days = await prisma.click.count({
      where: { createdAt: { gte: last7Days } }
    })

    // Get average rating
    const allReviews = await prisma.review.findMany({
      select: { rating: true }
    })
    const averageRating =
      allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length : 0

    // Get clicks by day for last 7 days
    const clicksByDay = await Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const date = subDays(now, 6 - i)
        const startDate = startOfDay(date)
        const endDate = startOfDay(subDays(date, -1))

        return prisma.click
          .count({
            where: {
              createdAt: {
                gte: startDate,
                lt: endDate
              }
            }
          })
          .then(count => ({
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            searches: 0, // TODO: Implement when Search model exists
            clicks: count
          }))
      })
    )

    // Get top themes
    const themesData = await prisma.theme.findMany({
      where: { isActive: true },
      include: {
        packages: {
          include: {
            package: {
              include: {
                venue: {
                  select: { id: true }
                }
              }
            }
          }
        }
      }
    })

    const themes = themesData
      .map(theme => ({
        name: theme.name,
        venueCount: new Set(theme.packages.map(p => p.package.venue.id)).size,
        popularity: 'High',
        icon: null
      }))
      .sort((a, b) => b.venueCount - a.venueCount)
      .slice(0, 5)

    // Get top cities
    const venuesGrouped = await prisma.venue.groupBy({
      by: ['city'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    })

    const cities = venuesGrouped.map(v => ({
      city: v.city,
      count: v._count.id
    }))

    // Get recent activity
    const [lastClick, lastReview] = await Promise.all([
      prisma.click.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      }),
      prisma.review.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      })
    ])

    return {
      overview: {
        totalSearches: 0, // TODO: Implement when Search model exists
        totalClicks,
        conversions: 0, // TODO: Implement conversion tracking
        conversionRate: 0,
        totalEmailCaptures: 0, // TODO: Implement when EmailCapture model exists
        marketingOptIns: 0,
        activeVenues,
        totalVenues,
        featuredVenues,
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(1)),
        weeklyGrowth: 0
      },
      chartData: {
        monthlySearches: 0,
        searchesByDay: clicksByDay
      },
      themes,
      cities,
      recentActivity: {
        lastSearch: new Date(), // TODO: Implement when Search model exists
        lastClick: lastClick?.createdAt || new Date(),
        lastReview: lastReview?.createdAt || new Date()
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error)
    throw new Error('Failed to fetch dashboard analytics')
  }
}

/**
 * Get analytics for a specific vendor
 */
export async function getVendorDashboardAnalytics(vendorId: string): Promise<AnalyticsDashboardData> {
  // TODO: Implement vendor-specific analytics
  // For now, return the general analytics filtered by vendorId
  return getDashboardAnalytics()
}
