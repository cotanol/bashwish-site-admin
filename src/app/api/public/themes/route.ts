import { NextResponse } from 'next/server'
import { getActiveThemes } from '@/actions/theme-actions'

/**
 * GET /api/public/themes
 * Get all active themes (for venue/service search filters)
 * Uses getActiveThemes() - only returns active themes (catalog data with controlled growth)
 */
export async function GET() {
  try {
    const themes = await getActiveThemes()

    return NextResponse.json({
      success: true,
      data: themes
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch themes'
      },
      { status: 500 }
    )
  }
}
