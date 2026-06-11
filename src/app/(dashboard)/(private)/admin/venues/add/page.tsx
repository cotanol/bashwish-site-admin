// Next Imports
import { redirect } from 'next/navigation'

/**
 * Admin should NOT create venues.
 * Venues are created by vendors only.
 * Redirect to the venues list page.
 */
const AdminVenueAddPage = () => {
  redirect('/admin/venues/list')
}

export default AdminVenueAddPage
