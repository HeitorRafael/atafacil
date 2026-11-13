import React from 'react'

export default function AgreementPreview({ ataTexto }) {
  if (!ataTexto) return null

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 max-h-96 overflow-y-auto font-serif text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
      {ataTexto}
    </div>
  )
}
