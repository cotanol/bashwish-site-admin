import { NextRequest, NextResponse } from 'next/server'
import { getVenueBySlug } from '@/actions/venue-actions'
import { serializeVenue } from '@/utils/serializers'

/**
 * GET /api/public/venues/[slug]
 * Public endpoint to fetch a single venue by slug
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Slug parameter is required'
        },
        { status: 400 }
      )
    }

    // Call existing Server Action
    const venue = await getVenueBySlug(slug)

    if (!venue) {
      return NextResponse.json(
        {
          success: false,
          error: 'Venue not found'
        },
        { status: 404 }
      )
    }

    // Only return if venue is published
    if (venue.status !== 'published') {
      return NextResponse.json(
        {
          success: false,
          error: 'Venue not found'
        },
        { status: 404 }
      )
    }

    // Serialize venue to convert Decimal fields to numbers
    const serializedVenue = serializeVenue(venue)

    return NextResponse.json({
      success: true,
      data: {
        venue: serializedVenue
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch venue',
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
