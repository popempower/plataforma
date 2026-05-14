import { createClient } from "npm:@supabase/supabase-js@2.39.3"

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const sb = createClient(SUPABASE_URL, SERVICE_KEY)

// Verificar firma del webhook de Stripe usando Web Crypto API
async function verifyStripeSignature(body: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')))
  const t = parts.t
  const v1 = parts.v1
  if (!t || !v1) return false

  const signedPayload = `${t}.${body}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return expected === v1
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('Missing signature', { status: 400 })

  const body = await req.text()

  const valid = await verifyStripeSignature(body, signature, WEBHOOK_SECRET)
  if (!valid) return new Response('Invalid signature', { status: 400 })

  const event = JSON.parse(body)

  if (event.type !== 'checkout.session.completed') {
    return new Response(JSON.stringify({ ignored: event.type }), { status: 200 })
  }

  const session = event.data.object
  const patientId = session.client_reference_id
  if (!patientId) return new Response('Missing client_reference_id', { status: 400 })

  const { data: patient, error: pErr } = await sb
    .from('patients')
    .select('id, categoria, plan_elegido')
    .eq('id', patientId)
    .single()
  if (pErr || !patient) {
    return new Response(`Patient not found: ${pErr?.message}`, { status: 404 })
  }

  const categoria = patient.categoria
  const plan = patient.plan_elegido
  const sesiones = plan === 'mensual' ? 4 : 1
  const importe = (session.amount_total || 0) / 100

  const { error: cErr } = await sb.from('compras').upsert({
    patient_id: patientId,
    stripe_session_id: session.id,
    stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : null,
    categoria,
    plan,
    sesiones,
    importe,
    estado: 'pagada',
    paid_at: new Date().toISOString(),
  }, { onConflict: 'stripe_session_id' })
  if (cErr) return new Response(`Insert compra failed: ${cErr.message}`, { status: 500 })

  const { error: uErr } = await sb
    .from('patients')
    .update({ status: 'pagado_sin_asignar' })
    .eq('id', patientId)
  if (uErr) return new Response(`Update patient failed: ${uErr.message}`, { status: 500 })

  return new Response(JSON.stringify({ success: true, patientId, sesiones, importe }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
