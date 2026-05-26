'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { decodeConfig, BridgeConfig } from '@/lib/config'
import { initPixel, track } from '@/lib/pixel'

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : undefined
}

async function sendServerEvent(config: BridgeConfig, event: string, eventId: string) {
  if (!config.k) return
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pixelId: config.p,
        token: config.k,
        event,
        eventId,
        fbp: getCookie('_fbp'),
        fbc: getCookie('_fbc') || new URLSearchParams(window.location.search).get('fbclid') || undefined,
      }),
    })
  } catch {
    // silent fail — browser pixel is the fallback
  }
}

function GoContent() {
  const params = useSearchParams()

  useEffect(() => {
    const encoded = params.get('c')
    if (!encoded) { window.location.href = '/'; return }

    const config = decodeConfig(encoded)
    if (!config?.s) { window.location.href = '/'; return }

    const eventId = crypto.randomUUID()

    if (config.p) {
      initPixel(config.p)
      setTimeout(() => {
        track('InitiateCheckout', undefined, eventId)
        sendServerEvent(config, 'InitiateCheckout', eventId)
        setTimeout(() => { window.location.href = config.s }, 400)
      }, 200)
    } else {
      setTimeout(() => { window.location.href = config.s }, 200)
    }
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
