import { createClient } from "npm:@supabase/supabase-js@2.39.3"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const WHEREBY_KEY  = Deno.env.get('WHEREBY_KEY') || ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Content-Type': 'application/json',
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  // DELETE — terminar una sala antigua
  if (req.method === 'DELETE') {
    try {
      const { meetingId } = await req.json()
      if (!meetingId) return new Response(JSON.stringify({ error: 'meetingId required' }), { status: 400, headers: CORS })
      const res = await fetch(`https://api.whereby.dev/v1/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${WHEREBY_KEY}` },
      })
      return new Response(JSON.stringify({ success: res.ok }), { headers: CORS })
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: CORS })
    }
  }

  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS })

  try {
    const body = await req.json().catch(() => ({}))
    const { sessionId, role } = body  // role: 'host' | 'guest'

    // Identificar al usuario por su JWT
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await sb.auth.getUser(token)
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS })

    // Resolver la sesión: si viene sessionId úsalo; si no, buscar próxima del user
    let session: any = null
    if (sessionId) {
      const { data } = await sb.from('sessions')
        .select('id, patient_id, psychologist_id, fecha, whereby_host_url, whereby_guest_url, whereby_meeting_id')
        .eq('id', sessionId)
        .maybeSingle()
      session = data
    } else {
      // Buscar la próxima sesión programada o en curso del user
      const isPsy = role === 'host'
      const col = isPsy ? 'psychologist_id' : 'patient_id'
      const { data } = await sb.from('sessions')
        .select('id, patient_id, psychologist_id, fecha, whereby_host_url, whereby_guest_url, whereby_meeting_id')
        .eq(col, user.id)
        .in('status', ['programada', 'en_curso'])
        .order('fecha', { ascending: true })
        .limit(1)
        .maybeSingle()
      session = data
    }

    if (!session) {
      return new Response(JSON.stringify({ error: 'No hay sesión activa', waiting: true }), { status: 200, headers: CORS })
    }

    // Verificar que el user es parte de la sesión
    if (user.id !== session.patient_id && user.id !== session.psychologist_id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: CORS })
    }

    // Si la sesión ya tiene URLs, devolverlas
    if (session.whereby_host_url && session.whereby_guest_url) {
      const url = role === 'host' ? session.whereby_host_url : session.whereby_guest_url
      return new Response(JSON.stringify({
        roomUrl: url,
        hostRoomUrl: session.whereby_host_url,
        guestRoomUrl: session.whereby_guest_url,
        meetingId: session.whereby_meeting_id,
        sessionId: session.id,
        existing: true,
      }), { headers: CORS })
    }

    // Solo el host (psicóloga) puede crear la sala. El paciente espera.
    if (role !== 'host') {
      return new Response(JSON.stringify({ waiting: true, message: 'Esperando que la psicóloga inicie la sesión' }), { status: 200, headers: CORS })
    }

    // Crear sala en Whereby
    const endDate = new Date(Date.now() + 70 * 60 * 1000).toISOString()
    const wRes = await fetch('https://api.whereby.dev/v1/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHEREBY_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endDate, fields: ['hostRoomUrl'] }),
    })
    const wText = await wRes.text()
    if (!wRes.ok) {
      return new Response(JSON.stringify({ error: 'Whereby error: ' + wText }), { status: 500, headers: CORS })
    }
    const wData = JSON.parse(wText)
    const hostUrl = wData.hostRoomUrl
    const guestUrl = wData.roomUrl
    const meetingId = wData.meetingId

    // Guardar en BD
    const { error: updErr } = await sb.from('sessions').update({
      whereby_host_url: hostUrl,
      whereby_guest_url: guestUrl,
      whereby_meeting_id: meetingId,
      status: 'en_curso',
    }).eq('id', session.id)
    if (updErr) {
      console.error('Update session failed:', updErr.message)
      return new Response(JSON.stringify({ error: 'DB update failed: ' + updErr.message }), { status: 500, headers: CORS })
    }

    return new Response(JSON.stringify({
      roomUrl: hostUrl,
      hostRoomUrl: hostUrl,
      guestRoomUrl: guestUrl,
      meetingId,
      sessionId: session.id,
      created: true,
    }), { headers: CORS })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: CORS })
  }
})
