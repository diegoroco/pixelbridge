'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { decodeConfig } from '@/lib/config'
import { initPixel, track } from '@/lib/pixel'

function GoContent() {
  const params = useSearchParams()

  useEffect(() => {
    const encoded = params.get('c')
    if (!encoded) {
      window.location.href = '/'
      return
    }

    const config = decodeConfig(encoded)
    if (!config?.s) {
      window.location.href = '/'
      return
    }

    if (config.p) {
      initPixel(config.p)
      setTimeout(() => {
        track('InitiateCheckout')
        setTimeout(() => {
          window.location.href = config.s
        }, 300)
      }, 200)
    } else {
      setTimeout(() => {
        window.location.href = config.s
      }, 200)
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
