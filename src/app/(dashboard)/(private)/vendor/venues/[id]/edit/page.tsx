import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { getVendorByUserId } from '@/actions/vendor-actions'
import { getVenueById } from '@/actions/venue-actions'
import { serializeVenue } from '@/utils/serializers'
import VenueForm from '@views/apps/ecommerce/products/add/VenueForm'

export const metadata: Metadata = {
  title: 'Edit Venue - Vendor Panel',
  description: 'Edit your venue information'
}

interface Props {
  params: Promise<{
    id: string
  }>
}

const EditVenuePage = async ({ params }: Props) => {
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

  return <VenueForm mode='edit' venue={serializeVenue(venue)} vendorId={vendor.id} />
}

export default EditVenuePage
