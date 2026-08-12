import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

export default function Login() {
  const { user, login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@cafaz.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      toast('Login realizado com sucesso.')
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível entrar. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden">
          <div className="px-8 py-6 bg-[#0f639d]">
            <h1 className="font-display-lg text-display-lg text-on-primary font-bold">Cafaz OKRs</h1>
            <p className="text-on-primary/80 text-sm mt-1">Sistema de Gestão de OKRs</p>
          </div>
          <form onSubmit={submit} className="p-8 flex flex-col gap-4">
            <h2 className="font-title-md text-title-md text-on-surface">Entrar</h2>
            {error && (
              <p className="text-sm text-on-error-container bg-error-container border border-error/30 rounded-lg px-4 py-3">
                {error}
              </p>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Senha</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-[#0f639d] text-on-primary font-semibold py-2.5 rounded-lg hover:bg-[#0c5182] transition-colors disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <p className="text-xs text-on-surface-variant text-center mt-2">
              Demonstração: admin@cafaz.com / gestor@cafaz.com / colaborador@cafaz.com — senha: password
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}