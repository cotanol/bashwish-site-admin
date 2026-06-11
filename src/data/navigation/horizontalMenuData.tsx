// Type Imports
import type { HorizontalMenuDataType } from '@/types/menuTypes'

const horizontalMenuData = (): HorizontalMenuDataType[] => [
  // Dashboard - Different for Admin and Vendor
  {
    label: 'Dashboard',
    icon: 'tabler-smart-home',
    href: '/admin/dashboard'
  },

  // Venues Management - SOLO ADMIN
  {
    label: 'Venues',
    icon: 'tabler-home-star',
    children: [
      {
        label: 'All Venues',
        icon: 'tabler-list',
        href: '/admin/venues/list'
      },
      {
        label: 'Add Venue',
        icon: 'tabler-plus',
        href: '/admin/venues/add'
      },
      {
        label: 'Categories & Themes',
        icon: 'tabler-category',
        href: '/admin/venues/category'
      }
    ]
  },

  // Services Management - SOLO ADMIN
  {
    label: 'Services',
    icon: 'tabler-briefcase',
    children: [
      {
        label: 'All Services',
        icon: 'tabler-list',
        href: '/admin/services/list'
      },
      {
        label: 'Add Service',
        icon: 'tabler-plus',
        href: '/admin/services/add'
      }
    ]
  },

  // Customers - SOLO ADMIN
  {
    label: 'Customers',
    icon: 'tabler-users',
    children: [
      {
        label: 'Email Captures',
        icon: 'tabler-mail',
        href: '/admin/customers/emails/inbox'
      }
    ]
  },

  // Vendors - SOLO ADMIN
  {
    label: 'Vendors',
    icon: 'tabler-building-store',
    children: [
      {
        label: 'All Vendors',
        icon: 'tabler-list',
        href: '/admin/vendors/list'
      },
      {
        label: 'Claim Requests',
        icon: 'tabler-flag',
        href: '/admin/vendors/claims'
      }
    ]
  },

  // Reviews - SOLO ADMIN
  {
    label: 'Reviews',
    icon: 'tabler-star',
    children: [
      {
        label: 'All Reviews',
        icon: 'tabler-list',
        href: '/admin/reviews'
      },
      {
        label: 'Pending Reviews',
        icon: 'tabler-clock',
        href: '/admin/reviews/pending'
      }
    ]
  },

  // Newsletter - SOLO ADMIN
  {
    label: 'Newsletter',
    icon: 'tabler-mail',
    href: '/admin/customers/newsletter'
  },

  // My Venues - SOLO VENDOR
  {
    label: 'My Venues',
    icon: 'tabler-building-store',
    children: [
      {
        label: 'All Venues',
        icon: 'tabler-list',
        href: '/vendor/venues'
      },
      {
        label: 'Add New Venue',
        icon: 'tabler-plus',
        href: '/vendor/venues/create'
      }
    ]
  },

  // Settings - COMPARTIDO
  {
    label: 'Settings',
    icon: 'tabler-settings',
    children: [
      {
        label: 'Account Settings',
        icon: 'tabler-user-cog',
        href: '/pages/account-settings'
      }
    ]
  }
]

export default horizontalMenuData
