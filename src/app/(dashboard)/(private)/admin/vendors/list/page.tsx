// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import VendorListTable from '@views/apps/user/list/VendorListTable'

// Server Actions
import { getVendors } from '@/actions/vendor-actions'

const VendorListPage = async () => {
  // Fetch vendors with pagination (max 15 per page)
  // LIMIT: Protects DB from loading all vendors at once
  const { vendors } = await getVendors(1, 15)

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <VendorListTable vendorData={vendors} />
      </Grid>
    </Grid>
  )
}

export default VendorListPage
