// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import PendingReviewsView from '@/views/admin/reviews/PendingReviewsView'

// Actions
import { getPendingReviews, getPendingServiceReviews } from '@/actions/review-actions'

const PendingReviewsPage = async () => {
  // Fetch pending reviews from both venues and services
  const [venueReviews, serviceReviews] = await Promise.all([
    getPendingReviews(),
    getPendingServiceReviews()
  ])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <PendingReviewsView
          venueReviews={venueReviews}
          serviceReviews={serviceReviews}
        />
      </Grid>
    </Grid>
  )
}

export default PendingReviewsPage
