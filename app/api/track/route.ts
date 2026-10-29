import { NextRequest, NextResponse } from 'next/server'

interface TrackBody {
  pixelId: string
  token: string
  event: string
  eventId: string
  testEventCode?: string
  value?: number
  currency?: string
  eventSourceUrl?: string
  fbp?: string
  fbc?: string
  utm?: Record<string, string>
}

const GRAPH_VERSION = 'v24.0'

// Permite que las páginas del cliente (ej. la página de gracias por GTM) llamen a este endpoint
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS })
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

async function sendToMeta(pixelId: string, requestBody: Record<string, unknown>) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })
  return { ok: res.ok, status: res.status, result: await res.json() }
}

export async function POST(request: NextRequest) {
  try {
    const body: TrackBody = await request.json()
    const { pixelId, token, event, eventId, testEventCode, value, currency, eventSourceUrl, fbp, fbc, utm } = body

    const resolvedPixelId = pixelId || process.env.NEXT_PUBLIC_PIXEL_ID
    // Cada pixel tiene su token en META_TOKEN_<pixelId>; META_TOKEN queda como respaldo
    const resolvedToken = token || process.env[`META_TOKEN_${resolvedPixelId}`] || process.env.META_TOKEN
    if (!resolvedPixelId || !resolvedToken || !event) {
      console.error('[track] faltan datos', { pixelId: resolvedPixelId, event, hasToken: !!resolvedToken })
      return json({ error: 'Missing fields' }, 400)
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      undefined
    const userAgent = request.headers.get('user-agent') || undefined

    const userData: Record<string, string> = {}
    if (ip) userData.client_ip_address = ip
    if (userAgent) userData.client_user_agent = userAgent
    if (fbp) userData.fbp = fbp
    if (fbc) userData.fbc = fbc

    const eventPayload: Record<string, unknown> = {
      event_name: event,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      user_data: userData,
    }
    const sourceUrl = eventSourceUrl || request.headers.get('referer')
    if (sourceUrl) eventPayload.event_source_url = sourceUrl

    if (value !== undefined) {
      eventPayload.custom_data = { value, currency: currency || 'EUR', ...(utm || {}) }
    }

    const requestBody: Record<string, unknown> = {
      data: [eventPayload],
      access_token: resolvedToken,
    }
    if (testEventCode) requestBody.test_event_code = testEventCode

    // Un reintento si Meta falla por red o error 5xx
    let response
    try {
      response = await sendToMeta(resolvedPixelId, requestBody)
      if (response.status >= 500) throw new Error(`Meta ${response.status}`)
    } catch {
      response = await sendToMeta(resolvedPixelId, requestBody)
    }

    if (!response.ok) {
      console.error('[track] Meta rechazó el evento', { pixelId: resolvedPixelId, event, result: response.result })
    }
    return json(response.result, response.ok ? 200 : 502)
  } catch (err) {
    console.error('[track] error', err)
    return json({ error: 'Server error' }, 500)
  }
}
