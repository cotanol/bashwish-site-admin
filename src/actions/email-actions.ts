'use server'

/**
 * Email Actions
 *
 * NOTE: EmailCapture model doesn't exist in Prisma schema yet.
 * These are placeholder actions that return empty data to allow build to pass.
 * TODO: Add EmailCapture model to schema.prisma and implement real functionality
 */

// ============================================
// TYPES
// ============================================

export type EmailCaptureWithRelations = {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  acceptsMarketing: boolean
  source: string
  createdAt: Date
  // Relations and additional fields
  venue?: {
    id: string
    name: string
  } | null
  search?: {
    id: string
    numberOfKids: number
    kidsAge: number
  } | null
  reason?: string | null
  discountClaimed?: string | null
  discountUsed?: boolean
}

export type EmailCaptureStats = {
  total: number
  acceptsMarketing: number
  recentCaptures: number
  topSources: { source: string; count: number }[]
  discountUsed: number
  bySource: Record<string, number>
}

// ============================================
// QUERIES
// ============================================

/**
 * Get all email captures with relations
 * TODO: Implement when EmailCapture model exists
 */
export async function getEmailCapturesWithRelations(): Promise<EmailCaptureWithRelations[]> {
  // Placeholder - return empty array
  return []
}

/**
 * Get email capture statistics
 * TODO: Implement when EmailCapture model exists
 */
export async function getEmailCaptureStats(): Promise<EmailCaptureStats> {
  // Placeholder - return empty stats
  return {
    total: 0,
    acceptsMarketing: 0,
    recentCaptures: 0,
    topSources: [],
    discountUsed: 0,
    bySource: {}
  }
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Delete an email capture
 * TODO: Implement when EmailCapture model exists
 */
export async function deleteEmailCapture(id: string): Promise<void> {
  console.warn('deleteEmailCapture called but EmailCapture model does not exist yet')
  // Placeholder - do nothing
}

/**
 * Unsubscribe an email from marketing
 * TODO: Implement when EmailCapture model exists
 */
export async function unsubscribeEmail(email: string): Promise<void> {
  console.warn('unsubscribeEmail called but EmailCapture model does not exist yet')
  // Placeholder - do nothing
}

/**
 * Export emails to CSV
 * TODO: Implement when EmailCapture model exists
 */
export async function exportEmailsToCSV(filters?: { acceptsMarketing?: boolean; source?: string }): Promise<string> {
  console.warn('exportEmailsToCSV called but EmailCapture model does not exist yet')
  // Placeholder - return empty CSV
  return 'email,firstName,lastName,acceptsMarketing,source,createdAt\n'
}
