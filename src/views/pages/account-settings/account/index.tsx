// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import AccountDetails from './AccountDetails'
import AccountDelete from './AccountDelete'

type Props = {
  user: any
  vendor?: any
}

const Account = ({ user, vendor }: Props) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <AccountDetails user={user} vendor={vendor} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <AccountDelete />
      </Grid>
    </Grid>
  )
}

export default Account
