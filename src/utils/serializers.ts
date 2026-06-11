/**
 * Utility functions to serialize Prisma objects for Client Components
 * Converts Decimal and Date objects to JSON-serializable formats
 */

import type { Prisma } from '@prisma/client'

/**
 * Convert Prisma Decimal to number
 */
export function decimalToNumber(value: Prisma.Decimal | null | undefined): number | null {
  if (!value) return null
  return Number(value)
}

/**
 * Serialize a venue object to be passed to Client Components
 */
export function serializeVenue<T extends Record<string, any>>(venue: T): any {
  const result: any = {
    ...venue,
    // Convert Decimal to number safely using toNumber() method
    startingPrice: venue.startingPrice
      ? (typeof venue.startingPrice.toNumber === 'function'
          ? venue.startingPrice.toNumber()
          : Number(venue.startingPrice.toString()))
      : null,
    discountPrice: venue.discountPrice
      ? (typeof venue.discountPrice.toNumber === 'function'
          ? venue.discountPrice.toNumber()
          : Number(venue.discountPrice.toString()))
      : null,
    latitude: venue.latitude
      ? (typeof venue.latitude.toNumber === 'function'
          ? venue.latitude.toNumber()
          : Number(venue.latitude.toString()))
      : null,
    longitude: venue.longitude
      ? (typeof venue.longitude.toNumber === 'function'
          ? venue.longitude.toNumber()
          : Number(venue.longitude.toString()))
      : null
  }

  // Serialize packages if present
  if (venue.packages && Array.isArray(venue.packages)) {
    result.packages = venue.packages.map((pkg: any) => ({
      ...pkg,
      price: pkg.price
        ? (typeof pkg.price.toNumber === 'function'
            ? pkg.price.toNumber()
            : Number(pkg.price.toString()))
        : null,
      discountPrice: pkg.discountPrice
        ? (typeof pkg.discountPrice.toNumber === 'function'
            ? pkg.discountPrice.toNumber()
            : Number(pkg.discountPrice.toString()))
        : null
    }))
  }

  // Keep dates as is (they're already serialized by Next.js)
  if (venue.createdAt) {
    result.createdAt = venue.createdAt
  }
  if (venue.updatedAt) {
    result.updatedAt = venue.updatedAt
  }

  return result
}

/**
 * Serialize a package object
 */
export function serializePackage<T extends Record<string, any>>(pkg: T): any {
  return {
    ...pkg,
    price: pkg.price
      ? (typeof pkg.price.toNumber === 'function'
          ? pkg.price.toNumber()
          : Number(pkg.price.toString()))
      : null,
    discountPrice: pkg.discountPrice
      ? (typeof pkg.discountPrice.toNumber === 'function'
          ? pkg.discountPrice.toNumber()
          : Number(pkg.discountPrice.toString()))
      : null
  }
}

/**
 * Serialize an array of venues
 */
export function serializeVenues<T extends Record<string, any>>(venues: T[]): any[] {
  return venues.map(serializeVenue)
}

/**
 * Serialize an array of packages
 */
export function serializePackages<T extends Record<string, any>>(packages: T[]): any[] {
  return packages.map(serializePackage)
}

/**
 * Generic serializer for any object with Decimal fields
 */
export function serializeDecimals<T extends Record<string, any>>(obj: T, decimalFields: string[]): any {
  const result: any = { ...obj }

  for (const field of decimalFields) {
    if (result[field] && typeof result[field] === 'object' && 'toNumber' in result[field]) {
      result[field] = Number(result[field])
    }
  }

  return result
}

/**
 * Serialize a service object to be passed to Client Components
 */
export function serializeService<T extends Record<string, any>>(service: T): any {
  // Create a new object without direct spreading to avoid copying Decimal references
  const result: any = {
    id: service.id,
    name: service.name,
    slug: service.slug,
    description: service.description,
    website: service.website,
    phone: service.phone,
    address: service.address,
    city: service.city,
    state: service.state,
    postalCode: service.postalCode,
    isPublished: service.isPublished,
    isFeatured: service.isFeatured,
    specialOffer: service.specialOffer,
    // Convert Decimal to number safely
    startingPrice: service.startingPrice
      ? (typeof service.startingPrice.toNumber === 'function'
          ? service.startingPrice.toNumber()
          : Number(service.startingPrice.toString()))
      : null,
    discountPrice: service.discountPrice
      ? (typeof service.discountPrice.toNumber === 'function'
          ? service.discountPrice.toNumber()
          : Number(service.discountPrice.toString()))
      : null,
    latitude: service.latitude
      ? (typeof service.latitude.toNumber === 'function'
          ? service.latitude.toNumber()
          : Number(service.latitude.toString()))
      : null,
    longitude: service.longitude
      ? (typeof service.longitude.toNumber === 'function'
          ? service.longitude.toNumber()
          : Number(service.longitude.toString()))
      : null,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt
  }

  // Serialize packages if present
  if (service.packages && Array.isArray(service.packages)) {
    result.packages = service.packages.map((pkg: any) => {
      const serializedPkg: any = {
        id: pkg.id,
        serviceId: pkg.serviceId,
        name: pkg.name,
        description: pkg.description,
        // Convert Decimal to number safely
        price: pkg.price
          ? (typeof pkg.price.toNumber === 'function'
              ? pkg.price.toNumber()
              : Number(pkg.price.toString()))
          : null,
        discountPrice: pkg.discountPrice
          ? (typeof pkg.discountPrice.toNumber === 'function'
              ? pkg.discountPrice.toNumber()
              : Number(pkg.discountPrice.toString()))
          : null,
        minKids: pkg.minKids,
        maxKids: pkg.maxKids,
        ageMin: pkg.ageMin,
        ageMax: pkg.ageMax,
        gender_focus: pkg.gender_focus,
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt
      }

      // Include themes if present
      if (pkg.themes && Array.isArray(pkg.themes)) {
        serializedPkg.themes = pkg.themes
      }

      return serializedPkg
    })
  }

  // Serialize images if present
  if (service.images && Array.isArray(service.images)) {
    result.images = service.images.map((img: any) => ({
      id: img.id,
      serviceId: img.serviceId,
      url: img.url,
      altText: img.altText,
      isPrimary: img.isPrimary
    }))
  }

  // Serialize reviews if present
  if (service.reviews && Array.isArray(service.reviews)) {
    result.reviews = service.reviews
  }

  // Serialize _count if present
  if (service._count) {
    result._count = { ...service._count }
  }

  return result
}

/**
 * Serialize an array of services
 */
export function serializeServices<T extends Record<string, any>>(services: T[]): any[] {
  return services.map(serializeService)
}

/**
 * Serialize a service package object
 */
export function serializeServicePackage<T extends Record<string, any>>(pkg: T): any {
  return {
    ...pkg,
    price: pkg.price ? Number(pkg.price) : null,
    discountPrice: pkg.discountPrice ? Number(pkg.discountPrice) : null
  }
}

/**
 * Serialize an array of service packages
 */
export function serializeServicePackages<T extends Record<string, any>>(packages: T[]): any[] {
  return packages.map(serializeServicePackage)
}

/**
 * Type for serialized service image
 */
export type SerializedServiceImage = {
  id: string
  serviceId: string
  url: string
  altText: string | null
  isPrimary: boolean
}
