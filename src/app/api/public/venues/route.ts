import { NextRequest, NextResponse } from 'next/server'
import { getVenues } from '@/actions/venue-actions'
import { serializeVenues } from '@/utils/serializers'
import type { VenueFilters } from '@/actions/venue-actions'

/**
 * GET /api/public/venues
 * Public endpoint to fetch venues for the public website
 *
 * Query params:
 * - search: string (search in name, description, address)
 * - city: string
 * - zip: string (ZIP code - optional, used for scoring)
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
    const filters: VenueFilters = {
      status: 'published' // Only show published venues to public
    }

    const search = searchParams.get('search')
    const city = searchParams.get('city')
    const zipCode = searchParams.get('zip') || searchParams.get('zipCode')
    const isFeatured = searchParams.get('isFeatured')

    if (search) filters.search = search
    if (city) filters.city = city
    if (zipCode) filters.zipCode = zipCode
    if (isFeatured === 'true') filters.isFeatured = true

    // Pagination
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20

    // Package filters (will be applied in venue-actions)
    const kids = searchParams.get('kids')
    const age = searchParams.get('age')
    const gender = searchParams.get('gender')
    const themes = searchParams.get('themes')

    // Add package filters to the filters object (all optional for scoring)
    if (kids) filters.kids = Number(kids)
    if (age) filters.age = Number(age)
    if (gender && gender !== 'neutral') filters.gender = gender as 'boy' | 'girl'
    if (themes) filters.themeIds = themes.split(',')

    // Call existing Server Action (now with scoring system)
    const result = await getVenues(filters, page, limit)

    // Serialize venues to convert Decimal fields to numbers
    const serializedVenues = serializeVenues(result.venues)

    // Return JSON response with CORS headers
    return NextResponse.json(
      {
        success: true,
        data: {
          venues: serializedVenues,
          pagination: {
            total: result.total,
            pages: result.totalPages,
            currentPage: page,
            limit
          }
        }
      },
      {
        headers: {
          'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || '*',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      }
    )
  } catch (error) {
    console.error('❌ [API /api/public/venues] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch venues',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Enable CORS preflight with caching
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
      'Cache-Control': 'public, max-age=86400' // Cache preflight response
    }
  })
}
