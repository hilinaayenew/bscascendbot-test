/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BSC Ascendency'

interface Props {
  recipientName?: string
  workshopTitle?: string
  whenLabel?: string
  windowLabel?: string // "tomorrow" | "in 1 hour"
  location?: string
  joinUrl?: string
}

const WorkshopReminderEmail = ({ recipientName, workshopTitle, whenLabel, windowLabel, location, joinUrl }: Props) => {
  const firstName = recipientName?.split(' ')[0] || 'there'
  const url = joinUrl || 'https://bscascend.lovable.app/dashboard'
  const title = workshopTitle || 'an upcoming workshop'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{title} starts {windowLabel || 'soon'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{title}</Heading>
          <Text style={text}>Hi {firstName},</Text>
          <Text style={text}>
            This is a reminder that <strong>{title}</strong> is starting {windowLabel || 'soon'}{whenLabel ? ` (${whenLabel})` : ''}.
            {location ? ` Location: ${location}.` : ''}
          </Text>
          {joinUrl && <Button href={url} style={button}>Join workshop</Button>}
          {joinUrl && <Text style={text}>Or visit: <Link href={url} style={linkStyle}>{url}</Link></Text>}
          <Text style={text}>— {SITE_NAME} by Because She Can</Text>
          <Hr style={hr} />
          <Text style={footer}>You're receiving this because this workshop is open to you on Ascendency.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WorkshopReminderEmail,
  subject: (data: Record<string, any>) =>
    `${data.workshopTitle || 'Workshop'} starts ${data.windowLabel || 'soon'}`,
  displayName: 'Workshop reminder',
  previewData: {
    recipientName: 'Amara Osei',
    workshopTitle: 'Personal branding for Africans',
    whenLabel: 'Sat, Dec 14 at 3pm UTC',
    windowLabel: 'tomorrow',
    location: 'Zoom',
    joinUrl: 'https://bscascend.lovable.app/dashboard',
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