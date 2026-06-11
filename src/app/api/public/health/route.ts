import { NextResponse } from 'next/server'

/**
 * Simple health check endpoint to test if API is working
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Public API is working! 🎉',
    timestamp: new Date().toISOString(),
    endpoints: {
      venues: '/api/public/venues',
      health: '/api/public/health'
    }
  })
}
