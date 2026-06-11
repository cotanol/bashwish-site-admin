// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'

// Third Party Imports
import classnames from 'classnames'
import type { ApexOptions } from 'apexcharts'

// Types Imports
import type { ThemeColor } from '@core/types'

// Components Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

type DataType = {
  stats: string
  title: string
  progress: number
  avatarIcon: string
  avatarColor?: ThemeColor
  progressColor?: ThemeColor
}

type Props = {
  data: {
    chartData: {
      searchesByDay: Array<{ day: string; searches: number; clicks: number }>
    }
    overview: {
      totalSearches: number
      totalClicks: number
      totalEmailCaptures: number
      conversions: number
      weeklyGrowth: number
    }
  }
}

const EarningReports = ({ data }: Props) => {
  // Generate series from real data
  const series = [{ data: data.chartData.searchesByDay.map(d => d.searches) }]

  // Calculate metrics
  const thisWeekSearches = data.chartData.searchesByDay.reduce((sum, d) => sum + d.searches, 0)
  const thisWeekClicks = data.chartData.searchesByDay.reduce((sum, d) => sum + d.clicks, 0)

  // Calculate progress percentages
  const searchProgress = data.overview.totalSearches > 0 ? (thisWeekSearches / data.overview.totalSearches) * 100 : 0
  const clickProgress = data.overview.totalClicks > 0 ? (thisWeekClicks / data.overview.totalClicks) * 100 : 0

  const conversionProgress =
    data.overview.totalSearches > 0 ? (data.overview.conversions / data.overview.totalSearches) * 100 : 0

  // Generate dynamic data
  const metricsData: DataType[] = [
    {
      title: 'Searches',
      progress: Math.min(searchProgress, 100),
      stats: thisWeekSearches.toString(),
      progressColor: 'primary',
      avatarColor: 'primary',
      avatarIcon: 'tabler-search'
    },
    {
      title: 'Clicks',
      progress: Math.min(clickProgress, 100),
      stats: thisWeekClicks.toString(),
      progressColor: 'info',
      avatarColor: 'info',
      avatarIcon: 'tabler-click'
    },
    {
      title: 'Conversions',
      progress: Math.min(conversionProgress, 100),
      stats: data.overview.conversions.toString(),
      progressColor: 'success',
      avatarColor: 'success',
      avatarIcon: 'tabler-checks'
    }
  ]

  // Vars
  const primaryColorWithOpacity = 'var(--mui-palette-primary-lightOpacity)'

  const options: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    tooltip: { enabled: false },
    grid: {
      show: false,
      padding: {
        top: -31,
        left: 0,
        right: 0,
        bottom: -9
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        distributed: true,
        columnWidth: '42%'
      }
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: [
      primaryColorWithOpacity,
      primaryColorWithOpacity,
      primaryColorWithOpacity,
      primaryColorWithOpacity,
      'var(--mui-palette-primary-main)',
      primaryColorWithOpacity,
      primaryColorWithOpacity
    ],
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    xaxis: {
      categories: data.chartData.searchesByDay.map(d => d.day.slice(0, 2)),
      axisTicks: { show: false },
      axisBorder: { show: false },
      labels: {
        style: {
          fontSize: '13px',
          colors: 'var(--mui-palette-text-disabled)'
        }
      }
    },
    yaxis: { show: false }
  }

  return (
    <Card>
      <CardHeader
        title='Performance Reports'
        subheader='Weekly Performance Overview'
        action={<OptionMenu options={['Last Week', 'Last Month', 'Last Year']} />}
        className='pbe-0'
      />
      <CardContent className='flex flex-col gap-5 max-md:gap-5 max-[1015px]:gap-[62px] max-[1051px]:gap-10 max-[1200px]:gap-5 max-[1310px]:gap-10'>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-8'>
          <div className='flex flex-col gap-3 is-full sm:is-[unset]'>
            <div className='flex items-center gap-2.5'>
              <Typography variant='h2'>{thisWeekSearches}</Typography>
              <Chip
                size='small'
                variant='tonal'
                color={data.overview.weeklyGrowth >= 0 ? 'success' : 'error'}
                label={`${data.overview.weeklyGrowth >= 0 ? '+' : ''}${data.overview.weeklyGrowth.toFixed(1)}%`}
              />
            </div>
            <Typography variant='body2' className='text-balance'>
              Searches this week compared to last week
            </Typography>
          </div>
          <AppReactApexCharts type='bar' height={163} width='100%' series={series} options={options} />
        </div>
        <div className='flex flex-col sm:flex-row gap-6 p-5 border rounded'>
          {metricsData.map((item, index) => (
            <div key={index} className='flex flex-col gap-2 is-full'>
              <div className='flex items-center gap-2'>
                <CustomAvatar skin='light' variant='rounded' color={item.avatarColor} size={26}>
                  <i className={classnames(item.avatarIcon, 'text-lg')} />
                </CustomAvatar>
                <Typography variant='h6' className='leading-6 font-normal'>
                  {item.title}
                </Typography>
              </div>
              <Typography variant='h4'>{item.stats}</Typography>
              <LinearProgress
                value={item.progress}
                variant='determinate'
                color={item.progressColor}
                className='max-bs-1'
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default EarningReports
