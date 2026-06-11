import { NextRequest, NextResponse } from 'next/server'
import { getServiceBySlug } from '@/actions/service-actions'
import { serializeService } from '@/utils/serializers'

/**
 * GET /api/public/services/[slug]
 * Public endpoint to fetch a single service by slug
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
    const service = await getServiceBySlug(slug)

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service not found'
        },
        { status: 404 }
      )
    }

    // Only return if service is published
    if (!service.isPublished) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service not found'
        },
        { status: 404 }
      )
    }

    // Serialize service to convert Decimal fields to numbers
    const serializedService = serializeService(service)

    return NextResponse.json({
      success: true,
      data: {
        service: serializedService
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch service',
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
