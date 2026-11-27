import React, { useEffect, useState } from 'react'
import { Plane, Ticket, Sparkles, ShieldCheck, LogOut, LogIn, Activity } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/client'

export default function Navbar({ activePage, setActivePage, onNotify }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const [apiOnline, setApiOnline] = useState(null)

  useEffect(() => {
    authApi
      .ping()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    onNotify('Logged out successfully', 'success')
    setActivePage('flights')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand" onClick={() => setActivePage('flights')}>
          <span className="brand-icon">
            <Plane size={18} />
          </span>
          <span>SkyBridge</span>
          <span
            className={`badge ${apiOnline === true ? 'badge-success' : apiOnline === false ? 'badge-danger' : 'badge-info'}`}
            title="Auth service /auth/ping status"
          >
            <Activity size={11} />
            {apiOnline === true ? 'API Live' : apiOnline === false ? 'Offline' : '...'}
          </span>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-btn ${activePage === 'flights' ? 'active' : ''}`}
            onClick={() => setActivePage('flights')}
          >
            <Plane size={16} /> Flights
          </button>

          <button
            className={`nav-btn ${activePage === 'jets' ? 'active' : ''}`}
            onClick={() => setActivePage('jets')}
          >
            <Sparkles size={16} /> Private Jets
          </button>

          {isAuthenticated && (
            <button
              className={`nav-btn ${activePage === 'bookings' ? 'active' : ''}`}
              onClick={() => setActivePage('bookings')}
            >
              <Ticket size={16} /> My Bookings
            </button>
          )}

          {isAdmin && (
            <button
              className={`nav-btn ${activePage === 'admin' ? 'active' : ''}`}
              onClick={() => setActivePage('admin')}
            >
              <ShieldCheck size={16} /> Admin
            </button>
          )}
        </nav>

        <div className="nav-right">
          {isAuthenticated ? (
            <>
              <div className="user-pill">
                <span>{user.email}</span>
                {isAdmin && <span className="badge badge-admin">Admin</span>}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setActivePage('auth')}
            >
              <LogIn size={15} /> Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
