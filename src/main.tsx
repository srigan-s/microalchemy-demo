import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

class AppErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError(): { failed: boolean } { return { failed: true } }
  render(): React.ReactNode {
    if (this.state.failed) return <main className="error-screen"><h1>FabFlow Twin paused safely</h1><p>The interface encountered an unexpected error. Reload the page to restart the local simulation.</p><button onClick={() => location.reload()}>Reload application</button></main>
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>)
