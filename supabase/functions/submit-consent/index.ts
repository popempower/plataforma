import { createClient } from "npm:@supabase/supabase-js@2.39.3"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY)

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS })

  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userErr } = await sb.auth.getUser(token)
  if (userErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS })

  const body = await req.json()
  const { code, firma_base64, doc_html, doc_version } = body || {}
  if (!code || !firma_base64 || !doc_html) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: CORS })
  }

  // 1. Verificar OTP
  const codeHash = await sha256(code + user.id)
  const { data: otps, error: otpErr } = await sb.from('consent_otps')
    .select('id, code_hash, attempts, used, expires_at')
    .eq('patient_id', user.id)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
  if (otpErr) return new Response(JSON.stringify({ error: 'OTP query failed: ' + otpErr.message }), { status: 500, headers: CORS })
  const otp = (otps || [])[0]
  if (!otp) return new Response(JSON.stringify({ error: 'No active code. Request a new one.' }), { status: 400, headers: CORS })
  if (new Date(otp.expires_at).getTime() < Date.now()) {
    return new Response(JSON.stringify({ error: 'Code expired' }), { status: 400, headers: CORS })
  }
  if (otp.attempts >= 5) {
    return new Response(JSON.stringify({ error: 'Too many attempts' }), { status: 429, headers: CORS })
  }
  if (otp.code_hash !== codeHash) {
    await sb.from('consent_otps').update({ attempts: otp.attempts + 1 }).eq('id', otp.id)
    return new Response(JSON.stringify({ error: 'Invalid code' }), { status: 400, headers: CORS })
  }
  // Marcar OTP como usado
  await sb.from('consent_otps').update({ used: true }).eq('id', otp.id)

  // 2. Calcular hash del documento + firma (vinculación inmutable)
  const docHash = await sha256(doc_html + '|' + firma_base64)

  // 3. Trazabilidad
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || ''
  const ua = req.headers.get('user-agent') || ''

  // 4. Guardar consent en BD
  const { data: inserted, error: insErr } = await sb.from('consents').insert({
    patient_id: user.id,
    doc_version: doc_version || '1.0',
    doc_html,
    doc_hash: docHash,
    firma_base64,
    email_verified: true,
    ip_address: ip,
    user_agent: ua,
  }).select('id, firmado_at').single()

  if (insErr) {
    // Si ya existe consent para esa versión (UNIQUE), devolver el existente
    if (insErr.code === '23505') {
      return new Response(JSON.stringify({ success: true, already_signed: true }), { status: 200, headers: CORS })
    }
    return new Response(JSON.stringify({ error: 'Insert consent failed: ' + insErr.message }), { status: 500, headers: CORS })
  }

  return new Response(JSON.stringify({
    success: true,
    consent_id: inserted.id,
    firmado_at: inserted.firmado_at,
    doc_hash: docHash,
  }), { status: 200, headers: CORS })
})
