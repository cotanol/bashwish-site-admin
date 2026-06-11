// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'

const verticalMenuData = (): VerticalMenuDataType[] => [
  // Dashboard Principal - Admin ve su dashboard, Vendor ve su dashboard
  {
    label: 'Dashboard',
    icon: 'tabler-smart-home',
    href: '/admin/dashboard',
    roles: ['admin']
  },
  {
    label: 'Dashboard',
    icon: 'tabler-smart-home',
    href: '/vendor/dashboard',
    roles: ['vendor']
  },

  // Sección de gestión - SOLO ADMIN
  {
    label: 'Management',
    isSection: true,
    roles: ['admin'],
    children: [
      // Venues Management
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
            label: 'Categories & Themes',
            icon: 'tabler-category',
            href: '/admin/venues/category'
          }
        ]
      },

      // Services Management
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
            label: 'Add New Service',
            icon: 'tabler-plus',
            href: '/admin/services/add'
          }
        ]
      },

      // Vendors Management
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
            label: 'Applications',
            icon: 'tabler-file-check',
            href: '/admin/vendors/claims'
          }
        ]
      },

      // Reviews Management
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

      // Newsletter Subscribers
      {
        label: 'Newsletter',
        icon: 'tabler-mail',
        href: '/admin/customers/newsletter'
      }
    ]
  },

  // Sección My Venues - SOLO VENDOR
  {
    label: 'My Business',
    isSection: true,
    roles: ['vendor'],
    children: [
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
      }
    ]
  },

  // Settings - COMPARTIDO (admin y vendor)
  {
    label: 'Settings',
    isSection: true,
    children: [
      {
        label: 'Account Settings',
        icon: 'tabler-user-cog',
        href: '/pages/account-settings'
      }
    ]
  }
]

export default verticalMenuData
