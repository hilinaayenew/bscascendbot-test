/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BSC Ascendency'

interface Props {
  recipientName?: string
  partnerName?: string
  sessionDateLabel?: string
  sessionsUrl?: string
}

const SessionNotLoggedEmail = ({ recipientName, partnerName, sessionDateLabel, sessionsUrl }: Props) => {
  const firstName = recipientName?.split(' ')[0] || 'there'
  const url = sessionsUrl || 'https://bscascend.lovable.app/dashboard/sessions'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Log your recent session outcome</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Log your session outcome</Heading>
          <Text style={text}>Hi {firstName},</Text>
          <Text style={text}>
            Your session{partnerName ? ` with ${partnerName}` : ''}{sessionDateLabel ? ` on ${sessionDateLabel}` : ''} hasn't been logged yet.
            Capturing notes and outcomes helps track progress and keeps the pairing accountable.
          </Text>
          <Button href={url} style={button}>Log session</Button>
          <Text style={text}>Or visit: <Link href={url} style={linkStyle}>{url}</Link></Text>
          <Text style={text}>— {SITE_NAME} by Because She Can</Text>
          <Hr style={hr} />
          <Text style={footer}>You're getting this because a confirmed session has passed without a log entry.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: SessionNotLoggedEmail,
  subject: (data: Record<string, any>) =>
    `Log your session${data.sessionDateLabel ? ` from ${data.sessionDateLabel}` : ''} on ${SITE_NAME}`,
  displayName: 'Session not logged reminder',
  previewData: {
    recipientName: 'Amara Osei',
    partnerName: 'Sarah Mensah',
    sessionDateLabel: 'Dec 5',
    sessionsUrl: 'https://bscascend.lovable.app/dashboard/sessions',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Sora', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#4B0A2D', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: '#4B0A2D', color: '#ffffff', padding: '12px 22px', borderRadius: '6px', textDecoration: 'none', fontSize: '15px', fontWeight: '600' as const, display: 'inline-block', margin: '8px 0 20px' }
const linkStyle = { color: '#4B0A2D', textDecoration: 'underline' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '13px', color: '#888888', lineHeight: '1.5', margin: '0' }