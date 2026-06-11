import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { authOptions } from '@/libs/auth'
import { getVendorByUserId } from '@/actions/vendor-actions'
import { getVenueById } from '@/actions/venue-actions'
import { getAllThemes } from '@/actions/venue-package-actions'
import VenuePackageForm from '@/views/vendor/VenuePackageForm'
import { getServerSession } from 'next-auth'

export const metadata: Metadata = {
  title: 'Create Package - Vendor Panel',
  description: 'Create a new package for your venue'
}

interface Props {
  params: Promise<{
    id: string
  }>
}

const CreatePackagePage = async ({ params }: Props) => {
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

  // Get all themes for selection
  const themes = await getAllThemes()

  return <VenuePackageForm venueId={id} venueName={venue.name} themes={themes} mode='create' />
}

export default CreatePackagePage
