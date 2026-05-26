'use client'

import { useState, useEffect } from 'react'
import { encodeConfig, BridgeConfig } from '@/lib/config'
import CopyButton from '@/components/CopyButton'

interface FormData {
  pixelId: string
  token: string
  stripeLink: string
  productName: string
  productPrice: string
  currency: string
  successTitle: string
  successMessage: string
}

const defaultForm: FormData = {
  pixelId: '',
  token: '',
  stripeLink: '',
  productName: '',
  productPrice: '',
  currency: 'EUR',
  successTitle: '¡Gracias por tu compra!',
  successMessage: 'Tu pedido ha sido procesado correctamente. Revisa tu email para más detalles.',
}

export default function Home() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(defaultForm)
  const [links, setLinks] = useState<{ go: string; success: string } | null>(null)
  const [origin, setOrigin] = useState('')
  const [testCode, setTestCode] = useState('')
  const [testLink, setTestLink] = useState<'go' | 'success'>('go')
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  async function sendTest() {
    setTestStatus('loading')
    setTestMessage('')
    const event = testLink === 'go' ? 'InitiateCheckout' : 'Purchase'
    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pixelId: '',
          token: '',
          event,
          eventId: crypto.randomUUID(),
          testEventCode: testCode.trim(),
          value: 33,
          currency: 'EUR',
        }),
      })
      const data = await res.json()
      if (data.events_received > 0 || data.fbtrace_id) {
        setTestStatus('ok')
        setTestMessage(`Evento "${event}" enviado. Revisa Meta Events Manager → Eventos de prueba.`)
      } else {
        setTestStatus('error')
        setTestMessage(data.error?.message || JSON.stringify(data))
      }
    } catch {
      setTestStatus('error')
      setTestMessage('Error de conexión')
    }
  }

  function update(key: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function generate() {
    const config: BridgeConfig = {
      p: form.pixelId.trim(),
      k: form.token.trim(),
      s: form.stripeLink.trim(),
      n: form.productName.trim(),
      v: form.productPrice.trim(),
      c: form.currency,
      t: form.successTitle.trim(),
      m: form.successMessage.trim(),
    }
        // Encode kept for reference but short links are used
    encodeConfig(config)
    setLinks({
      go: `${origin}/go`,
      success: `${origin}/success`,
    })
    setStep(4)
  }

  function reset() {
    setStep(1)
    setForm(defaultForm)
    setLinks(null)
  }

  const inputClass =
    'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm'

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="font-semibold text-gray-900">PixelBridge</span>
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            Gratis · Sin registro
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-12">
        {/* Hero */}
        {step <= 3 && (
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Meta Pixel + Stripe
            </h1>
            <p className="text-gray-500 text-base">
              Registra tus ventas en Meta Ads sin código ni mensualidades.
            </p>
          </div>
        )}

        {/* Step card */}
        {step <= 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Step tabs */}
            <div className="flex border-b border-gray-100">
              {[
                { n: 1, label: 'Pixel' },
                { n: 2, label: 'Stripe' },
                { n: 3, label: 'Producto' },
              ].map(({ n, label }) => (
                <div
                  key={n}
                  className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                    step === n
                      ? 'text-violet-600 border-b-2 border-violet-600'
                      : step > n
                      ? 'text-emerald-600'
                      : 'text-gray-400'
                  }`}
                >
                  {step > n ? `✓ ${label}` : `${n}. ${label}`}
                </div>
              ))}
            </div>

            <div className="p-6">
              {/* Step 1: Pixel ID */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                      Tu Pixel ID de Meta
                    </h2>
                    <p className="text-sm text-gray-500">
                      Encuéntralo en{' '}
                      <strong>Meta Business Suite → Events Manager → tu Pixel</strong>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pixel ID
                    </label>
                    <input
                      type="text"
                      value={form.pixelId}
                      onChange={e => update('pixelId', e.target.value)}
                      placeholder="Ej: 1234567890123456"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Token de API de Conversiones
                      </label>
                      <span className="text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full font-medium">
                        Recomendado
                      </span>
                    </div>
                    <input
                      type="password"
                      value={form.token}
                      onChange={e => update('token', e.target.value)}
                      placeholder="EAAxxxxx..."
                      className={inputClass}
                    />
                    <p className="text-xs text-gray-400 mt-1.5">
                      Events Manager → tu Pixel → Configuración → API de Conversiones → Generar token
                    </p>
                  </div>

                  {form.token && (
                    <div className="flex items-start gap-2 bg-violet-50 rounded-lg p-3">
                      <span className="text-violet-500 text-sm mt-0.5">✓</span>
                      <p className="text-xs text-violet-700">
                        Con el token activado, las conversiones se registran desde el servidor.
                        Más preciso y no lo bloquean los ad blockers.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setStep(2)}
                    disabled={!form.pixelId.trim()}
                    className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              )}

              {/* Step 2: Stripe Link */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                      Tu link de pago de Stripe
                    </h2>
                    <p className="text-sm text-gray-500">
                      El link <strong>buy.stripe.com/...</strong> que compartes con tus clientes
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link de Stripe
                    </label>
                    <input
                      type="url"
                      value={form.stripeLink}
                      onChange={e => update('stripeLink', e.target.value)}
                      placeholder="https://buy.stripe.com/..."
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      ← Atrás
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!form.stripeLink.trim()}
                      className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Product details */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                      Detalles del producto
                    </h2>
                    <p className="text-sm text-gray-500">
                      Para registrar el valor de compra en Meta Ads
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del producto
                    </label>
                    <input
                      type="text"
                      value={form.productName}
                      onChange={e => update('productName', e.target.value)}
                      placeholder="Ej: Curso de Marketing Digital"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio
                      </label>
                      <input
                        type="number"
                        value={form.productPrice}
                        onChange={e => update('productPrice', e.target.value)}
                        placeholder="97"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Moneda
                      </label>
                      <select
                        value={form.currency}
                        onChange={e => update('currency', e.target.value)}
                        className={`${inputClass} bg-white`}
                      >
                        <option value="EUR">EUR €</option>
                        <option value="USD">USD $</option>
                        <option value="MXN">MXN $</option>
                        <option value="COP">COP $</option>
                        <option value="ARS">ARS $</option>
                        <option value="CLP">CLP $</option>
                        <option value="GBP">GBP £</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      Página de éxito (lo que ve el cliente)
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Título
                        </label>
                        <input
                          type="text"
                          value={form.successTitle}
                          onChange={e => update('successTitle', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mensaje
                        </label>
                        <textarea
                          value={form.successMessage}
                          onChange={e => update('successMessage', e.target.value)}
                          rows={2}
                          className={`${inputClass} resize-none`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      ← Atrás
                    </button>
                    <button
                      onClick={generate}
                      disabled={!form.productPrice.trim()}
                      className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
                    >
                      Generar links →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generated links */}
        {step === 4 && links && (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">¡Todo listo!</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Tus links están configurados y listos para usar.
              </p>
            </div>

            {/* Link 1: Checkout */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-violet-50 px-5 py-4 border-b border-violet-100">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">🔗</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Link de Checkout</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Usa este link en tus anuncios de Meta, emails y redes sociales
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200">
                  <p className="text-xs text-gray-500 truncate flex-1 font-mono">{links.go}</p>
                  <CopyButton text={links.go} />
                </div>
              </div>
            </div>

            {/* Link 2: Success */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-emerald-50 px-5 py-4 border-b border-emerald-100">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">🎯</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Link de Éxito</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Configúralo en Stripe como URL de confirmación tras el pago
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200">
                  <p className="text-xs text-gray-500 truncate flex-1 font-mono">{links.success}</p>
                  <CopyButton text={links.success} />
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <h3 className="font-semibold text-amber-900 mb-3 text-sm">Cómo activarlo en Stripe</h3>
              <ol className="space-y-2.5">
                {[
                  'En tus anuncios de Meta usa el <strong>Link de Checkout</strong> como URL de destino.',
                  'En Stripe, abre tu Payment Link → <strong>Editar</strong>.',
                  'Ve a <strong>"Página de confirmación"</strong> → selecciona <strong>"Redirigir a una URL"</strong>.',
                  'Pega el <strong>Link de Éxito</strong> y guarda los cambios.',
                ].map((text, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-amber-800">
                    <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: text }} />
                  </li>
                ))}
              </ol>
            </div>

            <button
              onClick={reset}
              className="w-full border border-gray-300 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              + Crear nueva configuración
            </button>
          </div>
        )}
        {/* Test section — always visible */}
        <div className="mt-10 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">🧪</span>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Verificar conexión con Meta</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Envía un evento de prueba para confirmar que la API de Conversiones funciona
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Qué link quieres verificar?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'go', label: '🔗 Link de Checkout', sub: 'Dispara InitiateCheckout' },
                  { id: 'success', label: '🎯 Link de Éxito', sub: 'Dispara Purchase' },
                ] as const).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setTestLink(opt.id)}
                    className={`text-left px-4 py-3 rounded-lg border transition-all ${
                      testLink === opt.id
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs mt-0.5 opacity-70">{opt.sub}</p>
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                <p className="text-xs text-gray-400 font-mono truncate flex-1">
                  {origin || 'https://pixelbridge-theta.vercel.app'}/{testLink}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de verificación de Meta
              </label>
              <input
                type="text"
                value={testCode}
                onChange={e => setTestCode(e.target.value)}
                placeholder="TEST12345"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Events Manager → tu Pixel → Eventos de prueba → "Código del evento de prueba"
              </p>
            </div>

            <button
              onClick={sendTest}
              disabled={!testCode.trim() || testStatus === 'loading'}
              className="w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
            >
              {testStatus === 'loading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar evento de prueba'
              )}
            </button>

            {testStatus === 'ok' && (
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <span className="text-emerald-500 font-bold text-sm">✓</span>
                <p className="text-sm text-emerald-700">{testMessage}</p>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                <span className="text-red-500 font-bold text-sm">✕</span>
                <p className="text-sm text-red-700">{testMessage}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-400">
        PixelBridge — Open source · Gratis para siempre
      </footer>
    </div>
  )
}
