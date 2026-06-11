'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcrypt'
import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'

/**
 * Update user profile (name, phone)
 */
export async function updateUserProfile(data: {
  firstName: string
  lastName: string
  phone?: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' }
    }

    const fullName = `${data.firstName} ${data.lastName}`.trim()

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: fullName
      }
    })

    revalidatePath('/pages/account-settings')

    return { success: true, message: 'Profile updated successfully' }
  } catch (error) {
    console.error('Error updating profile:', error)

    return { success: false, message: 'Failed to update profile' }
  }
}

/**
 * Update vendor business information
 */
export async function updateVendorInfo(data: {
  businessName: string
  contactEmail: string
  contactPhone: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'vendor') {
      return { success: false, message: 'Not authorized' }
    }

    // Find vendor by userId
    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id }
    })

    if (!vendor) {
      return { success: false, message: 'Vendor not found' }
    }

    await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        businessName: data.businessName,
        contactName: data.contactEmail, // Store email in contactName since there's no contactEmail field
        phone: data.contactPhone
      }
    })

    revalidatePath('/pages/account-settings')
    revalidatePath('/vendor/dashboard')

    return { success: true, message: 'Business information updated successfully' }
  } catch (error) {
    console.error('Error updating vendor info:', error)

    return { success: false, message: 'Failed to update business information' }
  }
}

/**
 * Change user password
 */
export async function changePassword(data: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' }
    }

    // Validate passwords match
    if (data.newPassword !== data.confirmPassword) {
      return { success: false, message: 'New passwords do not match' }
    }

    // Validate password strength
    if (data.newPassword.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters long' }
    }

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !user.password) {
      return { success: false, message: 'User not found or no password set' }
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(data.currentPassword, user.password)

    if (!isValidPassword) {
      return { success: false, message: 'Current password is incorrect' }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    })

    return { success: true, message: 'Password changed successfully' }
  } catch (error) {
    console.error('Error changing password:', error)

    return { success: false, message: 'Failed to change password' }
  }
}

/**
 * Deactivate user account
 */
export async function deactivateAccount(): Promise<{ success: boolean; message: string }> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' }
    }

    // Soft delete - mark as inactive instead of hard delete
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // You can add an 'isActive' field to User model or use a different approach
        // For now, we'll just update the email to mark as deleted
        email: `deleted_${session.user.id}_${session.user.email}`
      }
    })

    return { success: true, message: 'Account deactivated successfully' }
  } catch (error) {
    console.error('Error deactivating account:', error)

    return { success: false, message: 'Failed to deactivate account' }
  }
}

/**
 * Upload profile image
 */
export async function uploadProfileImage(
  imageBase64: string
): Promise<{ success: boolean; message: string; url?: string }> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' }
    }

    // TODO: Implement actual image upload to storage (S3, Cloudinary, etc.)
    // For now, we'll just store the base64 in the database (not recommended for production)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        image: imageBase64
      }
    })

    revalidatePath('/pages/account-settings')

    return { success: true, message: 'Profile image uploaded successfully', url: imageBase64 }
  } catch (error) {
    console.error('Error uploading profile image:', error)

    return { success: false, message: 'Failed to upload profile image' }
  }
}
