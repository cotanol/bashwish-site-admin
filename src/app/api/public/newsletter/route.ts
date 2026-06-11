import { NextResponse } from 'next/server'

import { createNewsletterSubscription } from '@/actions/newsletter-actions'

export async function POST(request: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || '*'
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const result = await createNewsletterSubscription(email)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Successfully subscribed!' },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Newsletter API error:', error)

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Enable CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Cache-Control': 'public, max-age=86400'
    }
  })
}
