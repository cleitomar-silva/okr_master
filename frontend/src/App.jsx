import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Companies from './pages/Companies'
import Perfil from './pages/Perfil'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#0f639d]">progress_activity</span>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireAdmin({ children }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route
                path="perfil"
                element={
                  <ErrorBoundary>
                    <Perfil />
                  </ErrorBoundary>
                }
              />
              <Route
                path="users"
                element={
                  <RequireAdmin>
                    <ErrorBoundary>
                      <Users />
                    </ErrorBoundary>
                  </RequireAdmin>
                }
              />
              <Route
                path="companies"
                element={
                  <RequireAdmin>
                    <ErrorBoundary>
                      <Companies />
                    </ErrorBoundary>
                  </RequireAdmin>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App