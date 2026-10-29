declare global {
  interface Window {
    fbq: any
    _fbq: any
  }
}

export function initPixel(pixelIds: string[]): void {
  if (typeof window === 'undefined') return

  if (!window.fbq) {
    const fbq: any = function (...args: any[]) {
      if (fbq.callMethod) {
        fbq.callMethod(...args)
      } else {
        fbq.queue.push(args)
      }
    }
    fbq.push = fbq
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.queue = []
    window.fbq = fbq
    if (!window._fbq) window._fbq = fbq

    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
  }

  pixelIds.forEach(id => window.fbq('init', id))
  window.fbq('track', 'PageView')
}

export function track(event: string, params?: Record<string, unknown>, eventId?: string): void {
  if (typeof window === 'undefined' || !window.fbq) return
  const options = eventId ? { eventID: eventId } : undefined
  if (params) {
    window.fbq('track', event, params, options)
  } else {
    window.fbq('track', event, {}, options)
  }
}

// Espera a que cargue fbevents.js (callMethod existe) para que el evento del navegador salga antes de redirigir
export function waitForPixel(timeoutMs: number): Promise<void> {
  return new Promise(resolve => {
    const start = Date.now()
    const check = () => {
      if (window.fbq?.callMethod || Date.now() - start >= timeoutMs) resolve()
      else setTimeout(check, 50)
    }
    check()
  })
}
