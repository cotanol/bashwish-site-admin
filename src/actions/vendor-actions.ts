'use server'

import prisma from '@/libs/prisma'
import type { Vendor, VendorApplication, Prisma, ApplicationStatus } from '@prisma/client'
import bcrypt from 'bcrypt'
import { revalidatePath } from 'next/cache'
import { sendVendorWelcomeEmail as sendWelcomeEmail } from '@/libs/email'

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a random temporary password
 */
function generateTemporaryPassword(): string {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

/**
 * Send welcome email to vendor with credentials
 */
async function sendVendorWelcomeEmail(email: string, name: string, temporaryPassword: string) {
  try {
    await sendWelcomeEmail({
      vendorName: name,
      vendorEmail: email,
      temporaryPassword
    })
  } catch (error) {
    console.error('❌ Error sending welcome email to', email, ':', error)
    // Don't throw error - we don't want to fail the approval if email fails
  }
}

// ============================================
// VENDOR MANAGEMENT
// ============================================

export type VendorWithRelations = Vendor & {
  user: {
    id: string
    name: string | null
    email: string | null
  }
  venues: {
    id: string
    name: string
    slug: string
    status: string
  }[]
}

/**
 * Get all vendors
 */
export async function getVendors(
  page = 1,
  limit = 15
): Promise<{ vendors: VendorWithRelations[]; total: number; page: number; limit: number }> {
  try {
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          venues: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.vendor.count()
    ])

    return { vendors, total, page, limit }
  } catch (error) {
    console.error('Error fetching vendors:', error)
    throw new Error('Failed to fetch vendors')
  }
}

/**
 * Get vendor by ID
 */
export async function getVendorById(id: string): Promise<VendorWithRelations | null> {
  try {
    return await prisma.vendor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        venues: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true
          }
        }
      }
    })
  } catch (error) {
    console.error('Error fetching vendor:', error)
    throw new Error('Failed to fetch vendor')
  }
}

/**
 * Get vendor by user ID
 */
export async function getVendorByUserId(userId: string): Promise<VendorWithRelations | null> {
  try {
    return await prisma.vendor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        venues: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true
          }
        }
      }
    })
  } catch (error) {
    console.error('Error fetching vendor by user ID:', error)
    throw new Error('Failed to fetch vendor')
  }
}

/**
 * Get all venues for a specific vendor by userId
 */
export async function getVendorVenues(userId: string, limit = 50) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
      include: {
        venues: {
          take: limit,
          include: {
            images: {
              where: { isPrimary: true },
              take: 1
            },
            packages: {
              select: {
                id: true,
                name: true,
                price: true
              }
            },
            _count: {
              select: {
                reviews: true,
                packages: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    return vendor.venues
  } catch (error) {
    console.error('Error fetching vendor venues:', error)
    throw new Error('Failed to fetch vendor venues')
  }
}

/**
 * Update vendor
 */
export async function updateVendor(
  id: string,
  data: {
    contactName?: string
    businessName?: string
    phone?: string
    isVerified?: boolean
  }
): Promise<Vendor> {
  try {
    return await prisma.vendor.update({
      where: { id },
      data
    })
  } catch (error) {
    console.error('Error updating vendor:', error)
    throw new Error('Failed to update vendor')
  }
}

/**
 * Toggle vendor verification
 */
export async function toggleVendorVerification(id: string): Promise<Vendor> {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      select: { isVerified: true }
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    return await prisma.vendor.update({
      where: { id },
      data: {
        isVerified: !vendor.isVerified
      }
    })
  } catch (error) {
    console.error('Error toggling vendor verification:', error)
    throw new Error('Failed to toggle vendor verification')
  }
}

// ============================================
// VENDOR APPLICATIONS (New Simplified Flow)
// ============================================

export type ApplicationWithVendor = VendorApplication & {
  vendor?: {
    id: string
    contactName: string
    user: {
      email: string | null
    }
  } | null
}

/**
 * Get all vendor applications
 */
export async function getVendorApplications(status?: ApplicationStatus): Promise<ApplicationWithVendor[]> {
  try {
    const where: Prisma.VendorApplicationWhereInput = {}

    if (status) {
      where.status = status
    }

    return await prisma.vendorApplication.findMany({
      where,
      include: {
        vendor: {
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error('Error fetching applications:', error)
    throw new Error('Failed to fetch applications')
  }
}

/**
 * Get application by ID
 */
export async function getVendorApplicationById(id: string): Promise<ApplicationWithVendor | null> {
  try {
    return await prisma.vendorApplication.findUnique({
      where: { id },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    })
  } catch (error) {
    console.error('Error fetching application:', error)
    throw new Error('Failed to fetch application')
  }
}

/**
 * Create vendor application (public form)
 */
export async function createVendorApplication(data: {
  contactName: string
  contactEmail: string
  contactPhone?: string
  businessName?: string
  website?: string
}): Promise<VendorApplication> {
  try {
    const application = await prisma.vendorApplication.create({
      data
    })

    return application
  } catch (error) {
    console.error('❌ Error creating vendor application:', error)

    // More detailed Prisma error logging
    if (error && typeof error === 'object' && 'code' in error) {
      // P2002: Unique constraint violation
      if ((error as any).code === 'P2002') {
        const target = (error as any).meta?.target
        if (target && target.includes('contactEmail')) {
          throw new Error('DUPLICATE_EMAIL')
        }
      }
    }

    throw new Error('Failed to create application')
  }
}

/**
 * Approve application with retroactive email linking
 * This is the MAGIC function described in the flow
 */
export async function approveVendorApplication(
  id: string
): Promise<{ vendor: Vendor; temporaryPassword?: string; isNewUser: boolean }> {
  try {
    // Fetch the application
    const application = await prisma.vendorApplication.findUnique({
      where: { id }
    })

    if (!application) {
      throw new Error('Application not found')
    }

    if (application.status !== 'pending') {
      throw new Error(`Application is not pending. Current status: ${application.status}`)
    }

    const email = application.contactEmail

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email }
    })

    let temporaryPassword: string | null = null
    const isNewUser = !user

    // Step A: Create User if needed
    if (!user) {
      temporaryPassword = generateTemporaryPassword()
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10)

      user = await prisma.user.create({
        data: {
          email,
          name: application.contactName,
          role: 'vendor',
          password: hashedPassword
        }
      })
    }

    // Step B & C: Create Vendor and link ALL applications with this email
    const vendor = await prisma.$transaction(async tx => {
      // Create the Vendor
      const newVendor = await tx.vendor.create({
        data: {
          userId: user!.id,
          contactName: application.contactName,
          businessName: application.businessName,
          phone: application.contactPhone,
          isVerified: true
        }
      })

      // Step B: Update the CURRENT application (the one being approved)
      await tx.vendorApplication.update({
        where: { id },
        data: {
          status: 'approved',
          reviewedBy: 'admin',
          reviewedAt: new Date(),
          vendorId: newVendor.id
        }
      })

      // Step C: RETROACTIVE UPDATE - Link ALL other applications with same email
      await tx.vendorApplication.updateMany({
        where: {
          contactEmail: email,
          vendorId: null, // Only update unlinked applications
          id: { not: id } // Don't update the current one again
        },
        data: {
          vendorId: newVendor.id
        }
      })

      return newVendor
    })

    // Send welcome email if new user
    if (temporaryPassword) {
      await sendVendorWelcomeEmail(email, application.contactName, temporaryPassword)
    }

    return {
      vendor,
      temporaryPassword: temporaryPassword || undefined,
      isNewUser
    }
  } catch (error) {
    console.error('❌ Error approving application:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to approve application')
  }
}

/**
 * Reject application
 */
export async function rejectVendorApplication(id: string, reason?: string): Promise<VendorApplication> {
  try {
    const application = await prisma.vendorApplication.findUnique({
      where: { id }
    })

    if (!application) {
      throw new Error('Application not found')
    }

    if (application.status !== 'pending') {
      throw new Error('Application is not pending')
    }

    return await prisma.vendorApplication.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewedBy: 'admin',
        reviewedAt: new Date(),
        rejectionReason: reason
      }
    })
  } catch (error) {
    console.error('Error rejecting application:', error)
    throw new Error('Failed to reject application')
  }
}

/**
 * Soft delete vendor (toggle active/inactive) - admin only
 * Marca el vendor como eliminado pero mantiene los datos
 */
export async function deleteVendor(id: string): Promise<{ success: boolean; isActive: boolean }> {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      select: { deletedAt: true }
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    // Toggle soft delete: si está eliminado (deletedAt !== null), lo restauramos; si no, lo eliminamos
    const isCurrentlyDeleted = vendor.deletedAt !== null
    const newDeletedAt = isCurrentlyDeleted ? null : new Date()

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: { deletedAt: newDeletedAt }
    })

    revalidatePath('/admin/vendors/list')

    return { success: true, isActive: updatedVendor.deletedAt === null }
  } catch (error) {
    console.error('❌ [DELETE-VENDOR] Error toggling vendor active status:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to toggle vendor status')
  }
}

/**
 * Reset vendor password (admin only)
 * Returns the new temporary password
 */
export async function resetVendorPassword(vendorId: string): Promise<string> {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    // Generate new temporary password
    const temporaryPassword = generateTemporaryPassword()
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10)

    // Update user password
    await prisma.user.update({
      where: { id: vendor.userId },
      data: {
        password: hashedPassword
      }
    })

    // Log credentials (in production, send email)
    console.log('=== VENDOR PASSWORD RESET ===')
    console.log('Vendor ID:', vendorId)
    console.log('Email:', vendor.user.email)
    console.log('Name:', vendor.user.name)
    console.log('New Temporary Password:', temporaryPassword)
    console.log('============================')

    return temporaryPassword
  } catch (error) {
    console.error('Error resetting vendor password:', error)
    throw new Error('Failed to reset vendor password')
  }
}

// ============================================
// VENUE STATUS CONTROL (New Simplified Flow)
// ============================================

/**
 * VENDOR: Change venue status (draft -> pending_review)
 * Vendor submits venue for admin approval
 */
export async function vendorSubmitVenueForReview(
  venueId: string,
  userId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Verify vendor owns this venue
    const vendor = await prisma.vendor.findFirst({
      where: {
        userId,
        venues: {
          some: { id: venueId }
        }
      }
    })

    if (!vendor) {
      return { success: false, error: 'Unauthorized: You do not own this venue' }
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId }
    })

    if (!venue) {
      return { success: false, error: 'Venue not found' }
    }

    if (venue.status !== 'draft') {
      return { success: false, error: 'Venue is not in draft status' }
    }

    await prisma.venue.update({
      where: { id: venueId },
      data: {
        status: 'pending_review'
      }
    })

    revalidatePath('/vendor/venues')

    return { success: true, message: '✅ Your venue has been submitted for review!' }
  } catch (error) {
    console.error('Error submitting venue:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to submit venue' }
  }
}

/**
 * VENDOR: Toggle venue active/inactive (only for published venues)
 * This allows vendors to temporarily hide their published venues without admin approval
 */
export async function vendorToggleVenueActive(
  venueId: string,
  userId: string
): Promise<{ venue: { id: string; isActive: boolean }; message: string }> {
  'use server'

  try {
    // Verify vendor owns this venue
    const vendor = await prisma.vendor.findFirst({
      where: {
        userId,
        venues: {
          some: { id: venueId }
        }
      }
    })

    if (!vendor) {
      throw new Error('Unauthorized: You do not own this venue')
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId }
    })

    if (!venue) {
      throw new Error('Venue not found')
    }

    // Vendors can only toggle between published and suspended
    // They cannot publish a draft or pending_review venue
    if (venue.status === 'draft' || venue.status === 'pending_review') {
      throw new Error('Cannot activate/deactivate a venue that is not published yet')
    }

    // Toggle the status
    const newStatus = venue.status === 'published' ? 'suspended' : 'published'
    const isActive = newStatus === 'published'

    const updatedVenue = await prisma.venue.update({
      where: { id: venueId },
      data: {
        status: newStatus
      }
    })

    revalidatePath('/vendor/venues')

    return {
      venue: {
        id: updatedVenue.id,
        isActive
      },
      message: isActive ? '✅ Venue activated and visible to public!' : '⏸️ Venue deactivated and hidden from public'
    }
  } catch (error) {
    console.error('Error toggling venue active:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to toggle venue status')
  }
}

/**
 * ADMIN: Publish venue (pending_review -> published)
 */
export async function adminPublishVenue(venueId: string): Promise<{ message: string }> {
  try {
    const venue = await prisma.venue.findUnique({
      where: { id: venueId }
    })

    if (!venue) {
      throw new Error('Venue not found')
    }

    await prisma.venue.update({
      where: { id: venueId },
      data: {
        status: 'published'
      }
    })

    revalidatePath('/admin/venues/list')
    revalidatePath('/api/public/venues')

    return { message: '✅ Venue published and now visible to public!' }
  } catch (error) {
    console.error('Error publishing venue:', error)
    throw new Error('Failed to publish venue')
  }
}

/**
 * ADMIN: Suspend venue (published -> suspended)
 */
export async function adminSuspendVenue(venueId: string): Promise<{ message: string }> {
  try {
    await prisma.venue.update({
      where: { id: venueId },
      data: {
        status: 'suspended'
      }
    })

    revalidatePath('/admin/venues/list')
    revalidatePath('/api/public/venues')

    return { message: '⏸️ Venue suspended and no longer visible to public' }
  } catch (error) {
    console.error('Error suspending venue:', error)
    throw new Error('Failed to suspend venue')
  }
}

/**
 * ADMIN: Restore venue (suspended -> published)
 */
export async function adminRestoreVenue(venueId: string): Promise<{ message: string }> {
  try {
    await prisma.venue.update({
      where: { id: venueId },
      data: {
        status: 'published'
      }
    })

    revalidatePath('/admin/venues/list')
    revalidatePath('/api/public/venues')

    return { message: '✅ Venue restored and visible to public again!' }
  } catch (error) {
    console.error('Error restoring venue:', error)
    throw new Error('Failed to restore venue')
  }
}

// ============================================
// VENDOR CLAIM REQUESTS (Placeholder)
// ============================================

/**
 * NOTE: VendorClaimRequest model doesn't exist in schema yet
 * These are placeholder types and functions for ClaimRequestsTable component
 * TODO: Add VendorClaimRequest model to schema.prisma
 */

export type ClaimRequestWithVenue = {
  id: string
  contactName: string
  contactEmail: string
  contactPhone: string | null
  businessName: string | null
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  reviewedAt: Date | null
  rejectionReason: string | null
  message: string | null
  venueId: string | null
  venueName: string | null
  venueAddress: string | null
  venueCity: string | null
  venueState: string | null
  venuePostalCode: string | null
  venue: {
    id: string
    name: string
    slug: string
    city: string
  } | null
}

export type ApproveClaimRequestResult = {
  isNewUser: boolean
  temporaryPassword?: string
  vendorId: string
}

/**
 * Get all claim requests (placeholder)
 * TODO: Implement when VendorClaimRequest model exists
 */
export async function getClaimRequests(): Promise<ClaimRequestWithVenue[]> {
  console.warn('getClaimRequests called but VendorClaimRequest model does not exist yet')
  return []
}

/**
 * Approve a claim request (placeholder)
 * TODO: Implement when VendorClaimRequest model exists
 */
export async function approveClaimRequest(requestId: string): Promise<ApproveClaimRequestResult> {
  console.warn('approveClaimRequest called but VendorClaimRequest model does not exist yet')

  // Placeholder return - simulates creating a new user
  return {
    isNewUser: true,
    temporaryPassword: 'TempPass123!',
    vendorId: 'placeholder-vendor-id'
  }
}

/**
 * Reject a claim request (placeholder)
 * TODO: Implement when VendorClaimRequest model exists
 */
export async function rejectClaimRequest(requestId: string, reason?: string): Promise<void> {
  console.warn('rejectClaimRequest called but VendorClaimRequest model does not exist yet')
  throw new Error('Claim request functionality not yet implemented')
}
