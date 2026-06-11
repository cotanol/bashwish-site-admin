import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { getVendorByUserId } from '@/actions/vendor-actions'
import VenueForm from '@views/apps/ecommerce/products/add/VenueForm'

export const metadata: Metadata = {
  title: 'Create New Venue - Vendor Panel',
  description: 'Add a new venue to your business'
}

const CreateVenuePage = async () => {
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

  return <VenueForm mode='create' vendorId={vendor.id} />
}

export default CreateVenuePage
