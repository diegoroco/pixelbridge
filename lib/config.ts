export interface BridgeConfig {
  p: string  // pixelId
  k: string  // conversions api token
  s: string  // stripeLink
  n: string  // productName
  v: string  // value/price
  c: string  // currency
  t: string  // successTitle
  m: string  // successMessage
  x?: string[]  // pixeles extra
}

export function encodeConfig(config: BridgeConfig): string {
  if (typeof window === 'undefined') return ''
  return btoa(unescape(encodeURIComponent(JSON.stringify(config))))
}

export function decodeConfig(encoded: string): BridgeConfig | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded.replace(/ /g, '+')))))
  } catch {
    return null
  }
}
