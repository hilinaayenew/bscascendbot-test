/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BSC Ascendency'

interface MentorWelcomeProps {
  name?: string
}

const MentorWelcomeEmail = ({ name }: MentorWelcomeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — you're in!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to {SITE_NAME} — you're in!</Heading>
        <Text style={text}>
          Hi {name || 'there'},
        </Text>
        <Text style={text}>
          Thank you for signing up as a mentor on Ascendency. We're really glad you're here.
        </Text>
        <Text style={text}>
          Your application is currently under review by our team. We take mentor approvals seriously because the mentees coming onto this platform are trusting us to connect them with the right people — and we want to make sure every mentor on Ascendency is set up for a great experience.
        </Text>
        <Text style={text}>
          While you wait, your account is active and ready for you to explore. Here's what you can do right now:
        </Text>
        <Text style={listItem}>• Complete your mentor profile under Settings — a strong profile helps us review your application faster and makes a great first impression when you go live</Text>
        <Text style={listItem}>• Browse the platform and get familiar with how things work</Text>
        <Text style={listItem}>• Take courses available to you in the Courses tab</Text>
        <Text style={text}>
          We'll be in touch as soon as your application has been reviewed. It shouldn't be a long wait.
        </Text>
        <Text style={text}>
          Welcome aboard,
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
  component: MentorWelcomeEmail,
  subject: `Welcome to ${SITE_NAME} — you're in!`,
  displayName: 'Mentor welcome',
  previewData: { name: 'Sarah' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Sora', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#4B0A2D', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const listItem = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 8px', paddingLeft: '8px' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '13px', color: '#888888', lineHeight: '1.5', margin: '0' }
