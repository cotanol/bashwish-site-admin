'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'

import type { SerializedServiceWithFullRelations } from '@/actions/service-actions'
import ServiceForm from './ServiceForm'
import ServicePackageManager from './ServicePackageManager'
import ServiceGalleryManager from './ServiceGalleryManager'
import ServiceReviewManager from './ServiceReviewManager'

interface Props {
  serviceData: SerializedServiceWithFullRelations
}

const ServiceEditTabs = ({ serviceData }: Props) => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('details')

  return (
    <Card>
      <CardHeader
        title={serviceData.name}
        subheader={`Service ID: ${serviceData.id}`}
        action={
          <Button variant='tonal' onClick={() => router.push('/admin/services/list')}>
            Back to List
          </Button>
        }
      />
      <TabContext value={activeTab}>
        <TabList onChange={(_, value) => setActiveTab(value)} aria-label='service tabs'>
          <Tab value='details' label='Details' icon={<i className='tabler-info-circle' />} iconPosition='start' />
          <Tab value='packages' label='Packages' icon={<i className='tabler-package' />} iconPosition='start' />
          <Tab value='gallery' label='Gallery' icon={<i className='tabler-photo' />} iconPosition='start' />
          <Tab value='reviews' label='Reviews' icon={<i className='tabler-star' />} iconPosition='start' />
        </TabList>

        <TabPanel value='details'>
          <ServiceForm serviceData={serviceData} mode='edit' />
        </TabPanel>

        <TabPanel value='packages'>
          <ServicePackageManager
            serviceId={serviceData.id}
            serviceName={serviceData.name}
            packages={serviceData.packages}
          />
        </TabPanel>

        <TabPanel value='gallery'>
          <ServiceGalleryManager
            serviceId={serviceData.id}
            serviceName={serviceData.name}
            images={serviceData.images}
          />
        </TabPanel>

        <TabPanel value='reviews'>
          <ServiceReviewManager
            serviceId={serviceData.id}
            serviceName={serviceData.name}
            reviews={serviceData.reviews}
          />
        </TabPanel>
      </TabContext>
    </Card>
  )
}

export default ServiceEditTabs
