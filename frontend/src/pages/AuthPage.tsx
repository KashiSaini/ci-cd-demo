import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Plane, LogIn, UserPlus, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(4, 'Password is required'),
})

const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
})

type FormValues = {
  name?: string
  email: string
  password: string
}

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const { login, register: registerUser } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(mode === 'login' ? loginSchema : registerSchema),
  })

  const onSubmit = async (values: FormValues) => {
    try {
      if (mode === 'register') {
        await registerUser(values.name || '', values.email, values.password)
        notify('Account created! Signing you in...', 'success')
        await login(values.email, values.password)
      } else {
        await login(values.email, values.password)
        notify('Welcome back aboard!', 'success')
      }
      navigate('/flights')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Authentication failed', 'error')
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-2">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex flex-col justify-between bg-navy-950 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.32),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(255,90,54,0.22),_transparent_50%)]" />
        <div className="relative z-10 flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-coral-500 flex items-center justify-center">
            <Plane className="w-5 h-5" />
          </span>
          <span className="font-display font-extrabold text-xl">SkyBridge</span>
        </div>
        <div className="relative z-10 max-w-md space-y-4">
          <h2 className="text-4xl font-extrabold leading-tight">
            Your boarding pass to smarter air travel.
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Secured with JWT access tokens, Redis-backed refresh sessions, and instant role-based access for passengers and airline admins.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          End-to-end microservices authentication
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8"
        >
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                reset()
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition cursor-pointer ${
                mode === 'login' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                reset()
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition cursor-pointer ${
                mode === 'register' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label>
                <input
                  {...register('name')}
                  placeholder="Nishant Saini"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-sky-500 focus:outline-none"
                />
                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
              <input
                type="email"
                {...register('email')}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-sky-500 focus:outline-none"
              />
              {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Password</label>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-sky-500 focus:outline-none"
              />
              {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-coral-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:brightness-105 disabled:opacity-50 transition cursor-pointer"
            >
              {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            {mode === 'register' && (
              <p className="text-xs text-slate-500 text-center pt-1">
                Tip: Registering with <code className="font-mono text-navy-900">ADMIN_EMAIL</code> grants Control Tower access.
              </p>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  )
}
