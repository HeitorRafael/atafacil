import React, { useState } from 'react'

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const PAUTA_SUGESTOES = [
  'Prestação de contas',
  'Eleição de síndico',
  'Reajuste de taxa condominial',
  'Obras e melhorias',
  'Assuntos gerais',
  'Aprovação do orçamento anual',
  'Fundo de reserva',
]

const hoje = new Date().toISOString().split('T')[0]

function Field({ label, error, tooltip, children }) {
  return (
    <div>
      <label className="label flex items-center gap-1">
        {label}
        {tooltip && (
          <span className="text-gray-400 cursor-help" title={tooltip}>ⓘ</span>
        )}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default function MeetingForm({ onFormValid, initialData }) {
  const [step, setStep] = useState(1)
  const [hasAdmin, setHasAdmin] = useState(!!(initialData?.administradoraNome))
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    condominioNome: initialData?.condominioNome || '',
    condominioCnpj: initialData?.condominioCnpj || '',
    condominioEndereco: initialData?.condominioEndereco || '',
    condominioBairro: initialData?.condominioBairro || '',
    condominioCidade: initialData?.condominioCidade || 'Praia Grande',
    condominioEstado: initialData?.condominioEstado || 'SP',
    sindicoNome: initialData?.sindicoNome || '',
    sindicoCpf: initialData?.sindicoCpf || '',
    sindicoTipo: initialData?.sindicoTipo || 'Síndico Morador',
    sindicoEmail: initialData?.sindicoEmail || '',
    sindicoTelefone: initialData?.sindicoTelefone || '',
    administradoraNome: initialData?.administradoraNome || '',
    administradoraCnpj: initialData?.administradoraCnpj || '',
    administradoraRepresentante: initialData?.administradoraRepresentante || '',
    tipoAssembleia: 'AGO',
    dataReuniao: hoje,
    horaInicio: '',
    horaSegundaConvocacao: '',
    local: initialData?.localPadrao || '',
    presidenteMesa: initialData?.presidenteMesaPadrao || '',
    secretarioMesa: initialData?.secretarioMesaPadrao || '',
    totalUnidades: initialData?.totalUnidades || '',
    presentesCount: '',
    pautaItems: [''],
  })

  const set = (field) => (e) => {
    const val = e.target ? e.target.value : e
    setForm(f => ({ ...f, [field]: val }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const addPautaItem = () => {
    if (form.pautaItems.length >= 15) return
    setForm(f => ({ ...f, pautaItems: [...f.pautaItems, ''] }))
  }

  const removePautaItem = (idx) => {
    setForm(f => ({ ...f, pautaItems: f.pautaItems.filter((_, i) => i !== idx) }))
  }

  const setPautaItem = (idx, val) => {
    setForm(f => {
      const items = [...f.pautaItems]
      items[idx] = val
      return { ...f, pautaItems: items }
    })
  }

  const addSugestao = (s) => {
    if (form.pautaItems.includes(s)) return
    if (form.pautaItems.length >= 15) return
    const items = form.pautaItems.filter(i => i.trim())
    setForm(f => ({ ...f, pautaItems: [...items, s] }))
  }

  const validateStep1 = () => {
    const e = {}
    if (!form.condominioNome.trim()) e.condominioNome = 'Obrigatório'
    if (!form.condominioEndereco.trim()) e.condominioEndereco = 'Obrigatório'
    if (!form.condominioBairro.trim()) e.condominioBairro = 'Obrigatório'
    if (!form.condominioCidade.trim()) e.condominioCidade = 'Obrigatório'
    if (!form.condominioEstado) e.condominioEstado = 'Obrigatório'
    if (!form.sindicoNome.trim()) e.sindicoNome = 'Obrigatório'
    if (!form.sindicoCpf.trim()) e.sindicoCpf = 'Obrigatório'
    if (hasAdmin && !form.administradoraNome.trim()) e.administradoraNome = 'Obrigatório'
    return e
  }

  const validateStep2 = () => {
    const e = {}
    if (!form.tipoAssembleia) e.tipoAssembleia = 'Obrigatório'
    if (!form.dataReuniao) e.dataReuniao = 'Obrigatório'
    if (!form.horaInicio) e.horaInicio = 'Obrigatório'
    if (!form.local.trim()) e.local = 'Obrigatório'
    if (!form.presidenteMesa.trim()) e.presidenteMesa = 'Obrigatório'
    if (!form.secretarioMesa.trim()) e.secretarioMesa = 'Obrigatório'
    if (!form.totalUnidades) e.totalUnidades = 'Obrigatório'
    if (!form.presentesCount) e.presentesCount = 'Obrigatório'
    const validPauta = form.pautaItems.filter(i => i.trim())
    if (validPauta.length === 0) e.pautaItems = 'Adicione pelo menos um item de pauta'
    return e
  }

  const handleNext = () => {
    const errs = validateStep1()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setStep(2)
  }

  const handleSubmit = () => {
    const errs = validateStep2()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    const finalForm = {
      ...form,
      pautaItems: form.pautaItems.filter(i => i.trim()),
      hasAdmin,
    }
    onFormValid(finalForm)
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {[1, 2].map(s => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${step === s ? 'text-navy-800' : step > s ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2
                ${step === s ? 'border-navy-800 bg-navy-800 text-white' : step > s ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'}`}>
                {step > s ? '✓' : s}
              </div>
              <span className="text-sm font-medium hidden sm:block">
                {s === 1 ? 'Dados do condomínio' : 'Assembleia e pauta'}
              </span>
            </div>
            {s < 2 && <div className="flex-1 h-px bg-gray-300" />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          {/* Seção 1 */}
          <div className="card">
            <h3 className="section-title">Dados do Condomínio</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Nome do condomínio *" error={errors.condominioNome}>
                  <input value={form.condominioNome} onChange={set('condominioNome')}
                    className={`input-field ${errors.condominioNome ? 'input-error' : ''}`}
                    placeholder="Ex: Residencial Bela Vista" />
                </Field>
              </div>
              <Field label="CNPJ" tooltip="Opcional, mas recomendado para validade jurídica">
                <input value={form.condominioCnpj} onChange={set('condominioCnpj')}
                  className="input-field" placeholder="00.000.000/0000-00" />
              </Field>
              <Field label="Endereço *" error={errors.condominioEndereco}>
                <input value={form.condominioEndereco} onChange={set('condominioEndereco')}
                  className={`input-field ${errors.condominioEndereco ? 'input-error' : ''}`}
                  placeholder="Rua, número, complemento" />
              </Field>
              <Field label="Bairro *" error={errors.condominioBairro}>
                <input value={form.condominioBairro} onChange={set('condominioBairro')}
                  className={`input-field ${errors.condominioBairro ? 'input-error' : ''}`}
                  placeholder="Bairro" />
              </Field>
              <Field label="Cidade *" error={errors.condominioCidade}>
                <input value={form.condominioCidade} onChange={set('condominioCidade')}
                  className={`input-field ${errors.condominioCidade ? 'input-error' : ''}`} />
              </Field>
              <Field label="Estado *" error={errors.condominioEstado}>
                <select value={form.condominioEstado} onChange={set('condominioEstado')}
                  className={`input-field ${errors.condominioEstado ? 'input-error' : ''}`}>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Seção 2 */}
          <div className="card">
            <h3 className="section-title">Dados do Síndico</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Nome completo do síndico *" error={errors.sindicoNome}>
                  <input value={form.sindicoNome} onChange={set('sindicoNome')}
                    className={`input-field ${errors.sindicoNome ? 'input-error' : ''}`} />
                </Field>
              </div>
              <Field label="CPF do síndico *" error={errors.sindicoCpf}>
                <input value={form.sindicoCpf} onChange={set('sindicoCpf')}
                  className={`input-field ${errors.sindicoCpf ? 'input-error' : ''}`}
                  placeholder="000.000.000-00" />
              </Field>
              <Field label="Tipo de síndico *">
                <select value={form.sindicoTipo} onChange={set('sindicoTipo')} className="input-field">
                  <option>Síndico Morador</option>
                  <option>Síndico Profissional</option>
                </select>
              </Field>
              <Field label="E-mail">
                <input value={form.sindicoEmail} onChange={set('sindicoEmail')}
                  type="email" className="input-field" placeholder="sindico@email.com" />
              </Field>
              <Field label="Telefone">
                <input value={form.sindicoTelefone} onChange={set('sindicoTelefone')}
                  className="input-field" placeholder="(00) 00000-0000" />
              </Field>
            </div>
          </div>

          {/* Seção 3 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-navy-800">Administradora</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-600">Esta reunião tem administradora?</span>
                <button
                  type="button"
                  onClick={() => setHasAdmin(!hasAdmin)}
                  className={`relative inline-flex w-12 h-6 rounded-full transition-colors ${hasAdmin ? 'bg-navy-800' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform mt-0.5 ${hasAdmin ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'}`} />
                </button>
              </label>
            </div>
            {hasAdmin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nome da administradora *" error={errors.administradoraNome}>
                  <input value={form.administradoraNome} onChange={set('administradoraNome')}
                    className={`input-field ${errors.administradoraNome ? 'input-error' : ''}`} />
                </Field>
                <Field label="CNPJ da administradora">
                  <input value={form.administradoraCnpj} onChange={set('administradoraCnpj')}
                    className="input-field" placeholder="00.000.000/0000-00" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Nome do representante">
                    <input value={form.administradoraRepresentante} onChange={set('administradoraRepresentante')}
                      className="input-field" />
                  </Field>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button onClick={handleNext} className="btn-primary">
              Próximo →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          {/* Seção 4 */}
          <div className="card">
            <h3 className="section-title">Dados da Assembleia</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Tipo de assembleia *" error={errors.tipoAssembleia}>
                  <select value={form.tipoAssembleia} onChange={set('tipoAssembleia')} className="input-field">
                    <option value="AGO">AGO — Assembleia Geral Ordinária</option>
                    <option value="AGE">AGE — Assembleia Geral Extraordinária</option>
                  </select>
                </Field>
              </div>
              <Field label="Data da assembleia *" error={errors.dataReuniao}>
                <input type="date" value={form.dataReuniao} onChange={set('dataReuniao')}
                  className={`input-field ${errors.dataReuniao ? 'input-error' : ''}`} />
              </Field>
              <Field label="Horário da 1ª convocação *" error={errors.horaInicio}>
                <input type="time" value={form.horaInicio} onChange={set('horaInicio')}
                  className={`input-field ${errors.horaInicio ? 'input-error' : ''}`} />
              </Field>
              <Field label="Horário da 2ª convocação" tooltip="A 2ª convocação ocorre caso não haja quórum na 1ª">
                <input type="time" value={form.horaSegundaConvocacao} onChange={set('horaSegundaConvocacao')}
                  className="input-field" />
              </Field>
              <Field label="Local da reunião *" error={errors.local}>
                <input value={form.local} onChange={set('local')}
                  className={`input-field ${errors.local ? 'input-error' : ''}`}
                  placeholder="Ex: Salão de festas do condomínio" />
              </Field>
              <Field label="Presidente da mesa *" error={errors.presidenteMesa}>
                <input value={form.presidenteMesa} onChange={set('presidenteMesa')}
                  className={`input-field ${errors.presidenteMesa ? 'input-error' : ''}`} />
              </Field>
              <Field label="Secretário da mesa *" error={errors.secretarioMesa}>
                <input value={form.secretarioMesa} onChange={set('secretarioMesa')}
                  className={`input-field ${errors.secretarioMesa ? 'input-error' : ''}`} />
              </Field>
              <Field label="Nº de unidades *" error={errors.totalUnidades}>
                <input type="number" min="1" value={form.totalUnidades} onChange={set('totalUnidades')}
                  className={`input-field ${errors.totalUnidades ? 'input-error' : ''}`} />
              </Field>
              <Field label="Nº de condôminos presentes *" error={errors.presentesCount}>
                <input type="number" min="1" value={form.presentesCount} onChange={set('presentesCount')}
                  className={`input-field ${errors.presentesCount ? 'input-error' : ''}`} />
              </Field>
            </div>
          </div>

          {/* Seção 5 */}
          <div className="card">
            <h3 className="section-title">Ordem do Dia (Pauta)</h3>

            <div className="flex flex-wrap gap-2 mb-4">
              {PAUTA_SUGESTOES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSugestao(s)}
                  className="text-xs bg-gray-100 hover:bg-navy-800 hover:text-white text-gray-700 px-3 py-1.5 rounded-full transition-colors border border-gray-200"
                >
                  + {s}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {form.pautaItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm w-5 text-right">{idx + 1}.</span>
                  <input
                    value={item}
                    onChange={e => setPautaItem(idx, e.target.value)}
                    className="input-field flex-1"
                    placeholder="Descreva o item de pauta"
                  />
                  {form.pautaItems.length > 1 && (
                    <button type="button" onClick={() => removePautaItem(idx)}
                      className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none">
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {errors.pautaItems && <p className="text-red-500 text-xs mt-2">{errors.pautaItems}</p>}

            {form.pautaItems.length < 15 && (
              <button type="button" onClick={addPautaItem}
                className="mt-3 text-sm text-navy-800 font-medium hover:underline">
                + Adicionar item de pauta
              </button>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn-ghost">← Voltar</button>
            <button onClick={handleSubmit} className="btn-primary text-lg px-8 py-3">
              Iniciar Gravação da Reunião
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
