import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { v2 as cloudinary } from 'cloudinary'
import prisma from '@/libs/prisma'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const venueId = formData.get('venueId') as string
    const altText = formData.get('altText') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!venueId) {
      return NextResponse.json({ error: 'Venue ID is required' }, { status: 400 })
    }

    // 3. Verify the venue belongs to the user (for vendors) or user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { vendor: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // For vendors, check venue ownership
    if (user.role === 'vendor') {
      if (!user.vendor) {
        return NextResponse.json({ error: 'Vendor profile not found' }, { status: 403 })
      }

      const venue = await prisma.venue.findFirst({
        where: {
          id: venueId,
          vendorId: user.vendor.id
        }
      })

      if (!venue) {
        return NextResponse.json({ error: 'Venue not found or access denied' }, { status: 403 })
      }
    }
    // Admin can upload to any venue

    // 4. Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 5. Build Cloudinary folder path based on vendor ID
    const vendorId = user.vendor?.id || 'admin'
    const folderPath = `bashwish/${vendorId}/venues`

    // 6. Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          resource_type: 'auto',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
          transformation: [
            { width: 1920, height: 1080, crop: 'limit' }, // Max dimensions
            { quality: 'auto:good' }, // Automatic quality optimization
            { fetch_format: 'auto' } // Automatic format selection
          ]
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )

      uploadStream.end(buffer)
    })

    // 7. Return the Cloudinary URL
    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      altText: altText || null
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// For deleting images from Cloudinary
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { publicId } = await request.json()

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 })
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId)

    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Delete failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
