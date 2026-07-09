/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BSC Ascendency'

interface Props {
  recipientName?: string
  otherPartyName?: string
  date?: string
  time?: string
  timezone?: string
}

const BookingCancelledEmail = ({ recipientName, otherPartyName, date, time, timezone }: Props) => {
  const firstName = recipientName?.split(' ')[0] || 'there'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Session cancelled — {date || ''} at {time || ''}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Session Cancelled</Heading>
          <Text style={text}>Hi {firstName},</Text>
          <Text style={text}>A mentorship session has been cancelled. Here are the details:</Text>
          <Text style={detailRow}><strong>Other party:</strong> {otherPartyName || 'A community member'}</Text>
          <Text style={detailRow}><strong>Date:</strong> {date || 'TBC'}</Text>
          <Text style={detailRow}><strong>Time:</strong> {time || 'TBC'}{timezone ? ` (${timezone})` : ''}</Text>
          <Text style={text}>
            Feel free to rebook at a time that works for you.
          </Text>
          <Text style={text}>
            Best,
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
  component: BookingCancelledEmail,
  subject: (data: Record<string, any>) =>
    `Session cancelled — ${data.date || ''} at ${data.time || ''}`,
  displayName: 'Booking cancelled',
  previewData: { recipientName: 'Sarah Mensah', otherPartyName: 'Amara Osei', date: 'Monday, January 15, 2025', time: '10:00 AM', timezone: 'Africa/Accra' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Sora', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#4B0A2D', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const detailRow = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 8px', paddingLeft: '8px' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '13px', color: '#888888', lineHeight: '1.5', margin: '0' }
