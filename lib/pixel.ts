declare global {
  interface Window {
    fbq: any
    _fbq: any
  }
}

export function initPixel(pixelId: string): void {
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

  window.fbq('init', pixelId)
  window.fbq('track', 'PageView')
}

export function track(event: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.fbq) return
  if (params) {
    window.fbq('track', event, params)
  } else {
    window.fbq('track', event)
  }
}
