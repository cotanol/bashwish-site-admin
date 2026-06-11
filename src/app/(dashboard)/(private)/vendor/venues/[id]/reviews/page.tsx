import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { getVendorByUserId } from '@/actions/vendor-actions'
import { getVenueById } from '@/actions/venue-actions'
import { getVenueReviews } from '@/actions/review-actions'
import VenueReviewManager from '@/views/vendor/VenueReviewManager'

export const metadata: Metadata = {
  title: 'Manage Reviews - Vendor Panel',
  description: 'Manage reviews for your venue'
}

interface Props {
  params: Promise<{
    id: string
  }>
}

const VenueReviewsPage = async ({ params }: Props) => {
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

  // Get reviews for this venue
  const reviews = await getVenueReviews(id)

  return <VenueReviewManager venueId={id} venueName={venue.name} reviews={reviews} userId={session.user.id} />
}

export default VenueReviewsPage
