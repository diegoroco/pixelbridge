import { NextRequest, NextResponse } from 'next/server'

interface TrackBody {
  pixelId: string
  token: string
  event: string
  eventId: string
  value?: number
  currency?: string
  fbp?: string
  fbc?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: TrackBody = await request.json()
    const { pixelId, token, event, eventId, value, currency, fbp, fbc } = body

    const resolvedToken = token || process.env.META_TOKEN
    if (!pixelId || !resolvedToken || !event) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
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

    if (event === 'Purchase' && value !== undefined) {
      eventPayload.custom_data = { value, currency: currency || 'EUR' }
    }

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [eventPayload],
          access_token: resolvedToken,
        }),
      }
    )

    const result = await res.json()
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
