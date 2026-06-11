// React Imports
import type { ReactElement } from 'react'

// Next Imports
import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

// Component Imports
import AccountSettings from '@views/pages/account-settings'
import { authOptions } from '@/libs/auth'
import { getVendorByUserId } from '@/actions/vendor-actions'

const AccountTab = dynamic(() => import('@views/pages/account-settings/account'))
const SecurityTab = dynamic(() => import('@views/pages/account-settings/security'))

const AccountSettingsPage = async () => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  // Get vendor data if user is a vendor
  let vendorData = null
  if (session.user.role === 'vendor') {
    vendorData = await getVendorByUserId(session.user.id)
  }

  // Vars
  const tabContentList = (): { [key: string]: ReactElement } => ({
    account: <AccountTab user={session.user} vendor={vendorData} />,
    security: <SecurityTab />
  })

  return <AccountSettings tabContentList={tabContentList()} />
}

export default AccountSettingsPage
