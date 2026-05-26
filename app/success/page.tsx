'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { decodeConfig, BridgeConfig } from '@/lib/config'
import { initPixel, track } from '@/lib/pixel'

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : undefined
}

async function sendServerEvent(config: BridgeConfig, eventId: string) {
  if (!config.k) return
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pixelId: config.p,
        token: config.k,
        event: 'Purchase',
        eventId,
        value: parseFloat(config.v) || 0,
        currency: config.c || 'EUR',
        fbp: getCookie('_fbp'),
        fbc: getCookie('_fbc') || undefined,
      }),
    })
  } catch {
    // silent fail
  }
}

function SuccessContent() {
  const params = useSearchParams()
  const [config, setConfig] = useState<BridgeConfig | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const encoded = params.get('c')
    if (!encoded) { setReady(true); return }

    const decoded = decodeConfig(encoded)
    setConfig(decoded)

    if (decoded?.p) {
      const eventId = crypto.randomUUID()
      initPixel(decoded.p)
      setTimeout(() => {
        track('Purchase', {
          value: parseFloat(decoded.v) || 0,
          currency: decoded.c || 'EUR',
        }, eventId)
        sendServerEvent(decoded, eventId)
      }, 300)
    }

    setReady(true)
  }, [params])

  if (!ready) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const price =
    config?.v && config?.c
      ? parseFloat(config.v).toLocaleString('es-ES', {
          style: 'currency',
          currency: config.c,
        })
      : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-12 h-12 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {config?.t || '¡Gracias por tu compra!'}
        </h1>

        <p className="text-gray-500 text-base leading-relaxed">
          {config?.m || 'Tu pedido ha sido procesado correctamente.'}
        </p>

        {(config?.n || price) && (
          <div className="mt-8 bg-white rounded-2xl border border-gray-200 px-6 py-5 inline-block shadow-sm">
            {config?.n && (
              <p className="font-semibold text-gray-900 text-lg">{config.n}</p>
            )}
            {price && <p className="text-gray-500 text-sm mt-1">{price}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
