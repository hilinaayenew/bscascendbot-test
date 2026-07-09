/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BSC Ascendency'

interface MentorRejectedProps {
  name?: string
}

const MentorRejectedEmail = ({ name }: MentorRejectedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>An update on your {SITE_NAME} mentor application</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>An update on your mentor application</Heading>
        <Text style={text}>
          Hi {name || 'there'},
        </Text>
        <Text style={text}>
          Thank you for your interest in mentoring on Ascendency. After reviewing your application, we're not able to approve it at this time.
        </Text>
        <Text style={text}>
          This doesn't reflect on your abilities or experience — we review every application carefully and sometimes the timing or fit isn't quite right.
        </Text>
        <Text style={text}>
          If you have any questions or would like to know more, please don't hesitate to reach out to us at support@becauseshecan.com. We're always happy to chat.
        </Text>
        <Text style={text}>
          Warm regards,
          <br />
          {SITE_NAME} by Because She Can
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          This message was sent automatically. If you have any questions, you can reply directly to this email and our team will get back to you.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: MentorRejectedEmail,
  subject: 'An update on your Ascendency mentor application',
  displayName: 'Mentor rejected',
  previewData: { name: 'Sarah' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Sora', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#4B0A2D', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '13px', color: '#888888', lineHeight: '1.5', margin: '0' }
