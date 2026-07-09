import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BSC Ascendency'

interface AccountSelfDeletedProps {
  name?: string
}

const AccountSelfDeletedEmail = ({ name }: AccountSelfDeletedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {SITE_NAME} account has been deleted</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Account Deleted</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi,'}
        </Text>
        <Text style={text}>
          This is to confirm that your {SITE_NAME} account has been permanently deleted, as you requested. All of your profile information, messages, pairings, course progress, and associated data have been removed from the platform.
        </Text>
        <Text style={text}>
          If you ever want to come back, you're welcome to sign up again at any time with the same email address.
        </Text>
        <Text style={text}>
          We're sorry to see you go — and we wish you all the best.
        </Text>
        <Text style={text}>
          Warm regards,
          <br />
          {SITE_NAME} by Because She Can
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          This message was sent automatically. If you did not request this deletion, please reply directly to this email and our team will investigate immediately.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AccountSelfDeletedEmail,
  subject: 'Your BSC Ascendency account has been deleted',
  displayName: 'Self-deletion confirmation',
  previewData: { name: 'Sarah' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Sora', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#4B0A2D', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '13px', color: '#888888', lineHeight: '1.5', margin: '0' }
