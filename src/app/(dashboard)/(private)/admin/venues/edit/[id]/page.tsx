// Component Imports
import VenueForm from '@views/apps/ecommerce/products/add/VenueForm'

// Server Actions
import { getVenueById } from '@/actions/venue-actions'
import { serializeVenue } from '@/utils/serializers'

// Next Imports
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ id: string }>
}

const eCommerceProductsEdit = async ({ params }: Props) => {
  const { id } = await params
  const venue = await getVenueById(id)

  if (!venue) {
    notFound()
  }

  return <VenueForm venue={serializeVenue(venue)} mode='edit' vendorId={venue.vendorId} isAdmin={true} />
}

export default eCommerceProductsEdit
