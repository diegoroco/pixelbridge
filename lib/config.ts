export interface BridgeConfig {
  p: string  // pixelId
  s: string  // stripeLink
  n: string  // productName
  v: string  // value/price
  c: string  // currency
  t: string  // successTitle
  m: string  // successMessage
}

export function encodeConfig(config: BridgeConfig): string {
  if (typeof window === 'undefined') return ''
  return btoa(unescape(encodeURIComponent(JSON.stringify(config))))
}

export function decodeConfig(encoded: string): BridgeConfig | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))))
  } catch {
    return null
  }
}
