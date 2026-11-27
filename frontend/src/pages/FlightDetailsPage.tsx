import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Plane, Clock, Calendar, ArrowRight, Armchair } from 'lucide-react'
import { flightApi } from '../api/client'
import { useToast } from '../context/ToastContext'
import RouteTimeline from '../components/RouteTimeline'
import { formatDuration, formatShortDate, formatTime } from '../utils/flightUtils'
import type { FlightResponse, SeatResponse } from '../types'

export default function FlightDetailsPage() {
  const { flightId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { notify } = useToast()

  const [flight, setFlight] = useState<FlightResponse | null>(
    (location.state as { flight?: FlightResponse } | null)?.flight ?? null
  )
  const [seats, setSeats] = useState<SeatResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = Number(flightId)
    if (!id) return
    setLoading(true)
    Promise.all([
      flight ? Promise.resolve(flight) : flightApi.search().then((list) => list.find((x) => x.id === id) || null),
      flightApi.getSeats(id, false),
    ])
      .then(([f, s]) => {
        setFlight(f)
        setSeats(Array.isArray(s) ? s : [])
      })
      .catch((err) => notify(err instanceof Error ? err.message : 'Failed to load flight details', 'error'))
      .finally(() => setLoading(false))
  }, [flightId])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
        <div className="h-44 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="h-56 rounded-2xl bg-slate-200 animate-pulse" />
      </div>
    )
  }

  if (!flight) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-navy-900">Flight not found</h2>
        <button
          onClick={() => navigate('/flights')}
          className="mt-4 px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-bold"
        >
          Back to Flights
        </button>
      </div>
    )
  }

  const availCount = (cls: string) => seats.filter((s) => s.seat_type === cls && !s.is_booked).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6"
    >
      <button
        onClick={() => navigate('/flights')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-navy-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Search Results
      </button>

      {/* Header Summary */}
      <div className="rounded-2xl bg-navy-950 text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold">
              {flight.airline || 'SkyBridge Air'}
            </span>
            <span className="font-mono text-xs text-slate-400">FLT-{String(flight.id).padStart(3, '0')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            {flight.source} → {flight.destination}
          </h1>
          <div className="flex items-center gap-5 text-xs text-slate-300 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-400" /> {formatShortDate(flight.departure_time)} ({formatTime(flight.departure_time)} – {formatTime(flight.arrival_time)})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-coral-500" /> {formatDuration(flight.departure_time, flight.arrival_time)}
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate(`/book/${flight.id}`, { state: { flight } })}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-coral-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/30 hover:brightness-105 transition cursor-pointer shrink-0"
        >
          Select Seats & Book <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Route Timeline & Segment Pricing */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-navy-900">Complete Route & Segment Breakdown</h2>
        <RouteTimeline
          source={flight.source}
          stops={flight.stops}
          destination={flight.destination}
          segmentPrices={flight.segment_prices}
        />
      </div>

      {/* Cabin Classes & Live Availability */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: 'economy', label: 'Economy', price: flight.economy_price, accent: 'border-emerald-200 bg-emerald-50/40' },
          { key: 'premium', label: 'Premium', price: flight.premium_price, accent: 'border-sky-200 bg-sky-50/40' },
          { key: 'business', label: 'Business', price: flight.business_price, accent: 'border-indigo-200 bg-indigo-50/40' },
        ].map((c) => (
          <div key={c.key} className={`rounded-2xl border p-5 space-y-2 ${c.accent}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy-900">{c.label} Class</span>
              <Armchair className="w-4 h-4 text-slate-500" />
            </div>
            <div className="font-mono text-2xl font-extrabold text-navy-900">
              {c.price != null ? `₹${c.price.toLocaleString()}` : '—'}
            </div>
            <p className="text-xs text-slate-600">
              <strong>{availCount(c.key)}</strong> seats currently open
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
