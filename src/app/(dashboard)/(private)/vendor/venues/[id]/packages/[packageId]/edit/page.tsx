import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { getVendorByUserId } from '@/actions/vendor-actions'
import { getVenueById } from '@/actions/venue-actions'
import { getPackageById, getAllThemes } from '@/actions/venue-package-actions'
import { serializePackage } from '@/utils/serializers'
import VenuePackageForm from '@/views/vendor/VenuePackageForm'

export const metadata: Metadata = {
  title: 'Edit Package - Vendor Panel',
  description: 'Edit package for your venue'
}

interface Props {
  params: Promise<{
    id: string
    packageId: string
  }>
}

const EditPackagePage = async ({ params }: Props) => {
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
  const { id, packageId } = await params

  // Get venue and verify ownership
  const venue = await getVenueById(id)

  if (!venue) {
    redirect('/vendor/venues')
  }

  if (venue.vendorId !== vendor.id) {
    redirect('/vendor/venues')
  }

  // Get package and verify it belongs to this venue
  const packageData = await getPackageById(packageId)

  if (!packageData || packageData.venueId !== id) {
    redirect(`/vendor/venues/${id}/packages`)
  }

  // Get all themes for selection
  const themes = await getAllThemes()

  return (
    <VenuePackageForm
      venueId={id}
      venueName={venue.name}
      themes={themes}
      mode='edit'
      packageData={serializePackage(packageData)}
    />
  )
}

export default EditPackagePage
