import { useState, useRef, useCallback, useEffect } from 'react'

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef(null)
  const recognitionRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const analyserRef = useRef(null)
  const audioContextRef = useRef(null)
  const transcriptAccRef = useRef('')

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  const start = useCallback(async () => {
    setError('')
    setTranscript('')
    transcriptAccRef.current = ''

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Seu navegador não suporta transcrição de voz. Use o Google Chrome.')
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Audio visualizer
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // MediaRecorder apenas para manter o stream ativo
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      recorder.start()

      // Speech Recognition
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.lang = 'pt-BR'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onresult = (event) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i]
          if (r.isFinal) {
            transcriptAccRef.current += r[0].transcript + ' '
          } else {
            interim = r[0].transcript
          }
        }
        setTranscript(transcriptAccRef.current + interim)
      }

      recognition.onerror = (event) => {
        // Erros não-fatais: reinicia automaticamente
        if (['network', 'no-speech', 'audio-capture'].includes(event.error)) {
          if (mediaRecorderRef.current?.state === 'recording') {
            try { recognition.start() } catch {}
          }
        }
      }

      recognition.onend = () => {
        // Reinicia enquanto ainda estiver gravando
        if (mediaRecorderRef.current?.state === 'recording') {
          try { recognition.start() } catch {}
        }
      }

      recognition.start()
      setIsRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)

      return true
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Permissão de microfone negada. Clique no ícone de cadeado na barra de endereços e permita o acesso ao microfone.')
      } else {
        setError('Erro ao acessar o microfone: ' + err.message)
      }
      return false
    }
  }, [])

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    const finalTranscript = transcriptAccRef.current.trim()
    cleanup()
    setIsRecording(false)
    return finalTranscript
  }, [cleanup])

  const getAnalyserData = useCallback(() => {
    if (!analyserRef.current) return null
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)
    return data
  }, [])

  const formatDuration = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0')
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  return { isRecording, duration, transcript, error, start, stop, getAnalyserData, formatDuration }
}
