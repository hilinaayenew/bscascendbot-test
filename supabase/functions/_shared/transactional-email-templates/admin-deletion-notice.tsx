import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BSC Ascendency"

interface AdminDeletionNoticeProps {
  deletedEmail?: string
  deletedRole?: string
  deletedAt?: string
}

const AdminDeletionNoticeEmail = ({ deletedEmail, deletedRole, deletedAt }: AdminDeletionNoticeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Account self-deletion on {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Account Self-Deletion Notice</Heading>
        <Text style={text}>
          A user has deleted their own account on {SITE_NAME}.
        </Text>
        <Text style={text}>
          <strong>Email:</strong> {deletedEmail || 'Unknown'}<br />
          <strong>Role:</strong> {deletedRole || 'Unknown'}<br />
          <strong>Date:</strong> {deletedAt || new Date().toISOString()}
        </Text>
        <Text style={text}>
          This is an automated notification for your records. The user's data has been permanently removed from the platform.
        </Text>
        <Text style={footer}>
          This message was sent automatically. If you have any questions, you can reply directly to this email and our team will get back to you.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AdminDeletionNoticeEmail,
  subject: 'Account self-deletion notice',
  displayName: 'Admin deletion notice',
  previewData: { deletedEmail: 'user@example.com', deletedRole: 'mentee', deletedAt: '2026-03-28T10:00:00Z' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Sora', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0', borderTop: '1px solid #eaeaea', paddingTop: '16px' }
