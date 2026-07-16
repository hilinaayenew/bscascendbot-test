/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as mentorWelcome } from './mentor-welcome.tsx'
import { template as mentorApproved } from './mentor-approved.tsx'
import { template as mentorRejected } from './mentor-rejected.tsx'
import { template as accountDeleted } from './account-deleted.tsx'
import { template as accountSelfDeleted } from './account-self-deleted.tsx'
import { template as adminDeletionNotice } from './admin-deletion-notice.tsx'
import { template as bookingConfirmationMentor } from './booking-confirmation-mentor.tsx'
import { template as bookingConfirmationBooker } from './booking-confirmation-booker.tsx'
import { template as bookingReminderMentor } from './booking-reminder-mentor.tsx'
import { template as bookingReminderBooker } from './booking-reminder-booker.tsx'
import { template as bookingCancelled } from './booking-cancelled.tsx'
import { template as mentorPoolInvite } from './mentor-pool-invite.tsx'
import { template as messageReminder } from './message-reminder.tsx'
import { template as newMessageNotification } from './new-message-notification.tsx'
import { template as sessionNotLogged } from './session-not-logged.tsx'
import { template as subscriptionExpiring } from './subscription-expiring.tsx'
import { template as missedDigest } from './missed-digest.tsx'
import { template as workshopReminder } from './workshop-reminder.tsx'
import { template as agreementLink } from './agreement-link.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'mentor-welcome': mentorWelcome,
  'mentor-approved': mentorApproved,
  'mentor-rejected': mentorRejected,
  'account-deleted': accountDeleted,
  'account-self-deleted': accountSelfDeleted,
  'admin-deletion-notice': adminDeletionNotice,
  'booking-confirmation-mentor': bookingConfirmationMentor,
  'booking-confirmation-booker': bookingConfirmationBooker,
  'booking-reminder-mentor': bookingReminderMentor,
  'booking-reminder-booker': bookingReminderBooker,
  'booking-cancelled': bookingCancelled,
  'mentor-pool-invite': mentorPoolInvite,
  'message-reminder': messageReminder,
  'new-message-notification': newMessageNotification,
  'session-not-logged': sessionNotLogged,
  'subscription-expiring': subscriptionExpiring,
  'missed-digest': missedDigest,
  'workshop-reminder': workshopReminder,
  'agreement-link': agreementLink,
}
