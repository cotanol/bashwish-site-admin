import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { getVendorByUserId } from '@/actions/vendor-actions'
import { getVenueById } from '@/actions/venue-actions'
import { getVenuePackages } from '@/actions/venue-package-actions'
import VenuePackageManager from '@/views/vendor/VenuePackageManager'
import { serializePackages } from '@/utils/serializers'

export const metadata: Metadata = {
  title: 'Manage Packages - Vendor Panel',
  description: 'Manage packages for your venue'
}

interface Props {
  params: Promise<{
    id: string
  }>
}

const VenuePackagesPage = async ({ params }: Props) => {
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

  // Get packages for this venue
  const packages = await getVenuePackages(id)

  // Serialize packages
  const serializedPackages = serializePackages(packages)

  return (
    <VenuePackageManager venueId={id} venueName={venue.name} packages={serializedPackages} userId={session.user.id} />
  )
}

export default VenuePackagesPage
