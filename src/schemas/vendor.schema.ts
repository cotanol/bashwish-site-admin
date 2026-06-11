import { z } from 'zod'

/**
 * Schema para Vendor Application (Simplified MVP)
 * Validación compartida entre frontend y backend
 * ⚠️ Este archivo debe estar sincronizado con public_site/src/schemas/vendor.schema.ts
 */
export const vendorClaimSchema = z.object({
  // ========================================
  // CONTACT INFORMATION (Required)
  // ========================================
  contactName: z.string().min(2, 'Contact name must be at least 2 characters').max(100, 'Contact name is too long'),

  contactEmail: z.string().email('Please enter a valid email address').toLowerCase(),

  contactPhone: z
    .string()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),

  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(150, 'Business name is too long')
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),

  // ========================================
  // WEBSITE (Optional - for admin verification)
  // ========================================
  website: z
    .string()
    .url('Please enter a valid website URL (e.g., https://example.com)')
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val)
})

/**
 * TypeScript type inferred from schema
 */
export type VendorClaimInput = z.infer<typeof vendorClaimSchema>

/**
 * Default values for form
 */
export const vendorClaimDefaults: Partial<VendorClaimInput> = {
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  businessName: '',
  website: ''
}
