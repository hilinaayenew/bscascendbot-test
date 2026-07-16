/**
 * Purpose: Hourly cron — sends workshop reminders 1 day and 1 hour before a workshop.
 * Audience: all users whose roles match workshop.visibility (all/mentor/mentee).
 * Idempotency: message_id = workshop-reminder-{workshop_id}-{window}-{user_id} where window=1d|1h.
 * Auth: service_role only.
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import { format } from 'npm:date-fns@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE = 'https://bscascend.lovable.app'

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
  let sent = 0
  const errors: string[] = []

  const now = new Date()
  // Define two windows: 1d = workshops starting between (24h-30m) and (24h+30m); 1h = (1h-30m) to (1h+30m)
  const windows: Array<{ label: string; whenLabel: (d: Date) => string; start: Date; end: Date }> = [
    {
      label: '1d',
      whenLabel: (d) => format(d, "EEE, MMM d 'at' HH:mm 'UTC'"),
      start: new Date(now.getTime() + (24 * 60 - 30) * 60000),
      end: new Date(now.getTime() + (24 * 60 + 30) * 60000),
    },
    {
      label: '1h',
      whenLabel: (d) => format(d, "HH:mm 'UTC'"),
      start: new Date(now.getTime() + (60 - 30) * 60000),
      end: new Date(now.getTime() + (60 + 30) * 60000),
    },
  ]

  for (const w of windows) {
    try {
      const { data: workshops } = await supabase
        .from('workshops_sessions')
        .select('id, title, starts_at, location, link, visibility')
        .gte('starts_at', w.start.toISOString())
        .lt('starts_at', w.end.toISOString())

      for (const ws of workshops || []) {
        // Find users matching visibility
        let userIds: string[] = []
        if (ws.visibility === 'mentor' || ws.visibility === 'mentee') {
          const { data: rs } = await supabase.from('user_roles').select('user_id').eq('role', ws.visibility)
          userIds = (rs || []).map((r: any) => r.user_id)
        } else {
          const { data: rs } = await supabase.from('user_roles').select('user_id').in('role', ['mentor', 'mentee'])
          userIds = Array.from(new Set((rs || []).map((r: any) => r.user_id)))
        }
        if (userIds.length === 0) continue

        // Fetch profiles in chunks
        const chunkSize = 100
        for (let i = 0; i < userIds.length; i += chunkSize) {
          const chunk = userIds.slice(i, i + chunkSize)
          const { data: profs } = await supabase
            .from('profiles')
            .select('user_id, full_name, email')
            .in('user_id', chunk)
          for (const p of profs || []) {
            if (!p.email) continue
            const idemKey = `workshop-reminder-${ws.id}-${w.label}-${p.user_id}`
            const { data: already } = await supabase
              .from('email_send_log').select('id').eq('message_id', idemKey).limit(1).maybeSingle()
            if (already) continue
            const res = await invoke(supabase, 'send-transactional-email', {
              templateName: 'workshop-reminder',
              recipientEmail: p.email,
              idempotencyKey: idemKey,
              templateData: {
                recipientName: p.full_name,
                workshopTitle: ws.title,
                whenLabel: w.whenLabel(new Date(ws.starts_at)),
                windowLabel: w.label === '1d' ? 'tomorrow' : 'in 1 hour',
                location: ws.location || undefined,
                joinUrl: ws.link || `${SITE}/dashboard`,
              },
            })
            if (res.ok) sent++
          }
        }
      }
    } catch (e) { errors.push(`${w.label}: ${String(e)}`) }
  }

  return json({ sent, errors }, 200)

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

async function invoke(supabase: any, name: string, body: unknown) {
  try {
    const { error } = await supabase.functions.invoke(name, { body })
    return { ok: !error }
  } catch { return { ok: false } }
}