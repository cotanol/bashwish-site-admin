import prisma from '@/libs/prisma'
import ReviewsListView from '@/views/admin/reviews/ReviewsListView'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ReviewsListPage = async () => {
  // Get all approved venue reviews with venue info
  // CRITICAL LIMIT: Max 15 reviews to avoid DB collapse
  const venueReviews = await prisma.review.findMany({
    where: {
      status: 'APPROVED'
    },
    take: 15,
    include: {
      venue: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Get all approved service reviews with service info
  // CRITICAL LIMIT: Max 15 reviews to avoid DB collapse
  const serviceReviews = await prisma.serviceReview.findMany({
    where: {
      status: 'APPROVED'
    },
    take: 15,
    include: {
      service: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return <ReviewsListView venueReviews={venueReviews} serviceReviews={serviceReviews} />
}

export default ReviewsListPage
