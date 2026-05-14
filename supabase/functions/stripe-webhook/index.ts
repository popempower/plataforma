import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY') || ''
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const stripe = new Stripe(STRIPE_SECRET, {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})
const cryptoProvider = Stripe.createSubtleCryptoProvider()

const sb = createClient(SUPABASE_URL, SERVICE_KEY)

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('Missing signature', { status: 400 })

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body, signature, WEBHOOK_SECRET, undefined, cryptoProvider
    )
  } catch (e) {
    return new Response(`Webhook signature failed: ${e.message}`, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response(JSON.stringify({ ignored: event.type }), { status: 200 })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const patientId = session.client_reference_id
  if (!patientId) {
    return new Response('Missing client_reference_id', { status: 400 })
  }

  // Buscar el paciente para saber qué plan compró
  const { data: patient, error: pErr } = await sb
    .from('patients')
    .select('id, categoria, plan_elegido')
    .eq('id', patientId)
    .single()
  if (pErr || !patient) {
    return new Response(`Patient not found: ${pErr?.message}`, { status: 404 })
  }

  const categoria = patient.categoria as string
  const plan = patient.plan_elegido as string
  const sesiones = plan === 'mensual' ? 4 : 1
  const importe = (session.amount_total || 0) / 100

  // Crear registro en compras
  const { error: cErr } = await sb.from('compras').insert({
    patient_id: patientId,
    stripe_session_id: session.id,
    stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : null,
    categoria,
    plan,
    sesiones,
    importe,
    estado: 'pagada',
    paid_at: new Date().toISOString(),
  })
  if (cErr) {
    return new Response(`Insert compra failed: ${cErr.message}`, { status: 500 })
  }

  // Actualizar paciente: pagado_sin_asignar
  const { error: uErr } = await sb
    .from('patients')
    .update({ status: 'pagado_sin_asignar' })
    .eq('id', patientId)
  if (uErr) {
    return new Response(`Update patient failed: ${uErr.message}`, { status: 500 })
  }

  return new Response(JSON.stringify({ success: true, patientId, sesiones, importe }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
