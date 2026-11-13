import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import AgreementPreview from '../components/AgreementPreview'

export default function MeetingResult() {
  const { meetingId } = useParams()
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get(`/api/meetings/${meetingId}`)
      .then(res => setMeeting(res.data.meeting))
      .catch(() => setError('Reunião não encontrada.'))
      .finally(() => setLoading(false))
  }, [meetingId])

  const handleDownloadPDF = () => {
    window.open(`/api/generate/pdf/${meetingId}`, '_blank')
  }

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(meeting.ata_texto)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-800" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Link to="/dashboard" className="btn-secondary">Voltar ao painel</Link>
      </div>
    </div>
  )

  const dataFormatada = meeting?.data_reuniao
    ? new Date(meeting.data_reuniao + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-navy-800 text-white shadow">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="opacity-70 hover:opacity-100 transition-opacity">← Painel</Link>
          <h1 className="font-serif text-xl">Ata Gerada</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="card">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-xl font-semibold text-navy-800">{meeting?.condominio_nome}</h2>
            <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">Concluída</span>
          </div>
          <p className="text-gray-500 text-sm">{meeting?.tipo_assembleia} · {dataFormatada}</p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Prévia da Ata</h3>
          <AgreementPreview ataTexto={meeting?.ata_texto} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleDownloadPDF} className="btn-primary flex items-center justify-center gap-2 text-base py-3">
            Baixar Ata em PDF
          </button>
          <button onClick={handleCopyText} className="btn-ghost flex items-center justify-center gap-2">
            {copied ? '✓ Copiado!' : 'Copiar texto da ata'}
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>Próximos passos:</strong> Após baixar, envie o PDF no grupo do WhatsApp do condomínio e guarde uma cópia impressa assinada pelos presentes.
        </div>
      </main>
    </div>
  )
}
