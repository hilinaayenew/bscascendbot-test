/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BSC Ascendency'

interface MentorApprovedProps {
  name?: string
}

const MentorApprovedEmail = ({ name }: MentorApprovedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're approved — welcome to the {SITE_NAME} mentor community 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're approved — welcome to the {SITE_NAME} mentor community 🎉</Heading>
        <Text style={text}>
          Hi {name || 'there'},
        </Text>
        <Text style={text}>
          Great news — your Ascendency mentor application has been approved! You now have full access to the platform and can start connecting with mentees.
        </Text>
        <Text style={text}>
          Here's what's unlocked for you:
        </Text>
        <Text style={listItem}>• Your profile is now live and visible to mentees on the Explore page</Text>
        <Text style={listItem}>• Mentees can send you pairing requests and you can accept or decline them</Text>
        <Text style={listItem}>• You can book and receive one-on-one session requests</Text>
        <Text style={listItem}>• You can message your mentees directly through the platform</Text>
        <Text style={text}>
          A few things worth doing before your first session:
        </Text>
        <Text style={listItem}>• Double-check your profile is complete and reflects how you want to show up to mentees</Text>
        <Text style={listItem}>• Set your availability so mentees know when you're open for sessions</Text>
        <Text style={listItem}>• Familiarise yourself with the Pairings tab — that's where you'll track your mentees' progress</Text>
        <Text style={text}>
          We're excited to have you as part of the Ascendency community. The work you do as a mentor genuinely changes the trajectory of the people you work with — thank you for showing up for that.
        </Text>
        <Text style={text}>
          Let's go,
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
  component: MentorApprovedEmail,
  subject: "You're approved — welcome to the Ascendency mentor community 🎉",
  displayName: 'Mentor approved',
  previewData: { name: 'Sarah' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Sora', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#4B0A2D', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const listItem = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 8px', paddingLeft: '8px' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '13px', color: '#888888', lineHeight: '1.5', margin: '0' }
