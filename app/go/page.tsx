'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { decodeConfig, BridgeConfig } from '@/lib/config'
import { initPixel, track, waitForBrowserEvent } from '@/lib/pixel'
import { pixelsFor } from '@/lib/linked'

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : undefined
}

function getConfigFromEnv(): BridgeConfig | null {
  const pixelId = process.env.NEXT_PUBLIC_PIXEL_ID
  const stripeLink = process.env.NEXT_PUBLIC_STRIPE_LINK
  if (!pixelId || !stripeLink) return null
  return {
    p: pixelId,
    k: '',
    s: stripeLink,
    n: process.env.NEXT_PUBLIC_PRODUCT_NAME || '',
    v: process.env.NEXT_PUBLIC_PRODUCT_PRICE || '0',
    c: process.env.NEXT_PUBLIC_CURRENCY || 'EUR',
    t: process.env.NEXT_PUBLIC_SUCCESS_TITLE || '¡Gracias por tu compra!',
    m: process.env.NEXT_PUBLIC_SUCCESS_MESSAGE || '',
  }
}

// La página de origen manda su _fbp y _fbc (?fbp=&fbc=) para que el navegador siga siendo la misma persona para Meta
function adoptFbCookies(params: URLSearchParams) {
  const maxAge = 90 * 24 * 60 * 60
  ;(['fbp', 'fbc'] as const).forEach(name => {
    const value = params.get(name)
    if (value && /^fb\.\d\.\d+\./.test(value) && !getCookie(`_${name}`)) {
      document.cookie = `_${name}=${value}; max-age=${maxAge}; path=/; SameSite=Lax`
    }
  })
}

// fbc debe ir con formato fb.1.<ms>.<fbclid>; el fbclid suelto Meta lo marca como inválido
function getFbc(): string | undefined {
  const cookie = getCookie('_fbc')
  if (cookie) return cookie
  const fbclid = new URLSearchParams(window.location.search).get('fbclid')
  return fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined
}

async function sendServerEvent(pixelId: string, token: string, config: BridgeConfig, event: string, eventId: string) {
  try {
    // keepalive: la petición sigue aunque el navegador ya se fue a Stripe
    await fetch('/api/track', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pixelId,
        token,
        event,
        eventId,
        value: parseFloat(config.v) || 0,
        currency: config.c || 'EUR',
        eventSourceUrl: window.location.href,
        fbp: getCookie('_fbp'),
        fbc: getFbc(),
      }),
    })
  } catch {
    // silent fail
  }
}

// Pasa las UTM del anuncio al link de Stripe para ver en Stripe de qué campaña vino cada venta.
// Stripe solo guarda las 5 estándar: el conjunto y el anuncio van en utm_term y utm_content si no vienen.
function stripeUrlWithUtm(stripeLink: string): string {
  try {
    const from = new URLSearchParams(window.location.search)
    const url = new URL(stripeLink)
    const utm: Record<string, string | null> = {
      utm_source: from.get('utm_source'),
      utm_medium: from.get('utm_medium'),
      utm_campaign: from.get('utm_campaign'),
      utm_content: from.get('utm_content') || from.get('utm_ad'),
      utm_term: from.get('utm_term') || from.get('utm_adset'),
    }
    Object.entries(utm).forEach(([k, v]) => { if (v) url.searchParams.set(k, v) })
    return url.toString()
  } catch {
    return stripeLink
  }
}

function GoContent() {
  const params = useSearchParams()

  useEffect(() => {
    // Un link generado (?c=...) tiene prioridad sobre el producto por defecto de las variables de entorno
    const encoded = params.get('c')
    const config = (encoded && decodeConfig(encoded)) || getConfigFromEnv()

    if (!config?.s) { window.location.href = '/'; return }

    const eventId = crypto.randomUUID()

    if (!config.p) {
      setTimeout(() => { window.location.href = stripeUrlWithUtm(config.s) }, 200)
      return
    }

    adoptFbCookies(new URLSearchParams(window.location.search))
    const pixels = pixelsFor(config.p, config.x)
    initPixel(pixels)
    // fbq('track') sale a todos los pixeles inicializados, con el mismo eventID que el servidor para deduplicar
    track('InitiateCheckout', { value: parseFloat(config.v) || 0, currency: config.c || 'EUR' }, eventId)
    const server = Promise.all(pixels.map(id =>
      sendServerEvent(id, id === config.p ? config.k : '', config, 'InitiateCheckout', eventId)))

    // Redirige cuando salieron los eventos (navegador y servidor), con un tope para no dejar esperando al cliente
    let done = false
    const go = () => { if (!done) { done = true; window.location.href = stripeUrlWithUtm(config.s) } }
    Promise.all([server, waitForBrowserEvent('InitiateCheckout', pixels, 2000)]).then(go)
    setTimeout(go, 2000)
  }, [params])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 font-medium text-sm">Preparando tu checkout...</p>
    </div>
  )
}

export default function GoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <GoContent />
    </Suspense>
  )
}
