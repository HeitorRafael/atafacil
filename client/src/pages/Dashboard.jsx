import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../App'

export default function Dashboard() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/meetings')
      .then(res => setMeetings(res.data.meetings))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleDelete = async (id) => {
    if (!confirm('Deseja excluir esta reunião?')) return
    await axios.delete(`/api/meetings/${id}`)
    setMeetings(m => m.filter(x => x.id !== id))
  }

  const statusLabel = {
    pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-600' },
    processing: { label: 'Processando', color: 'bg-yellow-100 text-yellow-700' },
    completed: { label: 'Concluída', color: 'bg-green-100 text-green-700' },
    error: { label: 'Erro', color: 'bg-red-100 text-red-600' },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-navy-800 text-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-serif text-2xl">AtaFácil</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-80">Olá, {user?.name?.split(' ')[0]}</span>
            <button onClick={handleLogout} className="text-sm opacity-70 hover:opacity-100 transition-opacity">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Minhas Reuniões</h2>
          <Link to="/nova-reuniao" className="btn-primary">
            + Nova Assembleia
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-800" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma reunião ainda</h3>
            <p className="text-gray-500 mb-6">Crie sua primeira ata de assembleia em minutos.</p>
            <Link to="/nova-reuniao" className="btn-primary inline-block">
              Criar primeira ata
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map(m => {
              const st = statusLabel[m.status] || statusLabel.pending
              return (
                <div key={m.id} className="card flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-semibold text-gray-800">{m.condominio_nome}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {m.tipo_assembleia} · {new Date(m.data_reuniao + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>
                      {st.label}
                    </span>
                    {m.status === 'completed' && (
                      <Link to={`/resultado/${m.id}`} className="text-sm text-navy-800 font-medium hover:underline">
                        Ver ata
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
