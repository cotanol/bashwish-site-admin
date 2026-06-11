// Next Imports
import type { Metadata } from 'next'

// Component Imports
import NewsletterSubscriptionsTable from '@/views/apps/newsletter/NewsletterSubscriptionsTable'

// Server Action Imports
import { getAllNewsletterSubscriptions } from '@/actions/newsletter-actions'

export const metadata: Metadata = {
  title: 'Newsletter Subscriptions - Admin Dashboard',
  description: 'Manage and view all newsletter subscriptions from the homepage'
}

const NewsletterPage = async () => {
  try {
    const result = await getAllNewsletterSubscriptions()
    const subscriptions = result.success && result.data ? result.data : []

    return <NewsletterSubscriptionsTable subscriptions={subscriptions} />
  } catch (error) {
    console.error('Error loading newsletter subscriptions:', error)
    return <NewsletterSubscriptionsTable subscriptions={[]} />
  }
}

export default NewsletterPage
