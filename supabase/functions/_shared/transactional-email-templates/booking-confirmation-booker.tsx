/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BSC Ascendency'

interface Props {
  bookerName?: string
  mentorName?: string
  date?: string
  time?: string
  timezone?: string
  meetingLink?: string
}

const BookingConfirmationBookerEmail = ({ bookerName, mentorName, date, time, timezone, meetingLink }: Props) => {
  const firstName = bookerName?.split(' ')[0] || 'there'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your session is confirmed — {mentorName || 'your mentor'}, {date || ''} at {time || ''}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your session is confirmed</Heading>
          <Text style={text}>Hi {firstName},</Text>
          <Text style={text}>Your session has been confirmed. Here are the details:</Text>
          <Text style={detailRow}><strong>With:</strong> {mentorName || 'Your mentor'}</Text>
          <Text style={detailRow}><strong>Date:</strong> {date || 'TBC'}</Text>
          <Text style={detailRow}><strong>Time:</strong> {time || 'TBC'}{timezone ? ` (${timezone})` : ''}</Text>
          <Text style={detailRow}><strong>Session type:</strong> One-on-one</Text>
          {meetingLink && (
            <Text style={detailRow}>
              <strong>Meeting link:</strong>{' '}
              <Link href={meetingLink} style={linkStyle}>{meetingLink}</Link>
            </Text>
          )}
          <Text style={text}>
            You can view your upcoming sessions at any time from your Sessions page on the platform.
          </Text>
          <Text style={text}>
            If you need to make any changes, please reach out to the person directly through the platform's messaging feature.
          </Text>
          <Text style={text}>
            Looking forward to it,
            <br />
            {SITE_NAME} by Because She Can
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

export const template = {
  component: BookingConfirmationBookerEmail,
  subject: (data: Record<string, any>) =>
    `Your session is confirmed — ${data.mentorName || 'your mentor'}, ${data.date || ''} at ${data.time || ''}`,
  displayName: 'Booking confirmation (booker)',
  previewData: { bookerName: 'Amara Osei', mentorName: 'Sarah Mensah', date: 'Monday, January 15, 2025', time: '10:00 AM', timezone: 'Africa/Accra', meetingLink: 'https://meet.google.com/abc-defg-hij' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Sora', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#4B0A2D', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const detailRow = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 8px', paddingLeft: '8px' }
const linkStyle = { color: '#4B0A2D', textDecoration: 'underline' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '13px', color: '#888888', lineHeight: '1.5', margin: '0' }
