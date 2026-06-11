'use client'

// React Imports
import { useState } from 'react'
import { signOut } from 'next-auth/react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'

// Component Imports
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'

// Actions
import { deactivateAccount } from '@/actions/account-actions'

const AccountDelete = () => {
  // States
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Hooks
  const {
    control,
    watch,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues: { checkbox: false } })

  // Vars
  const checkboxValue = watch('checkbox')

  const onSubmit = () => {
    setOpen(true)
  }

  const handleConfirmDelete = async () => {
    setLoading(true)
    setMessage(null)

    const result = await deactivateAccount()

    setLoading(false)

    if (result.success) {
      setMessage({ type: 'success', text: 'Account deactivated. You will be logged out...' })

      // Sign out after 2 seconds
      setTimeout(() => {
        signOut({ callbackUrl: '/login' })
      }, 2000)
    } else {
      setMessage({ type: 'error', text: result.message })
    }

    setOpen(false)
  }

  return (
    <Card>
      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)} className='mbe-4'>
          {message.text}
        </Alert>
      )}
      <CardHeader title='Delete Account' />
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormControl error={Boolean(errors.checkbox)} className='is-full mbe-6'>
            <Controller
              name='checkbox'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <FormControlLabel control={<Checkbox {...field} />} label='I confirm my account deactivation' />
              )}
            />
            {errors.checkbox && <FormHelperText error>Please confirm you want to delete account</FormHelperText>}
          </FormControl>
          <Button
            variant='contained'
            color='error'
            type='submit'
            disabled={!checkboxValue || loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Deactivating...' : 'Deactivate Account'}
          </Button>
          <ConfirmationDialog open={open} setOpen={setOpen} type='delete-account' onConfirm={handleConfirmDelete} />
        </form>
      </CardContent>
    </Card>
  )
}

export default AccountDelete
