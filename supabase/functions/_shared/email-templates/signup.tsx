/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
  Section,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  firstName?: string
  role?: string
}

const SITE_NAME = 'BSC Ascendency'

export const SignupEmail = ({
  siteName = SITE_NAME,
  siteUrl,
  recipient,
  confirmationUrl,
  firstName,
  role,
}: SignupEmailProps) => {
  const displayName = firstName || 'there'
  const isMentor = role === 'mentor'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Welcome to {siteName} — please verify your email
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            Welcome to {siteName} — please verify your email
          </Heading>

          <Text style={text}>
            Hi {displayName},
          </Text>

          <Text style={text}>
            Thank you for signing up{isMentor ? ' as a mentor' : ''} on Ascendency. We're really glad you're here.
          </Text>

          <Text style={text}>
            Before you can access your account, you need to verify your email address. Click the button below to confirm it's you:
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={confirmationUrl}>
              Verify my email
            </Button>
          </Section>

          <Text style={smallText}>
            Can't see the button? Copy and paste this link into your browser:{' '}
            <Link href={confirmationUrl} style={link}>
              {confirmationUrl}
            </Link>
          </Text>

          <Text style={mutedText}>
            If you didn't create this account, you can safely ignore this email.
          </Text>

          {isMentor && (
            <>
              <Hr style={hr} />

              <Text style={text}>
                Once you're verified and logged in, your mentor application will be under review by our team. We take approvals seriously because the mentees on this platform are trusting us to connect them with the right people — and we want to make sure every mentor on Ascendency is set up for a great experience.
              </Text>

              <Text style={text}>
                While your application is being reviewed, your account is active and ready to explore. Here's what you can do right now:
              </Text>

              <Text style={listItem}>
                • Complete your mentor profile under Settings — a strong profile helps us review your application faster and makes a great first impression when you go live
              </Text>
              <Text style={listItem}>
                • Browse the platform and get familiar with how things work
              </Text>
              <Text style={listItem}>
                • Take courses available to you in the Courses tab
              </Text>

              <Text style={text}>
                We'll be in touch as soon as your application has been reviewed. It shouldn't be a long wait.
              </Text>
            </>
          )}

          <Text style={text}>
            Welcome aboard,
            <br />
            {siteName} by Because She Can
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            This message was sent automatically. If you have any questions, reply to this email and our team will get back to you.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Sora', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#4B0A2D', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const smallText = { fontSize: '13px', color: '#666666', lineHeight: '1.5', margin: '0 0 16px', wordBreak: 'break-all' as const }
const mutedText = { fontSize: '13px', color: '#999999', lineHeight: '1.5', margin: '0 0 16px' }
const listItem = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 8px', paddingLeft: '8px' }
const link = { color: '#C8102E', textDecoration: 'underline' }
const buttonSection = { textAlign: 'center' as const, margin: '24px 0' }
const button = {
  backgroundColor: '#C8102E',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600' as const,
  borderRadius: '6px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#888888', lineHeight: '1.5', margin: '0' }
