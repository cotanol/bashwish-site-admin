'use client'

// MUI Imports
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import MuiLinearProgress from '@mui/material/LinearProgress'
import { styled } from '@mui/material/styles'

// Custom Components Imports
import CustomAvatar from '@core/components/mui/Avatar'

type Props = {
  data: {
    overview: {
      totalSearches: number
      totalClicks: number
      conversions: number
      totalRevenue: number
      weeklyGrowth: number
    }
  }
}

const LinearProgress = styled(MuiLinearProgress)(() => ({
  '&.MuiLinearProgress-colorInfo': { backgroundColor: 'var(--mui-palette-primary-main)' },
  '& .MuiLinearProgress-bar': {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0
  }
}))

const SalesOverview = ({ data }: Props) => {
  const { totalSearches, totalClicks, conversions, totalRevenue, weeklyGrowth } = data.overview

  // Calculate percentages
  const searchPercentage = totalSearches > 0 ? ((totalClicks / totalSearches) * 100).toFixed(1) : '0'
  const clickPercentage = totalClicks > 0 ? ((conversions / totalClicks) * 100).toFixed(1) : '0'
  const progressValue = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0

  // Format revenue
  const formattedRevenue =
    totalRevenue >= 1000 ? `$${(totalRevenue / 1000).toFixed(1)}k` : `$${totalRevenue.toFixed(0)}`

  return (
    <Card>
      <CardContent>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <Typography>Venue Performance</Typography>
            <Typography variant='h4'>{formattedRevenue}</Typography>
          </div>
          <Typography color={weeklyGrowth >= 0 ? 'success.main' : 'error.main'} className='font-medium'>
            {weeklyGrowth >= 0 ? '+' : ''}
            {weeklyGrowth.toFixed(1)}%
          </Typography>
        </div>
        <div className='flex items-center justify-between mlb-[1.4375rem]'>
          <div className='flex flex-col plb-2.25'>
            <div className='flex items-center mbe-2.5 gap-x-[6px]'>
              <CustomAvatar skin='light' color='info' variant='rounded' size={24}>
                <i className='tabler-shopping-cart text-lg' />
              </CustomAvatar>
              <Typography>Searches</Typography>
            </div>
            <Typography variant='h5'>{searchPercentage}%</Typography>
            <Typography variant='body2' color='text.disabled'>
              {totalSearches.toLocaleString()}
            </Typography>
          </div>
          <Divider flexItem orientation='vertical'>
            <CustomAvatar skin='light' size={24} className='text-xs text-textDisabled bg-actionHover'>
              VS
            </CustomAvatar>
          </Divider>
          <div className='flex items-end flex-col plb-2'>
            <div className='flex items-center mbe-2 gap-x-[6px]'>
              <Typography color='text.secondary' className='m'>
                Clicks
              </Typography>
              <CustomAvatar skin='light' variant='rounded' color='primary' size={24}>
                <i className='tabler-link text-lg' />
              </CustomAvatar>
            </div>
            <Typography variant='h5'>{clickPercentage}%</Typography>
            <Typography variant='body2' color='text.disabled'>
              {totalClicks.toLocaleString()}
            </Typography>
          </div>
        </div>
        <LinearProgress value={progressValue} color='info' variant='determinate' className='bs-2.5' />
      </CardContent>
    </Card>
  )
}

export default SalesOverview
