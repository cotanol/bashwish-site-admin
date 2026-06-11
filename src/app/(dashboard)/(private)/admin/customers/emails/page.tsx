// Next Imports
import type { Metadata } from 'next'

// Component Imports
import EmailCaptureTable from '@/views/apps/email/EmailCaptureTable'

// Server Action Imports
import { getEmailCapturesWithRelations, getEmailCaptureStats } from '@/actions/email-actions'

export const metadata: Metadata = {
  title: 'Email Captures - Admin Dashboard',
  description: 'Manage and view all email captures from the platform'
}

const EmailCapturePage = async () => {
  const [emailCaptures, stats] = await Promise.all([getEmailCapturesWithRelations(), getEmailCaptureStats()])

  return <EmailCaptureTable emailCaptureData={emailCaptures} stats={stats} />
}

export default EmailCapturePage
