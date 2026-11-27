import React, { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plane, Sparkles, Ticket, ShieldCheck, LogOut, LogIn, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { authApi } from '../api/client'

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    authApi
      .ping()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    notify('Signed out safely', 'success')
    navigate('/')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
      isActive
        ? 'bg-white/12 text-white shadow-sm'
        : 'text-slate-300 hover:text-white hover:bg-white/6'
    }`

  return (
    <header className="sticky top-0 z-40 bg-navy-950/92 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.span
              whileHover={{ rotate: -10, scale: 1.06 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-coral-500 to-orange-400 text-white flex items-center justify-center shadow-lg shadow-orange-500/25"
            >
              <Plane className="w-5 h-5" />
            </motion.span>
            <span className="font-display font-extrabold text-lg tracking-tight text-white">
              Sky<span className="text-sky-400">Bridge</span>
            </span>
          </Link>

          <span
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
              apiOnline === true
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                : apiOnline === false
                ? 'bg-rose-500/15 text-rose-300 border-rose-400/30'
                : 'bg-sky-500/15 text-sky-300 border-sky-400/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                apiOnline === true ? 'bg-emerald-400 animate-pulse' : apiOnline === false ? 'bg-rose-400' : 'bg-sky-400'
              }`}
            />
            {apiOnline === true ? 'API Live' : apiOnline === false ? 'Offline' : 'Checking'}
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/flights" className={navLinkClass}>
            <Plane className="w-4 h-4" /> Flights
          </NavLink>
          <NavLink to="/private-jets" className={navLinkClass}>
            <Sparkles className="w-4 h-4 text-amber-400" /> Private Jets
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" className={navLinkClass}>
              <Ticket className="w-4 h-4 text-sky-400" /> My Trips
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              <ShieldCheck className="w-4 h-4 text-coral-500" /> Control Tower
            </NavLink>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 text-xs text-slate-200">
                <span className="max-w-[160px] truncate">{user?.email}</span>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 rounded bg-coral-500/25 text-orange-300 font-bold uppercase text-[10px]">
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-coral-500 to-orange-500 hover:brightness-110 shadow-md shadow-orange-500/25 transition"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-navy-950 px-4 py-3 flex flex-col gap-1.5">
          <NavLink to="/flights" onClick={() => setMobileOpen(false)} className={navLinkClass}>
            <Plane className="w-4 h-4" /> Flights
          </NavLink>
          <NavLink to="/private-jets" onClick={() => setMobileOpen(false)} className={navLinkClass}>
            <Sparkles className="w-4 h-4 text-amber-400" /> Private Jets
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              <Ticket className="w-4 h-4 text-sky-400" /> My Trips
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              <ShieldCheck className="w-4 h-4 text-coral-500" /> Control Tower
            </NavLink>
          )}
          <div className="pt-2 mt-1 border-t border-white/10">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" /> Sign Out ({user?.email})
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-coral-500 text-white text-sm font-bold"
              >
                <LogIn className="w-4 h-4" /> Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
