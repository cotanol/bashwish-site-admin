'use server'

import prisma from '@/libs/prisma'
import { z } from 'zod'

// Schema for email subscription
const SubscriptionSchema = z.object({
  email: z.string().email('Invalid email address')
})

// Create a new newsletter subscription
export async function createNewsletterSubscription(email: string) {
  try {
    // Validate email
    const validated = SubscriptionSchema.parse({ email })

    // Check if email already exists
    const existing = await prisma.newsletterSubscription.findUnique({
      where: { email: validated.email }
    })

    if (existing) {
      return { success: false, error: 'Email already subscribed' }
    }

    // Create subscription
    const subscription = await prisma.newsletterSubscription.create({
      data: {
        email: validated.email
      }
    })

    return { success: true, data: subscription }
  } catch (error) {
    console.error('Error creating newsletter subscription:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid email address' }
    }

    return { success: false, error: 'Failed to subscribe' }
  }
}

// Get all newsletter subscriptions (for admin)
export async function getAllNewsletterSubscriptions() {
  try {
    const subscriptions = await prisma.newsletterSubscription.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, data: subscriptions }
  } catch (error) {
    console.error('Error fetching newsletter subscriptions:', error)
    return { success: false, error: 'Failed to fetch subscriptions' }
  }
}

// Delete a newsletter subscription
export async function deleteNewsletterSubscription(id: string) {
  try {
    await prisma.newsletterSubscription.delete({
      where: { id }
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting newsletter subscription:', error)
    return { success: false, error: 'Failed to delete subscription' }
  }
}
