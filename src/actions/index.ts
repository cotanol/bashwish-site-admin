/**
 * Centralized exports for all server actions
 * Import from here for cleaner imports
 *
 * @example
 * import { getVenues, createVenue } from '@/actions'
 */

// Venue Actions
export {
  getVenues,
  getFeaturedVenues,
  getVenueById,
  getVenueBySlug,
  createVenue,
  updateVenue,
  toggleVenueFeatured,
  toggleVenueActive,
  softDeleteVenue,
  deleteVenue,
  bulkUpdateVenues,
  bulkSoftDeleteVenues,
  getVenuesWithOffers,
  updateVenueOffer,
  removeVenueOffer,
  setFeaturedUntil,
  checkAndUpdateExpiredFeatured,
  getAdminAnalytics,
  getEcommerceData,
  adminBlockVenue,
  adminUnblockVenue
} from './venue-actions'

export type {
  VenueWithRelations,
  VenueFilters,
  CreateVenueInput,
  UpdateVenueInput,
  AdminAnalyticsData
} from './venue-actions'

// Venue Image Actions
export {
  getVenueImages,
  addVenueImage,
  updateVenueImage,
  deleteVenueImage,
  reorderVenueImages,
  setPrimaryImage
} from './venue-image-actions'

// Venue Package Actions
export {
  getVenuePackages,
  getVendorPackages,
  getPackageById,
  createVenuePackage,
  updateVenuePackage,
  deleteVenuePackage,
  searchVenues,
  getAllThemes,
  createPackageTheme
} from './venue-package-actions'

export type { VenuePackageWithRelations, SearchFilters } from './venue-package-actions'

// Theme Actions
export {
  getThemes,
  getThemeById,
  getThemeBySlug,
  createTheme,
  updateTheme,
  deleteTheme,
  getPopularThemes
} from './theme-actions'

export type { ThemeWithPackages } from './theme-actions'

// Vendor Actions
export {
  getVendors,
  getVendorById,
  getVendorByUserId,
  getVendorVenues,
  updateVendor,
  toggleVendorVerification,
  deleteVendor,
  getVendorApplications,
  getVendorApplicationById,
  createVendorApplication,
  approveVendorApplication,
  rejectVendorApplication,
  resetVendorPassword,
  vendorSubmitVenueForReview,
  vendorToggleVenueActive,
  adminPublishVenue,
  adminSuspendVenue,
  adminRestoreVenue
} from './vendor-actions'

export type { VendorWithRelations, ApplicationWithVendor } from './vendor-actions'

// Discount Actions
export { getDiscountCodes, getDiscountCodeStats, trackDiscountUsage } from './discount-actions'

export type { DiscountCodeData, DiscountCodeStats, TopDiscountCode } from './discount-actions'

// Newsletter Actions
export {
  createNewsletterSubscription,
  getAllNewsletterSubscriptions,
  deleteNewsletterSubscription
} from './newsletter-actions'
