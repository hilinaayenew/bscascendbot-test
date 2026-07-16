/**
 * Purpose: Daily cron — sends action-point email alerts:
 *   1. session-not-logged: confirmed booking date passed >= 1 day with no session_log on that date
 *   2. subscription-expiring: mentee activation expiring in 14d / 3d / 0d (idempotent per window)
 *   3. missed-digest: user has not signed in for 14+ days (idempotent: skip if sent in last 14d)
 * Auth: service_role only (verify_jwt = true at gateway + getClaims double-check).
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import { format } from 'npm:date-fns@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE = 'https://bscascend.lovable.app'
const ACTIVATION_DAYS = 183
const EXPIRY_WINDOWS = [14, 3, 0]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) return json({ error: 'Forbidden' }, 403)
  const verifier = createClient(supabaseUrl, anonKey)
  const { data: claims, error: cErr } = await verifier.auth.getClaims(token)
  if (cErr || claims?.claims?.role !== 'service_role') return json({ error: 'Forbidden' }, 403)

  const supabase = createClient(supabaseUrl, serviceKey)
  const sent = { sessionNotLogged: 0, subscriptionExpiring: 0, missedDigest: 0, errors: [] as string[] }

  // ---------- 1. SESSION NOT LOGGED ----------
  try {
    // confirmed bookings whose date was at least 1 day ago and at most 14 days ago
    const today = new Date()
    const start = new Date(today); start.setUTCDate(start.getUTCDate() - 14)
    const end = new Date(today); end.setUTCDate(end.getUTCDate() - 1)
    const startStr = format(start, 'yyyy-MM-dd')
    const endStr = format(end, 'yyyy-MM-dd')

    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, mentor_id, booker_id, booking_date, title')
      .eq('status', 'confirmed')
      .gte('booking_date', startStr)
      .lte('booking_date', endStr)

    for (const b of bookings || []) {
      // find a pairing that contains both participants
      const { data: pairing } = await supabase
        .from('pairings')
        .select('id')
        .or(`and(mentor_id.eq.${b.mentor_id},mentee_id.eq.${b.booker_id}),and(mentor_id.eq.${b.booker_id},mentee_id.eq.${b.mentor_id})`)
        .maybeSingle()
      let logged = false
      if (pairing) {
        const { data: log } = await supabase
          .from('session_logs')
          .select('id')
          .eq('pairing_id', (pairing as any).id)
          .eq('session_date', b.booking_date)
          .maybeSingle()
        logged = !!log
      }
      if (logged) continue
      // notify both participants
      for (const uid of [b.mentor_id, b.booker_id]) {
        const partnerId = uid === b.mentor_id ? b.booker_id : b.mentor_id
        const [{ data: me }, { data: partner }] = await Promise.all([
          supabase.from('profiles').select('full_name, email').eq('user_id', uid).maybeSingle(),
          supabase.from('profiles').select('full_name').eq('user_id', partnerId).maybeSingle(),
        ])
        if (!me?.email) continue
        const idemKey = `session-not-logged-${b.id}-${uid}`
        const { data: already } = await supabase
          .from('email_send_log')
          .select('id')
          .eq('message_id', idemKey)
          .limit(1)
          .maybeSingle()
        if (already) continue
        const res = await invoke(supabase, 'send-transactional-email', {
          templateName: 'session-not-logged',
          recipientEmail: me.email,
          idempotencyKey: idemKey,
          templateData: {
            recipientName: me.full_name,
            partnerName: partner?.full_name,
            sessionDateLabel: format(new Date(b.booking_date), 'MMM d'),
            sessionsUrl: `${SITE}/dashboard/sessions`,
          },
        })
        if (res.ok) sent.sessionNotLogged++
      }
    }
  } catch (e) { sent.errors.push(`session-not-logged: ${String(e)}`) }

  // ---------- 2. SUBSCRIPTION EXPIRING ----------
  try {
    const { data: codes } = await supabase
      .from('discount_codes')
      .select('redeemed_by, redeemed_at')
      .not('redeemed_by', 'is', null)
    const now = new Date()
    for (const c of codes || []) {
      if (!c.redeemed_at) continue
      const expiry = new Date(new Date(c.redeemed_at).getTime() + ACTIVATION_DAYS * 86400000)
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / 86400000)
      if (!EXPIRY_WINDOWS.includes(daysLeft)) continue
      const { data: prof } = await supabase
        .from('profiles').select('full_name, email').eq('user_id', c.redeemed_by).maybeSingle()
      if (!prof?.email) continue
      const idemKey = `sub-expiring-${c.redeemed_by}-${daysLeft}`
      const { data: already } = await supabase
        .from('email_send_log').select('id').eq('message_id', idemKey).limit(1).maybeSingle()
      if (already) continue
      const res = await invoke(supabase, 'send-transactional-email', {
        templateName: 'subscription-expiring',
        recipientEmail: prof.email,
        idempotencyKey: idemKey,
        templateData: {
          recipientName: prof.full_name,
          daysLeft,
          expiryDateLabel: format(expiry, 'MMM d, yyyy'),
          subscribeUrl: `${SITE}/dashboard/subscribe`,
        },
      })
      if (res.ok) sent.subscriptionExpiring++
    }
  } catch (e) { sent.errors.push(`subscription-expiring: ${String(e)}`) }

  // ---------- 3. MISSED DIGEST (no login 14+ days) ----------
  try {
    const fourteenAgo = new Date(Date.now() - 14 * 86400000)
    // gather candidate users via paginated admin listUsers
    const candidates: Array<{ id: string }> = []
    let page = 1
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
      if (error) throw error
      for (const u of data.users || []) {
        const last = u.last_sign_in_at ? new Date(u.last_sign_in_at) : null
        if (last && last < fourteenAgo) candidates.push({ id: u.id })
      }
      if (!data || data.users.length < 200) break
      page++
      if (page > 20) break // safety
    }

    // Precompute shared digest payload (last 14d items)
    const since = fourteenAgo.toISOString()
    const [{ data: newMentors }, { data: workshops }, { data: courses }] = await Promise.all([
      supabase
        .from('mentor_details')
        .select('user_id, profiles:profiles!inner(full_name, country)')
        .eq('approval_status', 'approved')
        .gte('updated_at', since)
        .limit(5),
      supabase
        .from('workshops_sessions')
        .select('title, starts_at, location, visibility')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(5),
      supabase
        .from('courses')
        .select('title, audience, created_at')
        .eq('published', true)
        .gte('created_at', since)
        .limit(5),
    ])

    for (const u of candidates) {
      const { data: prof } = await supabase
        .from('profiles').select('full_name, email, country').eq('user_id', u.id).maybeSingle()
      if (!prof?.email) continue
      // skip if digest already sent in last 14 days
      const { data: recent } = await supabase
        .from('email_send_log')
        .select('id')
        .eq('template_name', 'missed-digest')
        .eq('recipient_email', prof.email)
        .gte('created_at', since)
        .limit(1)
        .maybeSingle()
      if (recent) continue

      // filter mentors by country when known
      const mentorItems = (newMentors || [])
        .filter((m: any) => !prof.country || !m.profiles?.country || m.profiles.country === prof.country)
        .slice(0, 3)
        .map((m: any) => ({ label: m.profiles?.full_name || 'New mentor', detail: m.profiles?.country }))

      const { data: rolesRow } = await supabase
        .from('user_roles').select('role').eq('user_id', u.id)
      const userRoles = (rolesRow || []).map((r: any) => r.role)
      const workshopItems = (workshops || [])
        .filter((w: any) =>
          w.visibility === 'all' ||
          (w.visibility === 'mentor' && userRoles.includes('mentor')) ||
          (w.visibility === 'mentee' && userRoles.includes('mentee')),
        )
        .slice(0, 3)
        .map((w: any) => ({ label: w.title, detail: format(new Date(w.starts_at), 'MMM d') }))
      const courseItems = (courses || [])
        .filter((c: any) =>
          c.audience === 'both' ||
          (c.audience === 'mentor' && userRoles.includes('mentor')) ||
          (c.audience === 'mentee' && userRoles.includes('mentee')),
        )
        .slice(0, 3)
        .map((c: any) => ({ label: c.title }))

      if (mentorItems.length + workshopItems.length + courseItems.length === 0) continue

      const idemKey = `missed-digest-${u.id}-${format(new Date(), 'yyyy-MM-dd')}`
      const res = await invoke(supabase, 'send-transactional-email', {
        templateName: 'missed-digest',
        recipientEmail: prof.email,
        idempotencyKey: idemKey,
        templateData: {
          recipientName: prof.full_name,
          newMentors: mentorItems,
          upcomingWorkshops: workshopItems,
          newCourses: courseItems,
          dashboardUrl: `${SITE}/dashboard`,
        },
      })
      if (res.ok) sent.missedDigest++
    }
  } catch (e) { sent.errors.push(`missed-digest: ${String(e)}`) }

  return json(sent, 200)

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

async function invoke(supabase: any, name: string, body: unknown) {
  try {
    const { error } = await supabase.functions.invoke(name, { body })
    return { ok: !error }
  } catch {
    return { ok: false }
  }
}