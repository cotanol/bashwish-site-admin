import { Resend } from 'resend'
import { render } from '@react-email/render'
import VendorWelcomeEmail from '@/emails/VendorWelcome'

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendVendorWelcomeEmailParams {
  vendorName: string
  vendorEmail: string
  temporaryPassword: string
}

/**
 * Send welcome email to new vendor with login credentials
 */
export async function sendVendorWelcomeEmail({
  vendorName,
  vendorEmail,
  temporaryPassword
}: SendVendorWelcomeEmailParams) {
  try {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`

    const emailHtml = await render(
      VendorWelcomeEmail({
        vendorName,
        vendorEmail,
        temporaryPassword,
        loginUrl
      })
    )

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: vendorEmail,
      subject: 'Welcome to Party Genie - Your Vendor Account',
      html: emailHtml
    })

    if (error) {
      console.error('Error sending vendor welcome email:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error('Failed to send vendor welcome email:', error)
    throw error
  }
}

/**
 * Test function to send a test email (for development)
 */
export async function sendTestEmail(toEmail: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: toEmail,
      subject: 'Test Email from Party Genie',
      html: '<p>This is a test email from Party Genie!</p>'
    })

    if (error) {
      console.error('Error sending test email:', error)
      return { success: false, error }
    }

    console.log('✅ Test email sent successfully:', data?.id)
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error('Failed to send test email:', error)
    return { success: false, error }
  }
}
