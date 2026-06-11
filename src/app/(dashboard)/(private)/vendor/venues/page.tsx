import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { getVendorByUserId, getVendorVenues } from '@/actions/vendor-actions'
import VendorVenuesList from '@/views/vendor/VendorVenuesList'
import { serializeVenues } from '@/utils/serializers'

export const metadata: Metadata = {
  title: 'My Venues - Vendor Panel',
  description: 'Manage all your venues'
}

const VendorVenuesPage = async () => {
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
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <p>No vendor account found. Please contact support.</p>
      </div>
    )
  }

  // Get all venues
  const venues = await getVendorVenues(session.user.id)

  // Serialize venues to plain objects (convert Decimal to number)
  const serializedVenues = serializeVenues(venues)

  return <VendorVenuesList vendor={vendor} venues={serializedVenues} userId={session.user.id} />
}

export default VendorVenuesPage
