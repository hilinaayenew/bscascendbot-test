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

  // Verify caller is admin
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

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

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

  // Parse mentor list
  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { mentors } = body
  if (!Array.isArray(mentors) || mentors.length === 0) {
    return new Response(JSON.stringify({ error: 'mentors array is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const results: any[] = []

  for (const mentor of mentors) {
    const { email, full_name, expertise, linkedin_url, phone, country, avatar_url } = mentor
    if (!email || !full_name) {
      results.push({ email, status: 'skipped', reason: 'missing email or name' })
      continue
    }

    try {
      // Create user silently (email_confirm: true meaning they don't need to click a link to verify their email, 
      // but they still need to set a password via the invite link we send later)
      const { data: userData, error: userError } = await serviceClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name, role: 'mentor' },
      })

      if (userError) {
        // If user already exists, just update their profile
        if (userError.message?.includes('already been registered') || userError.message?.includes('User already exists')) {
          results.push({ email, status: 'exists', reason: 'already registered' })
          continue
        }
        results.push({ email, status: 'error', reason: userError.message })
        continue
      }

      const newUserId = userData.user?.id
      if (!newUserId) {
        results.push({ email, status: 'error', reason: 'no user ID returned' })
        continue
      }

      // Update profile with extra data
      await serviceClient
        .from('profiles')
        .update({
          expertise: expertise || [],
          linkedin_url: linkedin_url || null,
          phone: phone || null,
          avatar_url: avatar_url || null,
          country: country || null,
        })
        .eq('user_id', newUserId)

      // Approve mentor
      await serviceClient
        .from('mentor_details')
        .update({ approval_status: 'approved' })
        .eq('user_id', newUserId)

      results.push({ email, status: 'success', userId: newUserId })
    } catch (err: any) {
      results.push({ email, status: 'error', reason: err.message })
    }
  }

  const summary = {
    total: mentors.length,
    success: results.filter(r => r.status === 'success').length,
    exists: results.filter(r => r.status === 'exists').length,
    errors: results.filter(r => r.status === 'error').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    details: results,
  }

  console.log('Import complete', summary)
  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
