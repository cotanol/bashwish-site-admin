import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { TrackedTargetType } from '@prisma/client'

export const dynamic = 'force-dynamic'

// CORS headers - más permisivos para desarrollo
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400'
}

/**
 * POST /api/track-click
 * Registra un click cuando el usuario sale hacia el sitio web del venue/service
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    if (!rawBody || rawBody.trim() === '') {
      return NextResponse.json({ success: false, error: 'Empty request body' }, { status: 400, headers: corsHeaders })
    }

    let body
    try {
      body = JSON.parse(rawBody)
    } catch (parseError) {
      return NextResponse.json({ success: false, error: 'Invalid JSON format' }, { status: 400, headers: corsHeaders })
    }

    const { targetId, targetType, vendorId } = body

    if (!targetId || !targetType) {
      return NextResponse.json(
        { success: false, error: 'targetId and targetType are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!['VENUE', 'SERVICE'].includes(targetType)) {
      return NextResponse.json(
        { success: false, error: 'targetType must be VENUE or SERVICE' },
        { status: 400, headers: corsHeaders }
      )
    }

    const clickData = {
      targetId: String(targetId),
      targetType: targetType as TrackedTargetType,
      vendorId: vendorId ? String(vendorId) : null
    }

    const click = await prisma.click.create({
      data: clickData
    })

    return NextResponse.json(
      {
        success: true,
        clickId: click.id,
        timestamp: click.createdAt
      },
      {
        status: 200,
        headers: corsHeaders
      }
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track click',
        details: error instanceof Error ? error.message : String(error)
      },
      {
        status: 500,
        headers: corsHeaders
      }
    )
  }
}

// Enable CORS for public site
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  })
}
