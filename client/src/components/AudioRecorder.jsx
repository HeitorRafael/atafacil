import React, { useEffect, useRef, useState } from 'react'
import { useRecorder } from '../hooks/useRecorder'

export default function AudioRecorder({ onRecordingComplete, onCancel }) {
  const { isRecording, duration, transcript, error, start, stop, getAnalyserData, formatDuration } = useRecorder()
  const [showStartModal, setShowStartModal] = useState(true)
  const [showStopModal, setShowStopModal] = useState(false)
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)

  // Visualizador de áudio
  useEffect(() => {
    if (!isRecording || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw)
      const data = getAnalyserData()
      if (!data) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#0F2044'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const barWidth = (canvas.width / data.length) * 2.5
      let x = 0
      for (let i = 0; i < data.length; i++) {
        const barHeight = (data[i] / 255) * canvas.height * 0.8
        const hue = 210 + (data[i] / 255) * 40
        ctx.fillStyle = `hsl(${hue}, 70%, 60%)`
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth, barHeight)
        x += barWidth + 1
      }
    }
    draw()
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [isRecording, getAnalyserData])

  const handleConfirmStart = async () => {
    setShowStartModal(false)
    await start()
  }

  const handleConfirmStop = () => {
    setShowStopModal(false)
    const finalTranscript = stop()
    onRecordingComplete(finalTranscript)
  }

  if (error) {
    return (
      <div className="card text-center py-8">
        <div className="text-4xl mb-4">🎙️</div>
        <h3 className="text-lg font-semibold text-red-600 mb-2">Microfone não disponível</h3>
        <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">{error}</p>
        <button onClick={onCancel} className="btn-ghost">Voltar ao formulário</button>
      </div>
    )
  }

  return (
    <div>
      {/* Modal de confirmação de início */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Iniciar gravação?</h3>
            <p className="text-gray-600 text-sm mb-2">
              Você está prestes a iniciar a gravação da assembleia. O áudio será transcrito automaticamente
              em tempo real pelo seu navegador.
            </p>
            <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs mb-6">
              Use o <strong>Google Chrome</strong> para melhor qualidade de transcrição em português.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={onCancel} className="btn-ghost">Cancelar</button>
              <button onClick={handleConfirmStart} className="btn-primary">Iniciar Gravação</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de encerramento */}
      {showStopModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Encerrar reunião?</h3>
            <p className="text-gray-600 text-sm mb-6">
              Deseja encerrar a gravação? A ata será gerada com base na transcrição capturada.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowStopModal(false)} className="btn-ghost">Continuar Gravando</button>
              <button onClick={handleConfirmStop} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                Confirmar e Gerar Ata
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UI de gravação */}
      {isRecording && (
        <div className="space-y-4">
          <div className="card text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-600 font-semibold">Gravando e transcrevendo...</span>
            </div>

            <div className="text-4xl font-mono font-bold text-navy-800 mb-3">
              {formatDuration(duration)}
            </div>

            <canvas
              ref={canvasRef}
              width={600}
              height={60}
              className="rounded-lg w-full mb-4"
              style={{ maxWidth: '100%' }}
            />

            <button
              onClick={() => setShowStopModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl text-lg transition-colors shadow-lg"
            >
              Finalizar Reunião
            </button>
          </div>

          {/* Preview da transcrição em tempo real */}
          <div className="card">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Transcrição ao vivo
            </p>
            <div className="min-h-20 max-h-48 overflow-y-auto text-sm text-gray-700 leading-relaxed">
              {transcript
                ? transcript
                : <span className="text-gray-400 italic">Aguardando fala...</span>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
