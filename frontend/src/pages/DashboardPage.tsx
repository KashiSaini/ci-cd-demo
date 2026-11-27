import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Ticket, Trash2, RefreshCw, Plane, User } from 'lucide-react'
import { bookingApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import type { BookingResponse } from '../types'

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const { notify } = useToast()
  const [bookings, setBookings] = useState<BookingResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  const loadBookings = async () => {
    setLoading(true)
    try {
      const data = await bookingApi.listMine(0, 50)
      setBookings(Array.isArray(data) ? data : [])
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to load bookings', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const handleCancel = async (id: number) => {
    if (!window.confirm(`Cancel booking #${id}?`)) return
    setCancellingId(id)
    try {
      await bookingApi.cancel(id)
      notify(`Booking #${id} cancelled`, 'success')
      loadBookings()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Cancellation failed', 'error')
    } finally {
      setCancellingId(null)
    }
  }

  const totalSpent = bookings.reduce((sum, b) => sum + Number(b.price_paid || 0), 0)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Profile Strip */}
      <div className="rounded-2xl bg-navy-950 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-coral-500 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold">{user?.email}</h1>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded bg-coral-500/25 text-orange-300 text-[10px] font-bold uppercase">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Account ID #{user?.id}</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div>
            <div className="text-[11px] uppercase text-slate-400 font-bold">Trips</div>
            <div className="font-mono text-2xl font-extrabold">{bookings.length}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase text-slate-400 font-bold">Total Spent</div>
            <div className="font-mono text-2xl font-extrabold text-sky-400">₹{totalSpent.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-navy-900">My Boarding Passes</h2>
        <button
          onClick={loadBookings}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          You have no flight bookings yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {bookings.map((b, idx) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-mono text-xs font-bold">
                    <Ticket className="w-3.5 h-3.5" /> {b.booking_reference}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <div className="flex items-end justify-between mt-4">
                  <div>
                    <div className="text-[11px] uppercase font-bold text-slate-400">Passenger</div>
                    <div className="text-lg font-extrabold text-navy-900">{b.passenger_name || 'Passenger'}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Plane className="w-3.5 h-3.5 text-coral-500" /> Flight #{b.flight_id} → <strong>{b.destination}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xl font-extrabold text-navy-900">₹{b.price_paid}</div>
                    <div className="font-mono text-xs text-slate-500">
                      Seat {b.seat_number} · {b.seat_type}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative border-t-2 border-dashed border-slate-200 ticket-notch-left ticket-notch-right" />

              <div className="px-5 py-3.5 bg-slate-50/70 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Booked {new Date(b.booked_at).toLocaleString()}
                </span>
                {b.status !== 'cancelled' && (
                  <button
                    disabled={cancellingId === b.id}
                    onClick={() => handleCancel(b.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {cancellingId === b.id ? 'Cancelling...' : 'Cancel'}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
