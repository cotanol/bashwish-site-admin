import { redirect } from 'next/navigation'
import Grid from '@mui/material/Grid2'
import { getServiceById } from '@/actions/service-actions'
import { serializeService } from '@/utils/serializers'
import ServiceEditTabs from '@/views/admin/services/ServiceEditTabs'

// Disable caching for this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
  params: Promise<{
    id: string
  }>
}

const EditServicePage = async ({ params }: Props) => {
  const { id } = await params

  // Get service data
  const service = await getServiceById(id)

  if (!service) {
    redirect('/admin/services/list')
  }

  // Serialize service to convert Decimal to number
  const serializedService = serializeService(service)

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <ServiceEditTabs serviceData={serializedService} />
      </Grid>
    </Grid>
  )
}

export default EditServicePage
