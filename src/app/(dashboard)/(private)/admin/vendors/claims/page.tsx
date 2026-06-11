// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import VendorApplicationsTable from '@views/apps/invoice/list/VendorApplicationsTable'

// Server Actions
import { getVendorApplications } from '@/actions/vendor-actions'

const VendorApplicationsPage = async () => {
  // Fetch vendor applications
  const applications = await getVendorApplications()

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <VendorApplicationsTable applicationData={applications} />
      </Grid>
    </Grid>
  )
}

export default VendorApplicationsPage
