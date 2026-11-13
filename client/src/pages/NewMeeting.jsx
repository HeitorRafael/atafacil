import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import MeetingForm from '../components/MeetingForm'
import AudioRecorder from '../components/AudioRecorder'

const STEPS = { CONDOMINIO: 'condominio', FORM: 'form', RECORDING: 'recording', PROCESSING: 'processing' }

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const processingSteps = [
  { key: 'received', label: 'Transcrição recebida' },
  { key: 'generate', label: 'Redigindo ata com IA...' },
  { key: 'pdf', label: 'Gerando documento PDF...' },
]

const emptyForm = {
  nome: '', cnpj: '', endereco: '', bairro: '', cidade: 'Praia Grande', estado: 'SP',
  sindicoNome: '', sindicoCpf: '', sindicoTipo: 'Síndico Morador',
  sindicoEmail: '', sindicoTelefone: '',
  administradoraNome: '', administradoraCnpj: '', administradoraRepresentante: '',
  localPadrao: '', presidenteMesaPadrao: '', secretarioMesaPadrao: '', totalUnidades: '',
}

export default function NewMeeting() {
  const [currentStep, setCurrentStep] = useState(STEPS.CONDOMINIO)
  const [condominios, setCondominios] = useState([])
  const [loadingCondominios, setLoadingCondominios] = useState(true)
  const [selectedCondominio, setSelectedCondominio] = useState(null)
  const [meetingData, setMeetingData] = useState(null)
  const [processingStep, setProcessingStep] = useState(0)
  const [error, setError] = useState('')

  // Estado para o formulário inline de criar/editar condomínio
  const [showCondForm, setShowCondForm] = useState(false)
  const [editingCond, setEditingCond] = useState(null) // null = novo
  const [condForm, setCondForm] = useState(emptyForm)
  const [condErrors, setCondErrors] = useState({})
  const [savingCond, setSavingCond] = useState(false)
  const [hasAdmin, setHasAdmin] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/condominios')
      .then(r => setCondominios(r.data.condominios))
      .catch(() => {})
      .finally(() => setLoadingCondominios(false))
  }, [])

  // Selecionar condomínio e ir para o formulário
  const handleSelect = (cond) => {
    setSelectedCondominio(cond)
    setCurrentStep(STEPS.FORM)
    setError('')
  }

  // Abrir formulário de novo condomínio
  const handleNewCond = () => {
    setEditingCond(null)
    setCondForm(emptyForm)
    setHasAdmin(false)
    setCondErrors({})
    setShowCondForm(true)
  }

  // Abrir formulário de edição
  const handleEditCond = (cond, e) => {
    e.stopPropagation()
    setEditingCond(cond)
    setCondForm({
      nome: cond.nome, cnpj: cond.cnpj, endereco: cond.endereco, bairro: cond.bairro,
      cidade: cond.cidade, estado: cond.estado,
      sindicoNome: cond.sindicoNome, sindicoCpf: cond.sindicoCpf, sindicoTipo: cond.sindicoTipo,
      sindicoEmail: cond.sindicoEmail, sindicoTelefone: cond.sindicoTelefone,
      administradoraNome: cond.administradoraNome, administradoraCnpj: cond.administradoraCnpj,
      administradoraRepresentante: cond.administradoraRepresentante,
      localPadrao: cond.localPadrao, presidenteMesaPadrao: cond.presidenteMesaPadrao,
      secretarioMesaPadrao: cond.secretarioMesaPadrao, totalUnidades: cond.totalUnidades || '',
    })
    setHasAdmin(!!cond.administradoraNome)
    setCondErrors({})
    setShowCondForm(true)
  }

  const handleDeleteCond = async (cond, e) => {
    e.stopPropagation()
    if (!confirm(`Excluir "${cond.nome}"?`)) return
    await axios.delete(`/api/condominios/${cond.id}`)
    setCondominios(prev => prev.filter(c => c.id !== cond.id))
  }

  const setCondField = (field) => (e) => {
    setCondForm(f => ({ ...f, [field]: e.target.value }))
    setCondErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validateCond = () => {
    const e = {}
    if (!condForm.nome.trim()) e.nome = 'Obrigatório'
    if (!condForm.endereco.trim()) e.endereco = 'Obrigatório'
    if (!condForm.sindicoNome.trim()) e.sindicoNome = 'Obrigatório'
    if (!condForm.sindicoCpf.trim()) e.sindicoCpf = 'Obrigatório'
    if (hasAdmin && !condForm.administradoraNome.trim()) e.administradoraNome = 'Obrigatório'
    return e
  }

  const handleSaveCond = async () => {
    const errs = validateCond()
    if (Object.keys(errs).length > 0) { setCondErrors(errs); return }

    setSavingCond(true)
    try {
      const payload = { ...condForm }
      if (!hasAdmin) {
        payload.administradoraNome = ''
        payload.administradoraCnpj = ''
        payload.administradoraRepresentante = ''
      }

      let res
      if (editingCond) {
        res = await axios.put(`/api/condominios/${editingCond.id}`, payload)
        setCondominios(prev => prev.map(c => c.id === editingCond.id ? res.data.condominio : c))
      } else {
        res = await axios.post('/api/condominios', payload)
        setCondominios(prev => [...prev, res.data.condominio])
      }

      setShowCondForm(false)
      // Se criou novo, seleciona automaticamente
      if (!editingCond) {
        handleSelect(res.data.condominio)
      }
    } catch (err) {
      setCondErrors({ api: err.response?.data?.error || 'Erro ao salvar.' })
    } finally {
      setSavingCond(false)
    }
  }

  // Formulário da assembleia preenchido
  const handleFormValid = (data) => {
    setMeetingData(data)
    setCurrentStep(STEPS.RECORDING)
  }

  // Gravação concluída
  const handleRecordingComplete = async (transcript) => {
    if (!transcript || transcript.trim().length < 10) {
      setError('A transcrição ficou muito curta ou vazia. Verifique se o microfone estava funcionando e tente novamente.')
      return
    }
    setCurrentStep(STEPS.PROCESSING)
    setProcessingStep(0)
    setError('')

    try {
      setProcessingStep(1)
      const stepInterval = setInterval(() => {
        setProcessingStep(prev => prev < processingSteps.length - 1 ? prev + 1 : prev)
      }, 12000)

      const res = await axios.post('/api/generate/ata', { meetingData, transcript }, { timeout: 300000 })
      clearInterval(stepInterval)
      setProcessingStep(processingSteps.length)
      navigate(`/resultado/${res.data.meetingId}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Ocorreu um erro durante o processamento. Tente novamente.')
      setCurrentStep(STEPS.RECORDING)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-navy-800 text-white shadow">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          {currentStep === STEPS.FORM ? (
            <button onClick={() => setCurrentStep(STEPS.CONDOMINIO)} className="opacity-70 hover:opacity-100 transition-opacity">← Voltar</button>
          ) : (
            <Link to="/dashboard" className="opacity-70 hover:opacity-100 transition-opacity">← Voltar</Link>
          )}
          <h1 className="font-serif text-xl">Nova Assembleia</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* ── ETAPA 1: Selecionar condomínio ── */}
        {currentStep === STEPS.CONDOMINIO && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">Selecionar Condomínio</h2>
            <p className="text-gray-500 text-sm mb-6">Escolha o condomínio para pré-preencher os dados da assembleia.</p>

            {/* Formulário inline de criação/edição */}
            {showCondForm && (
              <div className="card mb-6 border-navy-800 border-2">
                <h3 className="section-title">{editingCond ? 'Editar Condomínio' : 'Cadastrar Novo Condomínio'}</h3>

                {condErrors.api && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
                    {condErrors.api}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Nome do condomínio *</label>
                    <input value={condForm.nome} onChange={setCondField('nome')}
                      className={`input-field ${condErrors.nome ? 'input-error' : ''}`}
                      placeholder="Ex: Residencial Bela Vista" />
                    {condErrors.nome && <p className="text-red-500 text-xs mt-1">{condErrors.nome}</p>}
                  </div>
                  <div>
                    <label className="label">CNPJ</label>
                    <input value={condForm.cnpj} onChange={setCondField('cnpj')} className="input-field" placeholder="00.000.000/0000-00" />
                  </div>
                  <div>
                    <label className="label">Endereço *</label>
                    <input value={condForm.endereco} onChange={setCondField('endereco')}
                      className={`input-field ${condErrors.endereco ? 'input-error' : ''}`}
                      placeholder="Rua, número" />
                    {condErrors.endereco && <p className="text-red-500 text-xs mt-1">{condErrors.endereco}</p>}
                  </div>
                  <div>
                    <label className="label">Bairro</label>
                    <input value={condForm.bairro} onChange={setCondField('bairro')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Cidade</label>
                    <input value={condForm.cidade} onChange={setCondField('cidade')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Estado</label>
                    <select value={condForm.estado} onChange={setCondField('estado')} className="input-field">
                      {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>

                  <div className="sm:col-span-2 border-t pt-4 mt-2">
                    <p className="text-sm font-semibold text-gray-600 mb-3">Síndico</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Nome do síndico *</label>
                    <input value={condForm.sindicoNome} onChange={setCondField('sindicoNome')}
                      className={`input-field ${condErrors.sindicoNome ? 'input-error' : ''}`} />
                    {condErrors.sindicoNome && <p className="text-red-500 text-xs mt-1">{condErrors.sindicoNome}</p>}
                  </div>
                  <div>
                    <label className="label">CPF do síndico *</label>
                    <input value={condForm.sindicoCpf} onChange={setCondField('sindicoCpf')}
                      className={`input-field ${condErrors.sindicoCpf ? 'input-error' : ''}`}
                      placeholder="000.000.000-00" />
                    {condErrors.sindicoCpf && <p className="text-red-500 text-xs mt-1">{condErrors.sindicoCpf}</p>}
                  </div>
                  <div>
                    <label className="label">Tipo</label>
                    <select value={condForm.sindicoTipo} onChange={setCondField('sindicoTipo')} className="input-field">
                      <option>Síndico Morador</option>
                      <option>Síndico Profissional</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">E-mail do síndico</label>
                    <input value={condForm.sindicoEmail} onChange={setCondField('sindicoEmail')} type="email" className="input-field" />
                  </div>
                  <div>
                    <label className="label">Telefone do síndico</label>
                    <input value={condForm.sindicoTelefone} onChange={setCondField('sindicoTelefone')} className="input-field" placeholder="(00) 00000-0000" />
                  </div>

                  <div className="sm:col-span-2 border-t pt-4 mt-2">
                    <p className="text-sm font-semibold text-gray-600 mb-3">Padrões da Assembleia</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Local habitual das reuniões</label>
                    <input value={condForm.localPadrao} onChange={setCondField('localPadrao')} className="input-field" placeholder="Ex: Salão de festas" />
                  </div>
                  <div>
                    <label className="label">Presidente da mesa (padrão)</label>
                    <input value={condForm.presidenteMesaPadrao} onChange={setCondField('presidenteMesaPadrao')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Secretário da mesa (padrão)</label>
                    <input value={condForm.secretarioMesaPadrao} onChange={setCondField('secretarioMesaPadrao')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Total de unidades</label>
                    <input type="number" min="1" value={condForm.totalUnidades} onChange={setCondField('totalUnidades')} className="input-field" />
                  </div>

                  <div className="sm:col-span-2 border-t pt-4 mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Possui administradora?</span>
                      <button type="button" onClick={() => setHasAdmin(!hasAdmin)}
                        className={`relative inline-flex w-12 h-6 rounded-full transition-colors ${hasAdmin ? 'bg-navy-800' : 'bg-gray-300'}`}>
                        <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform mt-0.5 ${hasAdmin ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>

                  {hasAdmin && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="label">Nome da administradora *</label>
                        <input value={condForm.administradoraNome} onChange={setCondField('administradoraNome')}
                          className={`input-field ${condErrors.administradoraNome ? 'input-error' : ''}`} />
                        {condErrors.administradoraNome && <p className="text-red-500 text-xs mt-1">{condErrors.administradoraNome}</p>}
                      </div>
                      <div>
                        <label className="label">CNPJ da administradora</label>
                        <input value={condForm.administradoraCnpj} onChange={setCondField('administradoraCnpj')} className="input-field" />
                      </div>
                      <div>
                        <label className="label">Representante</label>
                        <input value={condForm.administradoraRepresentante} onChange={setCondField('administradoraRepresentante')} className="input-field" />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <button onClick={() => setShowCondForm(false)} className="btn-ghost">Cancelar</button>
                  <button onClick={handleSaveCond} disabled={savingCond} className="btn-primary">
                    {savingCond ? 'Salvando...' : editingCond ? 'Salvar alterações' : 'Cadastrar e selecionar'}
                  </button>
                </div>
              </div>
            )}

            {loadingCondominios ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card: Novo Condomínio */}
                {!showCondForm && (
                  <button
                    onClick={handleNewCond}
                    className="card border-2 border-dashed border-gray-300 hover:border-navy-800 hover:bg-navy-50 transition-colors text-center py-8 flex flex-col items-center gap-3"
                  >
                    <span className="text-3xl text-gray-400">+</span>
                    <span className="font-semibold text-gray-500">Cadastrar novo condomínio</span>
                  </button>
                )}

                {/* Cards de condomínios salvos */}
                {condominios.map(cond => (
                  <div
                    key={cond.id}
                    onClick={() => !showCondForm && handleSelect(cond)}
                    className={`card cursor-pointer hover:shadow-md hover:border-navy-800 border-2 border-transparent transition-all relative group ${showCondForm ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="pr-16">
                      <p className="font-semibold text-navy-800 text-base leading-tight">{cond.nome}</p>
                      <p className="text-sm text-gray-500 mt-1">{cond.bairro ? `${cond.bairro}, ` : ''}{cond.cidade} — {cond.estado}</p>
                      <p className="text-xs text-gray-400 mt-1">{cond.sindicoTipo}: {cond.sindicoNome}</p>
                      {cond.totalUnidades && (
                        <p className="text-xs text-gray-400">{cond.totalUnidades} unidades</p>
                      )}
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEditCond(cond, e)}
                        className="p-1.5 rounded-md bg-gray-100 hover:bg-navy-800 hover:text-white transition-colors text-xs"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => handleDeleteCond(cond, e)}
                        className="p-1.5 rounded-md bg-gray-100 hover:bg-red-500 hover:text-white transition-colors text-xs"
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingCondominios && condominios.length === 0 && !showCondForm && (
              <p className="text-center text-gray-400 text-sm mt-4">
                Nenhum condomínio cadastrado. Cadastre um para começar.
              </p>
            )}
          </div>
        )}

        {/* ── ETAPA 2: Formulário da assembleia ── */}
        {currentStep === STEPS.FORM && (
          <MeetingForm
            onFormValid={handleFormValid}
            initialData={selectedCondominio ? {
              condominioNome: selectedCondominio.nome,
              condominioCnpj: selectedCondominio.cnpj,
              condominioEndereco: selectedCondominio.endereco,
              condominioBairro: selectedCondominio.bairro,
              condominioCidade: selectedCondominio.cidade,
              condominioEstado: selectedCondominio.estado,
              sindicoNome: selectedCondominio.sindicoNome,
              sindicoCpf: selectedCondominio.sindicoCpf,
              sindicoTipo: selectedCondominio.sindicoTipo,
              sindicoEmail: selectedCondominio.sindicoEmail,
              sindicoTelefone: selectedCondominio.sindicoTelefone,
              administradoraNome: selectedCondominio.administradoraNome,
              administradoraCnpj: selectedCondominio.administradoraCnpj,
              administradoraRepresentante: selectedCondominio.administradoraRepresentante,
              localPadrao: selectedCondominio.localPadrao,
              presidenteMesaPadrao: selectedCondominio.presidenteMesaPadrao,
              secretarioMesaPadrao: selectedCondominio.secretarioMesaPadrao,
              totalUnidades: selectedCondominio.totalUnidades,
            } : null}
          />
        )}

        {/* ── ETAPA 3: Gravação ── */}
        {currentStep === STEPS.RECORDING && (
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            onCancel={() => setCurrentStep(STEPS.FORM)}
          />
        )}

        {/* ── ETAPA 4: Processando ── */}
        {currentStep === STEPS.PROCESSING && (
          <div className="card py-10 text-center">
            <div className="text-5xl mb-6">⚙️</div>
            <h2 className="text-2xl font-semibold text-navy-800 mb-2">Gerando sua ata...</h2>
            <p className="text-gray-500 text-sm mb-8">Isso pode levar entre 20 e 60 segundos.</p>
            <div className="max-w-xs mx-auto space-y-4">
              {processingSteps.map((s, idx) => {
                const done = idx < processingStep
                const active = idx === processingStep
                return (
                  <div key={s.key} className="flex items-center gap-3 text-left">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                      ${done ? 'bg-green-500 text-white' : active ? 'bg-navy-800 text-white animate-pulse' : 'bg-gray-200 text-gray-400'}`}>
                      {done ? '✓' : idx + 1}
                    </div>
                    <span className={`text-sm ${done ? 'text-green-600 line-through' : active ? 'text-navy-800 font-medium' : 'text-gray-400'}`}>
                      {s.label}
                    </span>
                    {active && <div className="ml-auto animate-spin rounded-full h-4 w-4 border-b-2 border-navy-800" />}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
