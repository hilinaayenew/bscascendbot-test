import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Validate caller's JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Create client with caller's token to verify identity
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const token = authHeader.replace('Bearer ', '')
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token)
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userId = claimsData.claims.sub as string

  // Parse request
  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { action } = body
  if (!action) {
    return new Response(JSON.stringify({ error: 'action is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Service role client for privileged operations
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

  // For admin actions, verify admin role
  const adminActions = ['mentor-approved', 'mentor-rejected', 'account-deleted']
  if (adminActions.includes(action)) {
    const { data: isAdmin } = await serviceClient.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  // For self-deletion notice, verify user is deleting themselves
  if (action === 'admin-deletion-notice-self') {
    // This is the self-deletion admin notification — userId must match the body
    if (body.userId && body.userId !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  // Now invoke send-transactional-email server-side with service role key
  let emailBody: any = null

  // Helper: resolve a user's email from their user_id using service role (bypasses column RLS).
  // Never trust caller-supplied recipient emails for admin-targeted templates.
  const resolveProfile = async (uid: string): Promise<{ email: string | null; full_name: string | null }> => {
    const { data } = await serviceClient
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', uid)
      .maybeSingle()
    return { email: (data as any)?.email ?? null, full_name: (data as any)?.full_name ?? null }
  }

  switch (action) {
    case 'mentor-approved':
      if (!body.mentorUserId) {
        return new Response(JSON.stringify({ error: 'mentorUserId required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      {
        const p = await resolveProfile(body.mentorUserId)
        if (!p.email) {
          return new Response(JSON.stringify({ error: 'Mentor email not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      emailBody = {
        templateName: 'mentor-approved',
        recipientEmail: p.email,
        idempotencyKey: `mentor-approved-${body.mentorUserId}`,
        templateData: { name: (p.full_name || '').split(' ')[0] || '' },
      }
      }
      break

    case 'mentor-rejected':
      if (!body.mentorUserId) {
        return new Response(JSON.stringify({ error: 'mentorUserId required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      {
        const p = await resolveProfile(body.mentorUserId)
        if (!p.email) {
          return new Response(JSON.stringify({ error: 'Mentor email not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      emailBody = {
        templateName: 'mentor-rejected',
        recipientEmail: p.email,
        idempotencyKey: `mentor-rejected-${body.mentorUserId}`,
        templateData: { name: (p.full_name || '').split(' ')[0] || '' },
      }
      }
      break

    case 'account-deleted':
      if (!body.targetUserId) {
        return new Response(JSON.stringify({ error: 'targetUserId required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      {
        const p = await resolveProfile(body.targetUserId)
        if (!p.email) {
          return new Response(JSON.stringify({ error: 'Target user email not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      emailBody = {
        templateName: 'account-deleted',
        recipientEmail: p.email,
        idempotencyKey: `account-deleted-${body.targetUserId}`,
        templateData: { name: (p.full_name || '').split(' ')[0] || '' },
      }
      }
      break

    case 'admin-deletion-notice-self':
      {
        const [p, { data: rolesData }] = await Promise.all([
          resolveProfile(userId),
          serviceClient.from('user_roles').select('role').eq('user_id', userId)
        ])
        const deletedEmail = p.email || ''
        const deletedRole = rolesData ? rolesData.map((r: any) => r.role).join(', ') : ''

        emailBody = {
          templateName: 'admin-deletion-notice',
          recipientEmail: 'mentorship@becauseshecan.tech',
          idempotencyKey: `admin-deletion-notice-${userId}`,
          templateData: {
            deletedEmail: deletedEmail,
            deletedRole: deletedRole,
            deletedAt: new Date().toISOString(),
          },
        }
      }
      break

    case 'account-self-deleted':
      {
        // Resolve recipient from caller's own profile — never trust body.recipientEmail.
        const p = await resolveProfile(userId)
        if (!p.email) {
          return new Response(JSON.stringify({ error: 'Caller email not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      emailBody = {
        templateName: 'account-self-deleted',
        recipientEmail: p.email,
        idempotencyKey: `account-self-deleted-${userId}`,
        templateData: { name: (p.full_name || '').split(' ')[0] || '' },
      }
      }
      break

    default:
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
  }

  // Invoke send-transactional-email with service role key
  const { data, error } = await serviceClient.functions.invoke(
    'send-transactional-email',
    { body: emailBody }
  )

  if (error) {
    console.error('Email send failed', { action, error })
    return new Response(
      JSON.stringify({ error: 'Failed to send email', detail: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  console.log('Email action processed', { action, recipient: emailBody.recipientEmail })
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})