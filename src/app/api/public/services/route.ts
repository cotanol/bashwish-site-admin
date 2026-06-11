import { NextRequest, NextResponse } from 'next/server'
import { getServices } from '@/actions/service-actions'
import { serializeServices } from '@/utils/serializers'
import type { ServiceFilters } from '@/actions/service-actions'

/**
 * GET /api/public/services
 * Public endpoint to fetch services for the public website
 *
 * Query params:
 * - search: string (search in name, description)
 * - isFeatured: boolean
 * - kids: number (filter packages by minKids/maxKids)
 * - age: number (filter packages by ageMin/ageMax)
 * - gender: string (neutral, boy, girl)
 * - themes: string (comma-separated theme IDs)
 * - page: number (default: 1)
 * - limit: number (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Build filters from query params
    const filters: ServiceFilters = {
      isPublished: true // Only show published services to public
    }

    const search = searchParams.get('search')
    const isFeatured = searchParams.get('isFeatured')

    if (search) filters.search = search
    if (isFeatured === 'true') filters.isFeatured = true

    // Pagination
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20

    // Package filters (will be applied in service-actions)
    const kids = searchParams.get('kids')
    const age = searchParams.get('age')
    const gender = searchParams.get('gender')
    const themes = searchParams.get('themes')

    // Add package filters to the filters object
    if (kids) filters.kids = Number(kids)
    if (age) filters.age = Number(age)
    if (gender && gender !== 'neutral') filters.gender = gender as 'boy' | 'girl'
    if (themes) filters.themeIds = themes.split(',')

    // Call existing Server Action
    const result = await getServices(filters, page, limit)

    // Serialize services to convert Decimal fields to numbers
    const serializedServices = serializeServices(result.services)

    // Return JSON response
    return NextResponse.json({
      success: true,
      data: {
        services: serializedServices,
        pagination: result.pagination
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch services',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Enable CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
