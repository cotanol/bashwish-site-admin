import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'

/**
 * POST /api/public/venues/[slug]/reviews
 * Create a new review for a venue (public API)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.authorName || !body.rating) {
      return NextResponse.json({ success: false, error: 'Author name and rating are required' }, { status: 400 })
    }

    // Validate rating range
    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Find venue by slug
    const venue = await prisma.venue.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!venue) {
      return NextResponse.json({ success: false, error: 'Venue not found' }, { status: 404 })
    }

    // Create review with PENDING status (requires admin approval)
    const review = await prisma.review.create({
      data: {
        venueId: venue.id,
        authorName: body.authorName.trim(),
        authorEmail: body.authorEmail?.trim() || null,
        rating: parseInt(body.rating),
        text: body.text?.trim() || null,
        reviewDate: new Date(),
        source: 'website',
        status: 'PENDING' // Requires admin approval
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully. It will be visible after admin approval.',
      data: {
        id: review.id,
        rating: review.rating,
        status: review.status
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to submit review. Please try again later.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/public/venues/[slug]/reviews
 * Get approved reviews for a venue (public API)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    // Find venue by slug
    const venue = await prisma.venue.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!venue) {
      return NextResponse.json({ success: false, error: 'Venue not found' }, { status: 404 })
    }

    // Get only approved reviews
    const reviews = await prisma.review.findMany({
      where: {
        venueId: venue.id,
        status: 'APPROVED'
      },
      select: {
        id: true,
        authorName: true,
        rating: true,
        text: true,
        reviewDate: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate average rating
    const stats = await prisma.review.aggregate({
      where: {
        venueId: venue.id,
        status: 'APPROVED'
      },
      _avg: { rating: true },
      _count: true
    })

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        stats: {
          averageRating: stats._avg.rating || 0,
          totalReviews: stats._count
        }
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
