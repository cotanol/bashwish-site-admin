import { NextRequest, NextResponse } from 'next/server'
import { createVendorApplication } from '@/actions/vendor-actions'
import { vendorClaimSchema } from '@/schemas'
import { ZodError } from 'zod'

export const dynamic = 'force-dynamic'

/**
 * ✅ POST /api/public/vendor-claims
 * Create a vendor application from public site
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validatedData = vendorClaimSchema.parse(body)

    const application = await createVendorApplication(validatedData)

    return NextResponse.json({
      success: true,
      data: {
        applicationId: application.id,
        message: 'Your vendor application has been submitted! We will review it and contact you within 24-48 hours.'
      }
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    // Check for duplicate email error
    if (error instanceof Error && error.message === 'DUPLICATE_EMAIL') {
      return NextResponse.json(
        {
          success: false,
          error:
            'This email has already been registered. If you already submitted a request, please wait for our response or contact support.'
        },
        { status: 409 } // 409 Conflict
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create vendor application'
      },
      { status: 500 }
    )
  }
}
