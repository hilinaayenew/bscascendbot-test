/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Link, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BSC Ascendency'

interface Props {
  recipientName?: string
  senderName?: string
  preview?: string
  messagesUrl?: string
}

const NewMessageNotificationEmail = ({ recipientName, senderName, preview, messagesUrl }: Props) => {
  const firstName = recipientName?.split(' ')[0] || 'there'
  const from = senderName || 'A community member'
  const url = messagesUrl || 'https://bscascend.lovable.app/messages'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>New message from {from}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You have a new message</Heading>
          <Text style={text}>Hi {firstName},</Text>
          <Text style={text}>
            {from} just sent you a new message on {SITE_NAME}.
          </Text>
          {preview && (
            <Text style={quote}>"{preview}"</Text>
          )}
          <Button href={url} style={button}>Open Messages</Button>
          <Text style={text}>
            Or visit: <Link href={url} style={linkStyle}>{url}</Link>
          </Text>
          <Text style={text}>
            — {SITE_NAME} by Because She Can
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            You're receiving this because instant message notifications are turned on for your account.
            You can change this anytime in Settings.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: NewMessageNotificationEmail,
  subject: (data: Record<string, any>) =>
    `New message from ${data.senderName || 'a community member'} on ${SITE_NAME}`,
  displayName: 'New message notification',
  previewData: {
    recipientName: 'Amara Osei',
    senderName: 'Sarah Mensah',
    preview: 'Hi Amara, do you have time this week for a quick chat?',
    messagesUrl: 'https://bscascend.lovable.app/messages',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Sora', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#4B0A2D', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const quote = { fontSize: '15px', color: '#555555', fontStyle: 'italic' as const, lineHeight: '1.6', margin: '0 0 20px', paddingLeft: '12px', borderLeft: '3px solid #4B0A2D' }
const button = { backgroundColor: '#4B0A2D', color: '#ffffff', padding: '12px 22px', borderRadius: '6px', textDecoration: 'none', fontSize: '15px', fontWeight: '600' as const, display: 'inline-block', margin: '8px 0 20px' }
const linkStyle = { color: '#4B0A2D', textDecoration: 'underline' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '13px', color: '#888888', lineHeight: '1.5', margin: '0' }