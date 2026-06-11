// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'

// Components Imports
import OptionMenu from '@core/components/option-menu'

type DataType = {
  title: string
  imgSrc: string
  subtitle: string
  trendNumber: number
  trend?: 'positive' | 'negative'
}

type Props = {
  data: {
    cities: Array<{ city: string; count: number }>
    overview: {
      totalVenues: number
    }
  }
}

const SalesByCountries = ({ data }: Props) => {
  // Generate dynamic data from cities
  const citiesData: DataType[] = data.cities.map((city, index) => {
    const percentage = data.overview.totalVenues > 0 ? ((city.count / data.overview.totalVenues) * 100).toFixed(1) : '0'

    return {
      title: `${city.count} Venues`,
      subtitle: city.city,
      trendNumber: parseFloat(percentage),
      imgSrc: `/images/cards/us.png`, // All Houston, so US flag
      trend: index % 2 === 0 ? 'positive' : undefined
    }
  })

  return (
    <Card>
      <CardHeader
        title='Venues by City'
        subheader='Houston Area Distribution'
        action={<OptionMenu options={['Last Week', 'Last Month', 'Last Year']} />}
      />
      <CardContent className='flex flex-col gap-[1.0875rem]'>
        {citiesData.map((item, index) => (
          <div key={index} className='flex items-center gap-4'>
            <img src={item.imgSrc} alt={item.subtitle} width={34} />
            <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
              <div className='flex flex-col'>
                <Typography className='font-medium' color='text.primary'>
                  {item.title}
                </Typography>
                <Typography variant='body2'>{item.subtitle}</Typography>
              </div>
              <div className='flex items-center gap-1'>
                <i
                  className={classnames(
                    item.trend === 'negative' ? 'tabler-chevron-down text-error' : 'tabler-chevron-up text-success',
                    'text-xl'
                  )}
                />
                <Typography
                  variant='h6'
                  color={`${item.trend === 'negative' ? 'error' : 'success'}.main`}
                >{`${item.trendNumber}%`}</Typography>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default SalesByCountries
