import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BSC Ascendency"

interface AccountDeletedProps {
  name?: string
}

const AccountDeletedEmail = ({ name }: AccountDeletedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {SITE_NAME} account has been removed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Account Removed</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi,'}
        </Text>
        <Text style={text}>
          We're writing to let you know that your account on {SITE_NAME} has been removed by our team. Your profile, messages, pairings, and all associated data have been permanently deleted.
        </Text>
        <Text style={text}>
          If you believe this was a mistake, please reply directly to this email and our team will get back to you.
        </Text>
        <Text style={footer}>
          This message was sent automatically. If you have any questions, you can reply directly to this email and our team will get back to you.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AccountDeletedEmail,
  subject: 'Your BSC Ascendency account has been removed',
  displayName: 'Account deleted notification',
  previewData: { name: 'Jane' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Sora', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0', borderTop: '1px solid #eaeaea', paddingTop: '16px' }
