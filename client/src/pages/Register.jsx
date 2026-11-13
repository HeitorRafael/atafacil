import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../App'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nome obrigatório'
    if (!form.email) e.email = 'E-mail obrigatório'
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Senhas não coincidem'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    setApiError('')
    try {
      const res = await axios.post('/api/auth/register', form)
      setUser(res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setApiError(err.response?.data?.error || 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  return (
    <div className="min-h-screen bg-navy-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-white mb-2">AtaFácil</h1>
          <p className="text-navy-100 opacity-80 text-sm">Gerador inteligente de atas de assembleia</p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-semibold text-navy-800 mb-6">Criar conta</h2>

          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome completo</label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                className={`input-field ${errors.name ? 'input-error' : ''}`}
                placeholder="João Silva"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                className={`input-field ${errors.email ? 'input-error' : ''}`}
                placeholder="seu@email.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                value={form.password}
                onChange={handleChange('password')}
                className={`input-field ${errors.password ? 'input-error' : ''}`}
                placeholder="Mínimo 8 caracteres"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="label">Confirmar senha</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Repita a senha"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Já tem conta?{' '}
            <Link to="/login" className="text-navy-800 font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
