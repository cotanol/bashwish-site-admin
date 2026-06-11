import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { getVendorByUserId } from '@/actions/vendor-actions'
import { getVenueById } from '@/actions/venue-actions'
import { getVenueImages } from '@/actions/venue-image-actions'
import { serializeVenue } from '@/utils/serializers'
import VendorImageGallery from '@/views/vendor/VendorImageGallery'

export const metadata: Metadata = {
  title: 'Venue Gallery - Vendor Panel',
  description: 'Manage venue images and photos'
}

interface Props {
  params: Promise<{
    id: string
  }>
}

const VenueGalleryPage = async ({ params }: Props) => {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  if (session.user.role !== 'vendor') {
    redirect('/admin/dashboard')
  }

  // Get vendor data
  const vendor = await getVendorByUserId(session.user.id)

  if (!vendor) {
    redirect('/vendor/venues')
  }

  // Await params (Next.js 15 requirement)
  const { id } = await params

  // Get venue and verify ownership
  const venue = await getVenueById(id)

  if (!venue) {
    redirect('/vendor/venues')
  }

  if (venue.vendorId !== vendor.id) {
    redirect('/vendor/venues')
  }

  // Get images for this venue
  const images = await getVenueImages(id)

  return (
    <div>
      <div className='mb-6'>
        <h4 className='text-xl font-semibold'>{venue.name}</h4>
        <p className='text-sm text-gray-500'>Manage photos and images for this venue</p>
      </div>
      <VendorImageGallery venueId={id} images={images} />
    </div>
  )
}

export default VenueGalleryPage
