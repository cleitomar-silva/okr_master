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
    <div className="min-h-screen bg-[#f8fafb] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden">
          <div className="px-8 py-3 bg-[#0f639d]">
            <img
              src="/LOGO-GRUPO-CAFAZ-AZURE-VIVIDO.png"
              alt="Logo Grupo Cafaz"
              className="w-64 h-32 object-contain mx-auto mb-1"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
<<<<<<< HEAD
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-primary font-bold text-center">OKR Cafaz</h1>
=======
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-primary font-bold text-center">OKR Master</h1>
>>>>>>> origin/main
            <p className="text-on-primary/80 text-sm mt-1 text-center">Sistema de Gestão de OKRs</p>
          </div>
          <form onSubmit={submit} className="p-8 flex flex-col gap-4">
            <p className="text-center" style={{ color: '#42474c' }}>Informe suas credenciais para continuar.</p>
            {error && (
              <p className="text-sm text-on-error-container bg-error-container border border-error/30 rounded-lg px-4 py-3">
                {error}
              </p>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider font-bold">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-outline-variant px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider font-bold">Senha</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-outline-variant px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
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
           
          </form>
        </div>
      </div>
    </div>
  )
}