import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-screen flex items-center justify-center bg-[#f8fafb] px-4">
          <div className="max-w-xl w-full bg-surface-container-lowest border border-error/40 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-3xl">error</span>
              <h2 className="font-title-md text-title-md text-on-surface">Algo deu errado</h2>
            </div>
            <pre className="text-sm text-on-error-container bg-error-container/60 rounded-lg p-4 whitespace-pre-wrap break-words mb-4">
              {this.state.error?.message}
            </pre>
            {this.state.info && (
              <details className="text-xs text-on-surface-variant">
                <summary>Detalhes do componente</summary>
                <pre className="mt-2 text-xs whitespace-pre-wrap">{this.state.info.componentStack}</pre>
              </details>
            )}
            <button
              onClick={() => location.reload()}
              className="mt-4 px-4 py-2 rounded-lg bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors"
            >
              Recarregar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}