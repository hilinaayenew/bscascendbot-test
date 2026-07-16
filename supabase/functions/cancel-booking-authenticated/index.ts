import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Authenticated cancellation: a logged-in participant (mentor or booker) cancels
// a booking by id. The cancel_token is never returned to the client.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization') || ''
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const callerId = userData.user.id

  let body: any
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const bookingId = body?.bookingId
  if (!bookingId || typeof bookingId !== 'string') {
    return new Response(JSON.stringify({ error: 'bookingId required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const service = createClient(supabaseUrl, serviceKey)

  const { data: booking } = await service
    .from('bookings')
    .select('id, mentor_id, booker_id, booking_date, start_time, timezone, status')
    .eq('id', bookingId)
    .maybeSingle()

  if (!booking) {
    return new Response(JSON.stringify({ error: 'Booking not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (booking.mentor_id !== callerId && booking.booker_id !== callerId) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if ((booking as any).status !== 'cancelled') {
    await service.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
  }

  const [{ data: mentorProfile }, { data: bookerProfile }] = await Promise.all([
    service.from('profiles').select('full_name, email').eq('user_id', booking.mentor_id).maybeSingle(),
    service.from('profiles').select('full_name, email').eq('user_id', booking.booker_id).maybeSingle(),
  ])

  const dateObj = new Date(`${booking.booking_date}T${(booking.start_time as string).slice(0, 8)}Z`)
  const formattedDate = dateObj.toUTCString().split(' ').slice(0, 4).join(' ')
  const formattedTime = dateObj.toUTCString().split(' ')[4].slice(0, 5) + ' UTC'
  const tz = booking.timezone || 'UTC'

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

  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})