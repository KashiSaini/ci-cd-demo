import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Clock, RefreshCw, X, CheckCircle2 } from 'lucide-react'
import { privateJetApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import type { PrivateJetBookingResponse, PrivateJetResponse } from '../types'

export default function PrivateJetsPage() {
  const { isAuthenticated } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [jets, setJets] = useState<PrivateJetResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [selectedJet, setSelectedJet] = useState<PrivateJetResponse | null>(null)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [recentBooking, setRecentBooking] = useState<PrivateJetBookingResponse | null>(null)
  const [cancelId, setCancelId] = useState('')

  const loadJets = async () => {
    setLoading(true)
    try {
      const data = await privateJetApi.list(onlyAvailable)
      setJets(Array.isArray(data) ? data : [])
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to load private jets', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJets()
  }, [onlyAvailable])

  const estimatedHours =
    startTime && endTime
      ? Math.max(0, (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60))
      : 0

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJet || estimatedHours <= 0) {
      notify('End time must be after start time', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await privateJetApi.book(selectedJet.id, {
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      })
      setRecentBooking(res)
      notify(`Charter confirmed! Booking ID #${res.id}`, 'success')
      setSelectedJet(null)
      loadJets()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Charter failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cancelId) return
    try {
      const res = await privateJetApi.cancelBooking(Number(cancelId))
      notify(res.message || 'Charter cancelled', 'success')
      setCancelId('')
      loadJets()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Cancellation failed', 'error')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="rounded-3xl bg-navy-950 text-white p-7 sm:p-9 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> SkyBridge Executive Fleet
          </span>
          <h1 className="text-3xl font-extrabold mt-1">Private Jet Charters</h1>
          <p className="text-sm text-slate-300 mt-1">
            Reserve bespoke aircraft by the hour with instant availability.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="rounded accent-amber-400"
            />
            Available only
          </label>
          <button
            onClick={loadJets}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {recentBooking && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
          <div className="text-sm">
            <strong className="text-emerald-900">Latest Charter Confirmed — Booking #{recentBooking.id}</strong>
            <p className="text-emerald-700 text-xs">
              Jet #{recentBooking.private_jet_id} · Paid ₹{recentBooking.price_paid} · Status: {recentBooking.status}
            </p>
          </div>
          <button onClick={() => setRecentBooking(null)} className="text-xs font-bold text-emerald-700">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-52 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : jets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          No private jets listed yet. Admins can add aircraft from Control Tower.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {jets.map((jet, idx) => (
            <motion.div
              key={jet.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                    Jet #{jet.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      jet.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {jet.is_available ? 'Available' : 'Chartered'}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-navy-900">{jet.name}</h3>
                <p className="text-sm text-slate-600">{jet.description || 'Executive charter aircraft'}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="font-mono text-2xl font-extrabold text-navy-900">
                  ₹{jet.price_per_hour.toLocaleString()}
                  <span className="font-sans text-xs font-medium text-slate-500"> / hour</span>
                </div>
                <button
                  disabled={!jet.is_available}
                  onClick={() => {
                    if (!isAuthenticated) {
                      notify('Please sign in to charter a private jet', 'error')
                      navigate('/auth')
                    } else {
                      setSelectedJet(jet)
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-bold hover:bg-navy-800 disabled:opacity-40 transition cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  {jet.is_available ? 'Charter Aircraft' : 'Unavailable'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {isAuthenticated && (
        <form
          onSubmit={handleCancel}
          className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h3 className="font-bold text-navy-900 text-sm">Cancel a Private Jet Booking</h3>
            <p className="text-xs text-slate-500">Enter your charter Booking ID to release the aircraft.</p>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={cancelId}
              onChange={(e) => setCancelId(e.target.value)}
              placeholder="Booking ID"
              className="w-36 rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold hover:bg-rose-100 cursor-pointer"
            >
              Cancel Charter
            </button>
          </div>
        </form>
      )}

      <AnimatePresence>
        {selectedJet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedJet(null)}
            className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-navy-900">Charter {selectedJet.name}</h2>
                  <p className="text-xs font-mono text-slate-500">₹{selectedJet.price_per_hour.toLocaleString()} / hr</p>
                </div>
                <button onClick={() => setSelectedJet(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleBook} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <div className="text-xs text-slate-500">{estimatedHours.toFixed(1)} hr(s)</div>
                    <div className="font-mono text-xl font-extrabold text-navy-900">
                      ₹{Math.round(estimatedHours * selectedJet.price_per_hour).toLocaleString()}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-coral-500 text-white text-sm font-bold cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> {submitting ? 'Booking...' : 'Confirm'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
