import Grid from '@mui/material/Grid2'
import { getServices } from '@/actions/service-actions'
import { serializeServices } from '@/utils/serializers'
import ServiceListTable from '@/views/admin/services/ServiceListTable'

const ServicesListPage = async () => {
  // Fetch all services (admin can see all)
  // LIMIT: Max 15 services per page to avoid DB collapse in production
  const { services } = await getServices({}, 1, 15)

  // Serialize services to plain objects (convert Decimal to number)
  const serializedServices = serializeServices(services)

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <ServiceListTable serviceData={serializedServices} />
      </Grid>
    </Grid>
  )
}

export default ServicesListPage
