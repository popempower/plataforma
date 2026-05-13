import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const key = Deno.env.get('WHEREBY_KEY') || ''

  // DELETE — end a meeting early to stop billing
  if (req.method === 'DELETE') {
    try {
      const { meetingId } = await req.json()
      if (!meetingId) return new Response(JSON.stringify({ error: 'meetingId required' }), { status: 400, headers: CORS })
      const res = await fetch(`https://api.whereby.dev/v1/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${key}` },
      })
      return new Response(JSON.stringify({ success: res.ok, status: res.status }), { headers: CORS })
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS })
    }
  }

  // POST — create a new meeting
  const endDate = new Date(Date.now() + 90 * 60 * 1000).toISOString()
  try {
    const res = await fetch('https://api.whereby.dev/v1/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endDate, fields: ['hostRoomUrl'] }),
    })
    const text = await res.text()
    console.log('Whereby response:', res.status, text)
    const data = JSON.parse(text)
    return new Response(JSON.stringify(data), { headers: CORS })
  } catch (e) {
    console.log('Error:', e.message)
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS })
  }
})
