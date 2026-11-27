import React, { useState } from 'react'
import { LogIn, UserPlus, Plane } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AuthPage({ onSuccess, onNotify }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'register') {
        await register(name, email, password)
        onNotify('Account created! Signing you in...', 'success')
        await login(email, password)
      } else {
        await login(email, password)
        onNotify('Welcome back aboard!', 'success')
      }
      onSuccess()
    } catch (err) {
      onNotify(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper page-enter">
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <span className="brand-icon" style={{ display: 'inline-flex', marginBottom: '0.7rem' }}>
            <Plane size={22} />
          </span>
          <h2>{mode === 'login' ? 'Welcome Back' : 'Join SkyBridge'}</h2>
          <p className="muted" style={{ marginTop: '0.2rem' }}>
            {mode === 'login'
              ? 'Sign in to manage flights, seats, and private charters.'
              : 'Create your account in seconds.'}
          </p>
        </div>

        <div className="tabs" style={{ justifyContent: 'center' }}>
          <button
            className={`tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Sign In
          </button>
          <button
            className={`tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Create Account
          </button>
        </div>

        <form className="stack" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="field">
              <label>Full Name</label>
              <input
                required
                placeholder="Nishant Saini"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label>Email Address</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Register & Sign In'}
          </button>

          {mode === 'register' && (
            <p className="muted" style={{ fontSize: '0.78rem', textAlign: 'center' }}>
              Registering with the configured <code className="mono">ADMIN_EMAIL</code> automatically grants Admin access.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
