// Next Imports
import { notFound } from 'next/navigation'

// Actions
import { getServiceById } from '@/actions/service-actions'
import { getServiceReviews } from '@/actions/review-actions'

// Utils
import { serializeService } from '@/utils/serializers'

// View Component
import ServiceReviewsView from '@/views/admin/reviews/ServiceReviewsView'

interface ServiceReviewsPageProps {
  params: Promise<{ id: string }>
}

export default async function ServiceReviewsPage({ params }: ServiceReviewsPageProps) {
  const { id } = await params

  const [service, reviews] = await Promise.all([
    getServiceById(id),
    getServiceReviews(id)
  ])

  if (!service) {
    notFound()
  }

  // Serialize service to convert Decimal to number
  const serializedService = serializeService(service)

  // Serialize dates for client component
  const serializedReviews = reviews.map(review => ({
    ...review,
    reviewDate: review.reviewDate.toISOString(),
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString()
  }))

  return <ServiceReviewsView service={serializedService} reviews={serializedReviews} />
}
