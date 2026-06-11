// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import ProductListTable from '@views/apps/ecommerce/products/list/ProductListTable'

// Data Imports
import { getVenues } from '@/actions/venue-actions'
import { serializeVenues } from '@/utils/serializers'

const VenuesListPage = async () => {
  // Fetch venues - only show venues that are pending review or already reviewed
  // Draft venues should stay private to the vendor until they submit for review
  // LIMIT: Max 15 venues per page to avoid DB collapse in production
  const { venues, total } = await getVenues(
    {
      status: ['pending_review', 'published', 'suspended']
    },
    1,
    15
  )

  // Serialize venues to plain objects (convert Decimal to number)
  const serializedVenues = serializeVenues(venues)

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <ProductListTable venueData={serializedVenues} />
      </Grid>
    </Grid>
  )
}

export default VenuesListPage
