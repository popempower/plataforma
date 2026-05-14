import { createClient } from "npm:@supabase/supabase-js@2.39.3"

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL') || ''
const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const RESEND_KEY    = Deno.env.get('RESEND_API_KEY') || ''
const FROM_EMAIL    = 'POP Empower <onboarding@resend.dev>'

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

  // Identificar al usuario por su JWT
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userErr } = await sb.auth.getUser(token)
  if (userErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS })

  // Datos del paciente
  const { data: patient, error: pErr } = await sb.from('patients')
    .select('id, nombre, email')
    .eq('id', user.id)
    .maybeSingle()
  if (pErr || !patient) return new Response(JSON.stringify({ error: 'Patient not found' }), { status: 404, headers: CORS })

  // Generar código de 6 dígitos
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const codeHash = await sha256(code + patient.id)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  // Invalidar OTPs anteriores no usados de este paciente
  await sb.from('consent_otps')
    .update({ used: true })
    .eq('patient_id', patient.id)
    .eq('used', false)

  // Guardar nuevo OTP
  const { error: insErr } = await sb.from('consent_otps').insert({
    patient_id: patient.id,
    email: patient.email,
    code_hash: codeHash,
    expires_at: expiresAt,
  })
  if (insErr) return new Response(JSON.stringify({ error: 'DB insert failed: ' + insErr.message }), { status: 500, headers: CORS })

  // Enviar email con Resend
  const emailBody = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111827">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="color:#20dc95;font-size:24px;margin:0">POP Empower</h1>
      </div>
      <h2 style="font-size:18px;color:#111827;margin-bottom:12px">Código de verificación</h2>
      <p style="color:#6b7280;font-size:14px;line-height:1.6">
        Hola ${patient.nombre || ''},<br><br>
        Estás a punto de firmar tu consentimiento informado en POP Empower.
        Para confirmar que eres tú, introduce este código en la plataforma:
      </p>
      <div style="background:#f0fdf8;border:1px solid #d1fae5;border-radius:12px;padding:24px;margin:24px 0;text-align:center">
        <div style="font-size:36px;font-weight:800;color:#065f46;letter-spacing:8px;font-family:monospace">${code}</div>
      </div>
      <p style="color:#9ca3af;font-size:12px;line-height:1.6">
        Este código caduca en 10 minutos. Si no has solicitado este código, ignora este email.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:11px;text-align:center">
        PO PSYCHOLOGY, S.L. · CIF B88350368<br>
        C/ Doctor Fleming, 46 · 28036 Madrid
      </p>
    </div>
  `

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: patient.email,
      subject: 'Código de verificación · POP Empower',
      html: emailBody,
    }),
  })

  if (!resendRes.ok) {
    const errText = await resendRes.text()
    return new Response(JSON.stringify({ error: 'Resend failed: ' + errText }), { status: 500, headers: CORS })
  }

  return new Response(JSON.stringify({ success: true, email: patient.email }), { status: 200, headers: CORS })
})
