'use server'

import prisma from '@/libs/prisma'
import { startOfDay, subDays, endOfDay } from 'date-fns'

// ============================================
// TYPES
// ============================================

export type VendorAnalytics = {
  overview: {
    totalClicks: number
    clicksLast7Days: number
    clicksLast30Days: number
    percentageChange: number // vs previous period
  }
  venuePerformance: {
    venueId: string
    venueName: string
    clicks: number
    lastClick: Date | null
  }[]
  recentClicks: {
    venueName: string
    clickedAt: Date
  }[]
  chartData: {
    day: string
    clicks: number
  }[]
}

export type AdminAnalytics = {
  overview: {
    totalClicks: number
    venueClicks: number
    serviceClicks: number
    clicksToday: number
    clicksLast7Days: number
    clicksLast30Days: number
  }
  topVenues: {
    id: string
    name: string
    clicks: number
    vendorName: string
  }[]
  topServices: {
    id: string
    name: string
    clicks: number
  }[]
  clicksByType: {
    type: 'VENUE' | 'SERVICE'
    count: number
  }[]
  chartData: {
    day: string
    venueClicks: number
    serviceClicks: number
    total: number
  }[]
}

// ============================================
// VENDOR ANALYTICS
// ============================================

/**
 * Get analytics for a specific vendor
 */
export async function getVendorAnalytics(vendorId: string): Promise<VendorAnalytics> {
  const now = new Date()
  const last7Days = subDays(now, 7)
  const last14Days = subDays(now, 14)
  const last30Days = subDays(now, 30)
  const last60Days = subDays(now, 60)

  // Get total clicks
  const totalClicks = await prisma.click.count({
    where: { vendorId }
  })

  // Get clicks last 7 days
  const clicksLast7Days = await prisma.click.count({
    where: {
      vendorId,
      createdAt: { gte: last7Days }
    }
  })

  // Get clicks previous 7 days (for comparison)
  const clicksPrevious7Days = await prisma.click.count({
    where: {
      vendorId,
      createdAt: { gte: last14Days, lt: last7Days }
    }
  })

  // Get clicks last 30 days
  const clicksLast30Days = await prisma.click.count({
    where: {
      vendorId,
      createdAt: { gte: last30Days }
    }
  })

  // Calculate percentage change
  const percentageChange =
    clicksPrevious7Days === 0
      ? clicksLast7Days > 0
        ? 100
        : 0
      : ((clicksLast7Days - clicksPrevious7Days) / clicksPrevious7Days) * 100

  // Get venue performance
  const clicksByVenue = await prisma.click.groupBy({
    by: ['targetId'],
    where: {
      vendorId,
      targetType: 'VENUE'
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    }
  })

  // Get venue names and last click
  const venuePerformance = await Promise.all(
    clicksByVenue.map(async item => {
      const venue = await prisma.venue.findUnique({
        where: { id: item.targetId },
        select: { name: true }
      })

      const lastClick = await prisma.click.findFirst({
        where: {
          targetId: item.targetId,
          vendorId
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      })

      return {
        venueId: item.targetId,
        venueName: venue?.name || 'Unknown Venue',
        clicks: item._count.id,
        lastClick: lastClick?.createdAt || null
      }
    })
  )

  // Get recent clicks (last 10)
  const recentClicksData = await prisma.click.findMany({
    where: {
      vendorId,
      targetType: 'VENUE'
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  // Get venue names for recent clicks
  const recentClicks = await Promise.all(
    recentClicksData.map(async click => {
      const venue = await prisma.venue.findUnique({
        where: { id: click.targetId },
        select: { name: true }
      })

      return {
        venueName: venue?.name || 'Unknown Venue',
        clickedAt: click.createdAt
      }
    })
  )

  // Get chart data (last 7 days)
  const chartData = []
  for (let i = 6; i >= 0; i--) {
    const day = subDays(now, i)
    const dayStart = startOfDay(day)
    const dayEnd = endOfDay(day)

    const clicks = await prisma.click.count({
      where: {
        vendorId,
        createdAt: {
          gte: dayStart,
          lte: dayEnd
        }
      }
    })

    chartData.push({
      day: day.toLocaleDateString('es-MX', { weekday: 'short' }),
      clicks
    })
  }

  return {
    overview: {
      totalClicks,
      clicksLast7Days,
      clicksLast30Days,
      percentageChange: Math.round(percentageChange * 10) / 10
    },
    venuePerformance,
    recentClicks,
    chartData
  }
}

// ============================================
// ADMIN ANALYTICS
// ============================================

/**
 * Get analytics for admin dashboard
 */
export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const now = new Date()
  const today = startOfDay(now)
  const last7Days = subDays(now, 7)
  const last30Days = subDays(now, 30)

  // Get total clicks
  const totalClicks = await prisma.click.count()

  // Get clicks by type
  const clicksByType = await prisma.click.groupBy({
    by: ['targetType'],
    _count: {
      id: true
    }
  })

  const venueClicks = clicksByType.find(c => c.targetType === 'VENUE')?._count.id || 0
  const serviceClicks = clicksByType.find(c => c.targetType === 'SERVICE')?._count.id || 0

  // Get clicks today
  const clicksToday = await prisma.click.count({
    where: {
      createdAt: { gte: today }
    }
  })

  // Get clicks last 7 days
  const clicksLast7Days = await prisma.click.count({
    where: {
      createdAt: { gte: last7Days }
    }
  })

  // Get clicks last 30 days
  const clicksLast30Days = await prisma.click.count({
    where: {
      createdAt: { gte: last30Days }
    }
  })

  // Get top 10 venues
  const topVenueClicks = await prisma.click.groupBy({
    by: ['targetId'],
    where: { targetType: 'VENUE' },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10
  })

  const topVenues = await Promise.all(
    topVenueClicks.map(async item => {
      const venue = await prisma.venue.findUnique({
        where: { id: item.targetId },
        select: {
          name: true,
          vendor: {
            select: { businessName: true, contactName: true }
          }
        }
      })

      return {
        id: item.targetId,
        name: venue?.name || 'Unknown',
        clicks: item._count.id,
        vendorName: venue?.vendor.businessName || venue?.vendor.contactName || 'Unknown Vendor'
      }
    })
  )

  // Get top 10 services
  const topServiceClicks = await prisma.click.groupBy({
    by: ['targetId'],
    where: { targetType: 'SERVICE' },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10
  })

  const topServices = await Promise.all(
    topServiceClicks.map(async item => {
      const service = await prisma.service.findUnique({
        where: { id: item.targetId },
        select: { name: true }
      })

      return {
        id: item.targetId,
        name: service?.name || 'Unknown',
        clicks: item._count.id
      }
    })
  )

  // Get chart data (last 7 days)
  const chartData = []
  for (let i = 6; i >= 0; i--) {
    const day = subDays(now, i)
    const dayStart = startOfDay(day)
    const dayEnd = endOfDay(day)

    const venueClicksDay = await prisma.click.count({
      where: {
        targetType: 'VENUE',
        createdAt: { gte: dayStart, lte: dayEnd }
      }
    })

    const serviceClicksDay = await prisma.click.count({
      where: {
        targetType: 'SERVICE',
        createdAt: { gte: dayStart, lte: dayEnd }
      }
    })

    chartData.push({
      day: day.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }),
      venueClicks: venueClicksDay,
      serviceClicks: serviceClicksDay,
      total: venueClicksDay + serviceClicksDay
    })
  }

  return {
    overview: {
      totalClicks,
      venueClicks,
      serviceClicks,
      clicksToday,
      clicksLast7Days,
      clicksLast30Days
    },
    topVenues,
    topServices,
    clicksByType: clicksByType.map(c => ({
      type: c.targetType,
      count: c._count.id
    })),
    chartData
  }
}

// ============================================
// SINGLE VENUE ANALYTICS (FOR ADMIN)
// ============================================

export type VenueAnalyticsDetail = {
  overview: {
    totalClicks: number
    clicksToday: number
    clicksLast7Days: number
    clicksLast30Days: number
    percentageChange: number
  }
  recentClicks: {
    id: string
    clickedAt: Date
    targetType: string
  }[]
  chartData: {
    day: string
    clicks: number
  }[]
}

/**
 * Get analytics for a specific venue (admin view)
 */
export async function getVenueAnalytics(venueId: string, vendorId: string): Promise<VenueAnalyticsDetail> {
  const now = new Date()
  const today = startOfDay(now)
  const last7Days = subDays(now, 7)
  const last14Days = subDays(now, 14)
  const last30Days = subDays(now, 30)

  // Get total clicks for this venue
  const totalClicks = await prisma.click.count({
    where: {
      targetType: 'VENUE',
      targetId: venueId
    }
  })

  // Get clicks today
  const clicksToday = await prisma.click.count({
    where: {
      targetType: 'VENUE',
      targetId: venueId,
      createdAt: { gte: today }
    }
  })

  // Get clicks last 7 days
  const clicksLast7Days = await prisma.click.count({
    where: {
      targetType: 'VENUE',
      targetId: venueId,
      createdAt: { gte: last7Days }
    }
  })

  // Get clicks previous 7 days (for comparison)
  const clicksPrevious7Days = await prisma.click.count({
    where: {
      targetType: 'VENUE',
      targetId: venueId,
      createdAt: { gte: last14Days, lt: last7Days }
    }
  })

  // Get clicks last 30 days
  const clicksLast30Days = await prisma.click.count({
    where: {
      targetType: 'VENUE',
      targetId: venueId,
      createdAt: { gte: last30Days }
    }
  })

  // Calculate percentage change
  const percentageChange =
    clicksPrevious7Days === 0
      ? clicksLast7Days > 0
        ? 100
        : 0
      : ((clicksLast7Days - clicksPrevious7Days) / clicksPrevious7Days) * 100

  // Get recent clicks (last 20)
  const recentClicks = await prisma.click.findMany({
    where: {
      targetType: 'VENUE',
      targetId: venueId
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      createdAt: true,
      targetType: true
    }
  })

  // Get chart data (last 7 days)
  const chartData = []
  for (let i = 6; i >= 0; i--) {
    const day = subDays(now, i)
    const dayStart = startOfDay(day)
    const dayEnd = endOfDay(day)

    const clicks = await prisma.click.count({
      where: {
        targetType: 'VENUE',
        targetId: venueId,
        createdAt: {
          gte: dayStart,
          lte: dayEnd
        }
      }
    })

    chartData.push({
      day: day.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }),
      clicks
    })
  }

  return {
    overview: {
      totalClicks,
      clicksToday,
      clicksLast7Days,
      clicksLast30Days,
      percentageChange: Math.round(percentageChange * 10) / 10
    },
    recentClicks: recentClicks.map(click => ({
      id: click.id,
      clickedAt: click.createdAt,
      targetType: click.targetType
    })),
    chartData
  }
}
