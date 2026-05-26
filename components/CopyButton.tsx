'use client'

import { useState } from 'react'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
        copied
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
      }`}
    >
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  )
}
