/**
 * Purpose: Send 24-hour booking reminder emails via pg_cron daily job
 * DB tables: bookings, profiles
 * Emails: booking-reminder-mentor, booking-reminder-booker
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import { format } from 'npm:date-fns@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Restrict to service_role callers only — this is a cron job, not user-facing.
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : ''
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''))
    if (payload?.role !== 'service_role') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Find bookings for tomorrow (UTC date) that haven't had reminders sent
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd')

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, mentor_id, booker_id, booking_date, start_time, end_time, timezone, status, reminder_sent, cancel_token')
    .eq('booking_date', tomorrowStr)
    .eq('status', 'confirmed')
    .eq('reminder_sent', false)

  if (error) {
    console.error('Failed to fetch bookings', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch bookings' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!bookings?.length) {
    console.log('No bookings for tomorrow', { date: tomorrowStr })
    return new Response(JSON.stringify({ sent: 0 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Gather all unique user IDs and mentor IDs
  const userIds = new Set<string>()
  const mentorIds = new Set<string>()
  bookings.forEach(b => { userIds.add(b.mentor_id); userIds.add(b.booker_id); mentorIds.add(b.mentor_id) })

  const [{ data: profiles }, { data: mentorDetails }] = await Promise.all([
    supabase.from('profiles').select('user_id, full_name, email').in('user_id', Array.from(userIds)),
    supabase.from('mentor_details').select('user_id, meeting_link').in('user_id', Array.from(mentorIds)),
  ])

  const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || [])
  const mentorDetailMap = new Map(mentorDetails?.map((m: any) => [m.user_id, m]) || [])

  let sentCount = 0

  for (const booking of bookings) {
    const mentor = profileMap.get(booking.mentor_id)
    const booker = profileMap.get(booking.booker_id)

    if (!mentor?.email || !booker?.email) continue

    // Convert UTC start_time to a display time using the booking's stored timezone
    const [h, m] = booking.start_time.split(':').map(Number)
    const utcDate = new Date(Date.UTC(
      tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), h, m
    ))
    const tz = booking.timezone || 'UTC'
    const formattedTime = utcDate.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz,
    })
    const formattedDate = format(tomorrow, 'EEEE, MMMM d, yyyy')

    const meetingLink = (mentorDetailMap.get(booking.mentor_id) as any)?.meeting_link || undefined

    // Send reminder to mentor
    await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'booking-reminder-mentor',
        recipientEmail: mentor.email,
        idempotencyKey: `reminder-mentor-${booking.id}`,
        templateData: {
          mentorName: mentor.full_name,
          bookerName: booker.full_name,
          date: formattedDate,
          time: formattedTime,
          timezone: tz,
          meetingLink,
        },
      },
    })

    // Send reminder to booker
    await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'booking-reminder-booker',
        recipientEmail: booker.email,
        idempotencyKey: `reminder-booker-${booking.id}`,
        templateData: {
          bookerName: booker.full_name,
          mentorName: mentor.full_name,
          date: formattedDate,
          time: formattedTime,
          timezone: tz,
          meetingLink,
        },
      },
    })

    // Mark reminder as sent to prevent duplicates
    await supabase
      .from('bookings')
      .update({ reminder_sent: true })
      .eq('id', booking.id)

    sentCount++
  }

  console.log(`Sent ${sentCount * 2} reminder emails for ${sentCount} bookings`)

  return new Response(JSON.stringify({ sent: sentCount * 2 }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
