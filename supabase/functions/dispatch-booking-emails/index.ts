import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Sends both confirm or cancel emails for a booking. Recipients are resolved
// server-side from the booking record, so callers cannot supply arbitrary
// addresses. The caller must be authenticated and a participant in the booking
// (mentor or booker), unless they are an admin.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const token = authHeader.replace('Bearer ', '')
  const { data: claims, error: claimsError } = await userClient.auth.getClaims(token)
  if (claimsError || !claims?.claims) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const userId = claims.claims.sub as string

  let body: any
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { bookingId, flow } = body
  if (!bookingId || !['confirm', 'cancel'].includes(flow)) {
    return new Response(JSON.stringify({ error: 'bookingId and flow (confirm|cancel) required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const service = createClient(supabaseUrl, supabaseServiceKey)

  const { data: booking } = await service
    .from('bookings')
    .select('id, mentor_id, booker_id, booking_date, start_time, timezone')
    .eq('id', bookingId)
    .maybeSingle()
  if (!booking) {
    return new Response(JSON.stringify({ error: 'Booking not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: isAdmin } = await service.rpc('has_role', { _user_id: userId, _role: 'admin' })
  if (!isAdmin && userId !== booking.mentor_id && userId !== booking.booker_id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const [{ data: mentorProfile }, { data: bookerProfile }, { data: mentorDetails }] = await Promise.all([
    service.from('profiles').select('full_name, email').eq('user_id', booking.mentor_id).maybeSingle(),
    service.from('profiles').select('full_name, email').eq('user_id', booking.booker_id).maybeSingle(),
    service.from('mentor_details').select('meeting_link').eq('user_id', booking.mentor_id).maybeSingle(),
  ])

  // Format date/time in UTC for stable server output; client UI already shows local TZ.
  const dateObj = new Date(`${booking.booking_date}T${(booking.start_time as string).slice(0, 8)}Z`)
  const formattedDate = dateObj.toUTCString().split(' ').slice(0, 4).join(' ')
  const formattedTime = dateObj.toUTCString().split(' ')[4].slice(0, 5) + ' UTC'
  const tz = booking.timezone || 'UTC'
  const meetingLink = (mentorDetails as any)?.meeting_link || undefined

  if (flow === 'confirm') {
    await Promise.all([
      service.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'booking-confirmation-mentor',
          recipientEmail: (mentorProfile as any)?.email,
          idempotencyKey: `booking-mentor-${booking.id}`,
          templateData: {
            mentorName: (mentorProfile as any)?.full_name,
            bookerName: (bookerProfile as any)?.full_name,
            date: formattedDate, time: formattedTime, timezone: tz, meetingLink,
          },
        },
      }),
      service.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'booking-confirmation-booker',
          recipientEmail: (bookerProfile as any)?.email,
          idempotencyKey: `booking-booker-${booking.id}`,
          templateData: {
            bookerName: (bookerProfile as any)?.full_name,
            mentorName: (mentorProfile as any)?.full_name,
            date: formattedDate, time: formattedTime, timezone: tz, meetingLink,
          },
        },
      }),
    ])
  } else {
    await Promise.all([
      service.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'booking-cancelled',
          recipientEmail: (mentorProfile as any)?.email,
          idempotencyKey: `cancel-mentor-${booking.id}`,
          templateData: {
            recipientName: (mentorProfile as any)?.full_name,
            otherPartyName: (bookerProfile as any)?.full_name,
            date: formattedDate, time: formattedTime, timezone: tz,
          },
        },
      }),
      service.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'booking-cancelled',
          recipientEmail: (bookerProfile as any)?.email,
          idempotencyKey: `cancel-booker-${booking.id}`,
          templateData: {
            recipientName: (bookerProfile as any)?.full_name,
            otherPartyName: (mentorProfile as any)?.full_name,
            date: formattedDate, time: formattedTime, timezone: tz,
          },
        },
      }),
    ])
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})