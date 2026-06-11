import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface VendorWelcomeEmailProps {
  vendorName: string
  vendorEmail: string
  temporaryPassword: string
  loginUrl: string
}

export default function VendorWelcomeEmail({
  vendorName,
  vendorEmail,
  temporaryPassword,
  loginUrl
}: VendorWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Party Genie - Your Vendor Account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Party Genie! 🎉</Heading>

          <Text style={text}>
            Hi <strong>{vendorName}</strong>,
          </Text>

          <Text style={text}>
            Your vendor account has been successfully created. We're excited to have you join our platform!
          </Text>

          <Section style={codeBox}>
            <Text style={confirmationCodeText}>
              Your login credentials:
            </Text>
            <Text style={text}>
              <strong>Email:</strong> {vendorEmail}
            </Text>
            <Text style={text}>
              <strong>Temporary Password:</strong> <code style={code}>{temporaryPassword}</code>
            </Text>
          </Section>

          <Text style={text}>
            For security reasons, please change your password after your first login.
          </Text>

          <Section style={buttonContainer}>
            <Link style={button} href={loginUrl}>
              Login to Dashboard
            </Link>
          </Section>

          <Text style={text}>
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </Text>

          <Text style={footer}>
            Best regards,<br />
            The Party Genie Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
}

const h1 = {
  color: '#1C3658',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
}

const text = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 40px',
}

const codeBox = {
  background: '#f4f4f4',
  borderRadius: '4px',
  margin: '24px 40px',
  padding: '24px',
}

const confirmationCodeText = {
  fontSize: '18px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 16px',
  color: '#1C3658',
}

const code = {
  color: '#F8BD36',
  fontSize: '20px',
  fontWeight: 'bold',
  backgroundColor: '#1C3658',
  padding: '4px 8px',
  borderRadius: '4px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#F8BD36',
  borderRadius: '4px',
  color: '#1C3658',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
}

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '32px 40px 0',
}
