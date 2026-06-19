import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import { registerSW } from 'virtual:pwa-register'

function UpdateBanner() {
  const [needsUpdate, setNeedsUpdate] = useState(false)
  const [updateSW, setUpdateSW] = useState(null)

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        setNeedsUpdate(true)
        setUpdateSW(() => update)
      },
      onOfflineReady() {},
    })
  }, [])

  if (!needsUpdate) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: '#EE4266', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px', fontSize: 14, fontWeight: 500,
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    }}>
      <span>New version available</span>
      <button
        onClick={() => updateSW?.(true)}
        style={{
          background: '#fff', color: '#EE4266', border: 'none',
          borderRadius: 6, padding: '5px 14px', fontWeight: 700,
          fontSize: 13, cursor: 'pointer',
        }}
      >
        Update now
      </button>
    </div>
  )
}

const SITE_PASSWORD = import.meta.env.VITE_SITE_PASSWORD

function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(
    !SITE_PASSWORD || sessionStorage.getItem('trainiac_auth') === 'ok'
  )
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  if (unlocked) return children

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input === SITE_PASSWORD) {
      sessionStorage.setItem('trainiac_auth', 'ok')
      setUnlocked(true)
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1B1340', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '40px 36px', width: 320,
        textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
      }}>
        <img src="/logo.png" alt="Trainiac" style={{ width: 48, marginBottom: 16 }} />
        <h2 style={{ margin: '0 0 6px', fontSize: 20, color: '#1B1340' }}>Trainiac AI Coach</h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B7280' }}>Enter the access password to continue</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            placeholder="Password"
            autoFocus
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 15,
              border: error ? '1.5px solid #F2496B' : '1.5px solid #E0E0E0',
              outline: 'none', boxSizing: 'border-box', marginBottom: 8,
            }}
          />
          {error && <p style={{ color: '#F2496B', fontSize: 13, margin: '0 0 8px' }}>Incorrect password</p>}
          <button type="submit" style={{
            width: '100%', padding: '11px', borderRadius: 8, background: '#F2496B',
            color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', marginTop: 4,
          }}>
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', background: '#1e1e2e', color: '#f38ba8', minHeight: '100vh' }}>
          <h2 style={{ color: '#cba6f7' }}>React Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, color: '#a6e3a1', marginTop: 16 }}>{this.state.error?.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <UpdateBanner />
      <PasswordGate>
        <App />
      </PasswordGate>
    </ErrorBoundary>
  </React.StrictMode>
)
