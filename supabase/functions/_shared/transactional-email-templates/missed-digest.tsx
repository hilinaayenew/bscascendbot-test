/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BSC Ascendency'

interface Item { label: string; detail?: string }
interface Props {
  recipientName?: string
  newMentors?: Item[]
  upcomingWorkshops?: Item[]
  newCourses?: Item[]
  dashboardUrl?: string
}

const Bullet = ({ items, title }: { items?: Item[]; title: string }) => {
  if (!items || items.length === 0) return null
  return (
    <Section style={{ margin: '0 0 20px' }}>
      <Text style={sectionTitle}>{title}</Text>
      {items.map((it, i) => (
        <Text key={i} style={bullet}>• {it.label}{it.detail ? ` — ${it.detail}` : ''}</Text>
      ))}
    </Section>
  )
}

const MissedDigestEmail = ({ recipientName, newMentors, upcomingWorkshops, newCourses, dashboardUrl }: Props) => {
  const firstName = recipientName?.split(' ')[0] || 'there'
  const url = dashboardUrl || 'https://bscascend.lovable.app/dashboard'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Here's what you've missed on {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Here's what you've missed</Heading>
          <Text style={text}>Hi {firstName},</Text>
          <Text style={text}>
            It's been a while. Here are a few things happening on Ascendency that you might want to check out.
          </Text>
          <Bullet items={newMentors} title="New mentors in your area" />
          <Bullet items={upcomingWorkshops} title="Upcoming workshops" />
          <Bullet items={newCourses} title="New courses to explore" />
          <Button href={url} style={button}>Open your dashboard</Button>
          <Text style={text}>Or visit: <Link href={url} style={linkStyle}>{url}</Link></Text>
          <Text style={text}>— {SITE_NAME} by Because She Can</Text>
          <Hr style={hr} />
          <Text style={footer}>You're receiving this because you haven't signed in for a couple of weeks.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: MissedDigestEmail,
  subject: `Here's what you've missed on ${SITE_NAME}`,
  displayName: 'Re-engagement digest (14d inactive)',
  previewData: {
    recipientName: 'Amara Osei',
    newMentors: [{ label: 'Sarah Mensah', detail: 'Career strategy, Accra' }],
    upcomingWorkshops: [{ label: 'Personal branding', detail: 'Sat, Dec 14' }],
    newCourses: [{ label: 'Negotiation essentials' }],
    dashboardUrl: 'https://bscascend.lovable.app/dashboard',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Sora', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#4B0A2D', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const sectionTitle = { fontSize: '14px', fontWeight: '700' as const, color: '#4B0A2D', textTransform: 'uppercase' as const, letterSpacing: '0.04em', margin: '0 0 8px' }
const bullet = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 4px' }
const button = { backgroundColor: '#4B0A2D', color: '#ffffff', padding: '12px 22px', borderRadius: '6px', textDecoration: 'none', fontSize: '15px', fontWeight: '600' as const, display: 'inline-block', margin: '8px 0 20px' }
const linkStyle = { color: '#4B0A2D', textDecoration: 'underline' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '13px', color: '#888888', lineHeight: '1.5', margin: '0' }