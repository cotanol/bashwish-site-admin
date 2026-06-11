import { NextRequest, NextResponse } from 'next/server'
import { searchVenues } from '@/actions/venue-package-actions'
import { serializeVenues } from '@/utils/serializers'

export const dynamic = 'force-dynamic'

/**
 * POST /api/public/search
 * Search for venues based on package criteria
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      kidsAge,
      numberOfKids,
      eventDate,
      preferences,
      postalCode,
      userEmail,
      firstName,
      location,
      additionalMessage,
      themeIds,
      gender
    } = body

    // Validate required fields
    if (!kidsAge || !numberOfKids) {
      return NextResponse.json({ success: false, error: 'Kids age and number of kids are required' }, { status: 400 })
    }

    // Search for matching venues using package-based filtering
    const venues = await searchVenues({
      age: parseInt(kidsAge),
      kids: parseInt(numberOfKids),
      gender: gender || undefined,
      themeIds: themeIds || undefined,
      city: location || undefined
    })

    // Serialize venues to convert Decimal fields to numbers
    const serializedVenues = serializeVenues(venues)

    // Return matching venues
    return NextResponse.json({
      success: true,
      data: {
        venues: serializedVenues,
        total: serializedVenues.length,
        message: `Found ${serializedVenues.length} venues matching your criteria`
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create search'
      },
      { status: 500 }
    )
  }
}
