import { NextRequest, NextResponse } from 'next/server'
import { sendTestEmail, sendVendorWelcomeEmail } from '@/libs/email'

/**
 * Test endpoint to send emails
 * GET /api/test-email?to=email@example.com
 * GET /api/test-email?to=email@example.com&type=vendor&name=John
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const toEmail = searchParams.get('to')
    const type = searchParams.get('type') || 'test'
    const name = searchParams.get('name') || 'Test Vendor'

    if (!toEmail) {
      return NextResponse.json(
        { error: 'Missing "to" parameter. Usage: /api/test-email?to=email@example.com' },
        { status: 400 }
      )
    }

    if (type === 'vendor') {
      // Send vendor welcome email
      const result = await sendVendorWelcomeEmail({
        vendorName: name,
        vendorEmail: toEmail,
        temporaryPassword: 'TempPass123!'
      })

      return NextResponse.json({
        message: 'Vendor welcome email sent successfully',
        ...result
      })
    } else {
      // Send test email
      const result = await sendTestEmail(toEmail)

      return NextResponse.json({
        message: 'Test email sent successfully',
        ...result
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send email'
      },
      { status: 500 }
    )
  }
}
