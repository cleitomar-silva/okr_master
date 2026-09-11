import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 23 23" className="w-5 h-5" aria-hidden="true">
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#7fba00" d="M12 1h10v10H12z" />
      <path fill="#00a4ef" d="M1 12h10v10H1z" />
      <path fill="#ffb900" d="M12 12h10v10H12z" />
    </svg>
  )
}

export default function Login() {
  const { user, login, loginWithToken } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [microsoftLoading, setMicrosoftLoading] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    const msError = searchParams.get('error')

    if (token) {
      setLoading(true)
      loginWithToken(token)
        .then(() => {
          toast('Login Microsoft realizado com sucesso.')
          navigate('/', { replace: true })
        })
        .catch(() => {
          setError('Não foi possível autenticar com a Microsoft.')
          navigate('/login', { replace: true })
        })
        .finally(() => setLoading(false))
      return
    }

    if (msError) {
      setError(decodeURIComponent(msError))
      navigate('/login', { replace: true })
    }
  }, [searchParams, loginWithToken, navigate, toast])

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

  const microsoftLogin = () => {
    setError('')
    setMicrosoftLoading(true)
    const apiUrl = import.meta.env.VITE_API_URL || ''
    window.location.href = `${apiUrl}/api/v1/auth/microsoft/redirect`
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
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-primary font-bold text-center">OKR Cafaz</h1>
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
              disabled={loading || microsoftLoading}
              className="mt-2 bg-[#0f639d] text-on-primary font-semibold py-2.5 rounded-lg hover:bg-[#0c5182] transition-colors disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-outline-variant/60" />
              <span className="text-xs font-semibold text-on-surface-variant tracking-wider">ou</span>
              <div className="flex-1 h-px bg-outline-variant/60" />
            </div>

            <button
              type="button"
              onClick={microsoftLogin}
              disabled={loading || microsoftLoading}
              className="flex items-center justify-center gap-3 bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-sm font-semibold text-[#3a3d41] hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              <MicrosoftIcon />
              {microsoftLoading ? 'Redirecionando...' : 'Entrar com Microsoft'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}