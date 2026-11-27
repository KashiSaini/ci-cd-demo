import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Plane, Calendar, Clock, ArrowRight, RotateCcw } from 'lucide-react'
import { flightApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import RouteTimeline from '../components/RouteTimeline'
import { formatDuration, formatShortDate, formatTime, getLowestFare } from '../utils/flightUtils'
import type { FlightResponse, SeatClass } from '../types'

export default function FlightsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { notify } = useToast()

  const [flights, setFlights] = useState<FlightResponse[]>([])
  const [loading, setLoading] = useState(true)

const [filters, setFilters] = useState<{
    source: string
    destination: string
    departure_date: string
    seat_class: SeatClass | ''
    price_max: string
  }>({
    source: searchParams.get('source') || '',
    destination: searchParams.get('destination') || '',
    departure_date: searchParams.get('departure_date') || '',
    seat_class: (searchParams.get('seat_class') as SeatClass | '') || '',
    price_max: searchParams.get('price_max') || '',
  })

  const fetchFlights = async (activeFilters = filters) => {
    setLoading(true)
    try {
      const hasFilters = Object.values(activeFilters).some((v) => v !== '')
      const data =
        hasFilters || !isAuthenticated
          ? await flightApi.search(activeFilters)
          : await flightApi.listAll(0, 100)
      setFlights(Array.isArray(data) ? data : [])
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to load flights', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlights(filters)
  }, [isAuthenticated])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const next = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v) next.set(k, v)
    })
    setSearchParams(next)
    fetchFlights(filters)
  }

  const handleReset = () => {
    const empty = { source: '', destination: '', departure_date: '', seat_class: '' as SeatClass | '', price_max: '' }
    setFilters(empty)
    setSearchParams({})
    fetchFlights(empty)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-navy-900">Search Flights</h1>
        <p className="text-sm text-slate-600 mt-1">
          Filter by departure, destination (including intermediate stops), date, cabin class, and budget.
        </p>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 items-end"
      >
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">From</label>
          <input
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            placeholder="Delhi"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">To</label>
          <input
            value={filters.destination}
            onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
            placeholder="Mumbai / Dubai"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
          <input
            type="date"
            value={filters.departure_date}
            onChange={(e) => setFilters({ ...filters, departure_date: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Class</label>
          <select
            value={filters.seat_class}
            onChange={(e) => setFilters({ ...filters, seat_class: e.target.value as SeatClass | '' })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:border-sky-500 focus:outline-none"
          >
            <option value="">Any Class</option>
            <option value="economy">Economy</option>
            <option value="premium">Premium</option>
            <option value="business">Business</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Max Price (₹)</label>
          <input
            type="number"
            min="0"
            value={filters.price_max}
            onChange={(e) => setFilters({ ...filters, price_max: e.target.value })}
            placeholder="15000"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-navy-900 text-white font-bold text-sm hover:bg-navy-800 transition cursor-pointer"
          >
            <Search className="w-4 h-4" /> Search
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
            title="Reset filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-36 rounded-2xl bg-slate-200/70 animate-pulse" />
          ))}
        </div>
      ) : flights.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Plane className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-navy-900">No flights found</h3>
          <p className="text-sm text-slate-500 mt-1">
            Try clearing your filters or create a flight from the Admin Control Tower.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {flights.map((f, idx) => {
            const lowest = getLowestFare(f)
            const totalSeats = (f.economy_seats || 0) + (f.premium_seats || 0) + (f.business_seats || 0)
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl border border-slate-200 hover:border-sky-300 shadow-sm hover:shadow-md transition p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-900 text-white text-xs font-bold">
                      <Plane className="w-3.5 h-3.5 text-sky-400" /> {f.airline || 'SkyBridge Air'}
                    </span>
                    <span className="font-mono text-xs text-slate-500">FLT-{String(f.id).padStart(3, '0')}</span>
                    <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full">
                      {f.stops && f.stops.length > 0 ? `${f.stops.length} Stop${f.stops.length > 1 ? 's' : ''}` : 'Non-stop'}
                    </span>
                    <span className="text-xs text-slate-500">{totalSeats} seats left</span>
                  </div>

                  <RouteTimeline
                    source={f.source}
                    stops={f.stops}
                    destination={f.destination}
                    compact
                  />

                  <div className="flex items-center gap-5 text-xs text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {formatShortDate(f.departure_time)} · {formatTime(f.departure_time)} → {formatTime(f.arrival_time)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {formatDuration(f.departure_time, f.arrival_time)}
                    </span>
                  </div>
                </div>

                <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 min-w-[200px]">
                  <div className="lg:text-right">
                    <div className="text-[11px] uppercase font-bold text-slate-400">Starting from</div>
                    <div className="font-mono text-2xl font-extrabold text-navy-900">
                      {lowest != null ? `₹${lowest.toLocaleString()}` : 'TBA'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/flights/${f.id}`, { state: { flight: f } })}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-navy-900 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => navigate(`/book/${f.id}`, { state: { flight: f } })}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-coral-500 to-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20 hover:brightness-105 transition cursor-pointer"
                    >
                      Book <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
