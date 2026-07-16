/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Button, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BSC Ascendency'

interface AgreementLinkProps {
  name?: string
  otherPartyName?: string
  agreementUrl?: string
  status?: string
  signedDate?: string
}

const AgreementLinkEmail = ({ name, otherPartyName, agreementUrl, status, signedDate }: AgreementLinkProps) => {
  const isComplete = status === 'complete'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {isComplete
          ? `Your signed mentorship agreement with ${otherPartyName || 'your match'}`
          : `Open your mentorship agreement with ${otherPartyName || 'your match'}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {isComplete ? 'Your signed mentorship agreement' : 'Your mentorship agreement'}
          </Heading>
          <Text style={text}>Hi {name || 'there'},</Text>
          <Text style={text}>
            {isComplete
              ? `Your mentorship agreement with ${otherPartyName || 'your match'} was completed${signedDate ? ` on ${signedDate}` : ''}. You can view or download a PDF copy at any time using the secure link below.`
              : `You can pick up your mentorship agreement with ${otherPartyName || 'your match'} from the secure link below. Sign in to view, edit details, or sign.`}
          </Text>
          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={agreementUrl} style={button}>
              {isComplete ? 'View signed agreement' : 'Open agreement'}
            </Button>
          </Section>
          <Text style={small}>
            If the button doesn't work, paste this link into your browser:<br />
            <span style={{ wordBreak: 'break-all', color: '#4B0A2D' }}>{agreementUrl}</span>
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            This link opens the agreement inside {SITE_NAME}. You'll need to be signed in to your account.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AgreementLinkEmail,
  subject: (data: Record<string, any>) =>
    data?.status === 'complete'
      ? 'Your signed Ascendency mentorship agreement'
      : 'Your Ascendency mentorship agreement',
  displayName: 'Agreement link',
  previewData: {
    name: 'Sarah',
    otherPartyName: 'Amara Okafor',
    agreementUrl: 'https://example.com/dashboard/agreement/123',
    status: 'complete',
    signedDate: '23 June 2026',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Sora', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#4B0A2D', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const small = { fontSize: '13px', color: '#555555', lineHeight: '1.5', margin: '0 0 8px' }
const button = {
  backgroundColor: '#4B0A2D',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: '600' as const,
  display: 'inline-block',
}
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '13px', color: '#888888', lineHeight: '1.5', margin: '0' }