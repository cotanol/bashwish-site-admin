// Next Imports
import { notFound } from 'next/navigation'

// Actions
import { getVenueById } from '@/actions/venue-actions'
import { getVenueReviews } from '@/actions/review-actions'

// Utils
import { serializeVenue } from '@/utils/serializers'

// View Component
import VenueReviewsView from '@/views/admin/reviews/VenueReviewsView'

interface VenueReviewsPageProps {
  params: Promise<{ id: string }>
}

export default async function VenueReviewsPage({ params }: VenueReviewsPageProps) {
  const { id } = await params

  const [venue, reviews] = await Promise.all([
    getVenueById(id),
    getVenueReviews(id)
  ])

  if (!venue) {
    notFound()
  }

  // Serialize venue to convert Decimal to number
  const serializedVenue = serializeVenue(venue)

  // Serialize dates for client component
  const serializedReviews = reviews.map(review => ({
    ...review,
    reviewDate: review.reviewDate.toISOString(),
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString()
  }))

  return <VenueReviewsView venue={serializedVenue} reviews={serializedReviews} />
}
