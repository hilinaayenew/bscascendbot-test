/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BSC Ascendency'

interface Props {
  recipientName?: string
  daysLeft?: number
  expiryDateLabel?: string
  subscribeUrl?: string
}

const SubscriptionExpiringEmail = ({ recipientName, daysLeft, expiryDateLabel, subscribeUrl }: Props) => {
  const firstName = recipientName?.split(' ')[0] || 'there'
  const url = subscribeUrl || 'https://bscascend.lovable.app/dashboard/subscribe'
  const headline =
    daysLeft === 0
      ? 'Your access expires today'
      : daysLeft === 1
        ? 'Your access expires tomorrow'
        : `Your access expires in ${daysLeft} days`
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{headline}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{headline}</Heading>
          <Text style={text}>Hi {firstName},</Text>
          <Text style={text}>
            Your Ascendency access {expiryDateLabel ? `expires on ${expiryDateLabel}` : 'is about to expire'}.
            Renew now to keep messaging your mentor, booking sessions, and accessing courses without interruption.
          </Text>
          <Button href={url} style={button}>Renew access</Button>
          <Text style={text}>Or visit: <Link href={url} style={linkStyle}>{url}</Link></Text>
          <Text style={text}>— {SITE_NAME} by Because She Can</Text>
          <Hr style={hr} />
          <Text style={footer}>You're receiving this because your activation period is ending soon.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: SubscriptionExpiringEmail,
  subject: (data: Record<string, any>) => {
    const d = data.daysLeft
    if (d === 0) return `Your ${SITE_NAME} access expires today`
    if (d === 1) return `Your ${SITE_NAME} access expires tomorrow`
    return `Your ${SITE_NAME} access expires in ${d ?? 'a few'} days`
  },
  displayName: 'Subscription expiring',
  previewData: {
    recipientName: 'Amara Osei',
    daysLeft: 14,
    expiryDateLabel: 'Dec 24, 2026',
    subscribeUrl: 'https://bscascend.lovable.app/dashboard/subscribe',
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