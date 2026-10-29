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

// Espera a que el navegador haya enviado el evento a cada pixel (fbevents primero carga la config de cada uno),
// con un tope por si un bloqueador de anuncios lo impide
export function waitForBrowserEvent(event: string, pixelIds: string[], timeoutMs: number): Promise<void> {
  return new Promise(resolve => {
    const start = Date.now()
    const check = () => {
      const hits = performance.getEntriesByType('resource').map(e => e.name).filter(n => n.includes('facebook.com/tr'))
      const sent = pixelIds.every(id => hits.some(n => n.includes(`id=${id}`) && n.includes(`ev=${event}`)))
      // Si fbevents mandó por POST la URL no trae id ni ev: basta con ver PageView + evento por cada pixel
      if (sent || hits.length >= pixelIds.length * 2 || Date.now() - start >= timeoutMs) resolve()
      else setTimeout(check, 50)
    }
    check()
  })
}
