import ServiceForm from '@/views/admin/services/ServiceForm'
import Grid from '@mui/material/Grid2'

const AddServicePage = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <ServiceForm mode='create' />
      </Grid>
    </Grid>
  )
}

export default AddServicePage
