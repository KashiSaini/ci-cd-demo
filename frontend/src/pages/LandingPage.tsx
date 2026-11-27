import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plane, Search, Sparkles, ShieldCheck, ArrowRight, Compass, Clock, Globe } from 'lucide-react'
import type { SeatClass } from '../types'

export default function LandingPage() {
  const navigate = useNavigate()
  const [source, setSource] = useState('')
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [seatClass, setSeatClass] = useState<SeatClass | ''>('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const qs = new URLSearchParams()
    if (source) qs.set('source', source)
    if (destination) qs.set('destination', destination)
    if (date) qs.set('departure_date', date)
    if (seatClass) qs.set('seat_class', seatClass)
    navigate(`/flights${qs.toString() ? `?${qs.toString()}` : ''}`)
  }

  return (
    <div className="space-y-16 pb-16">
      {/* Deep Navy Aviation Hero */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(14,165,233,0.28),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(255,90,54,0.2),_transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-28 sm:pt-24 sm:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-sky-300 text-xs font-bold uppercase tracking-wider mb-5">
              <Compass className="w-3.5 h-3.5 text-coral-500" /> Multi-Stop Commercial & Private Aviation
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
              Seamless journeys across{' '}
              <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-orange-300 bg-clip-text text-transparent">
                every horizon.
              </span>
            </h1>
            <p className="mt-5 text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
              Book direct or multi-stop commercial flights with live cabin seat maps and transparent
              segment fares—or charter a private jet by the hour.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Floating Search Bar */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-24 relative z-10">
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="bg-white rounded-2xl shadow-2xl shadow-navy-950/12 border border-slate-200/80 p-5 sm:p-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                From
              </label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Delhi, Mumbai..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-navy-900 focus:bg-white focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                To
              </label>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Dubai, Bengaluru..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-navy-900 focus:bg-white focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Departure Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-navy-900 focus:bg-white focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Cabin Class
              </label>
              <select
                value={seatClass}
                onChange={(e) => setSeatClass(e.target.value as SeatClass | '')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-navy-900 focus:bg-white focus:border-sky-500 focus:outline-none"
              >
                <option value="">All Cabins</option>
                <option value="economy">Economy</option>
                <option value="premium">Premium</option>
                <option value="business">Business</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-coral-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/30 hover:brightness-105 transition cursor-pointer"
              >
                <Search className="w-4 h-4" /> Search Flights
              </button>
            </div>
          </div>
        </motion.form>
      </section>

      {/* Value Pillars (Clean Editorial Layout, not repetitive SaaS cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: Globe,
            color: 'text-sky-600 bg-sky-100',
            title: 'Multi-Stop Segment Pricing',
            desc: 'Disembark at any intermediate stop along the route and pay strictly for the segments you fly.',
          },
          {
            icon: Clock,
            color: 'text-coral-600 bg-orange-100',
            title: 'Real-Time Cabin Seat Locks',
            desc: 'Live PostgreSQL row-level locking prevents double bookings across Economy, Premium, and Business.',
          },
          {
            icon: Sparkles,
            color: 'text-amber-600 bg-amber-100',
            title: 'On-Demand Private Charters',
            desc: 'Reserve executive aircraft by the hour with instant availability updates and transparent hourly rates.',
          },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-4"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-navy-900 text-base">{item.title}</h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Private Jet Spotlight Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-slate-900 text-white p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/10">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> SkyBridge Executive
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-2">
              Fly on your own schedule with Private Jet Charters
            </h2>
            <p className="text-slate-300 text-sm mt-2">
              Browse available aircraft, choose your exact departure and arrival window, and confirm instantly.
            </p>
          </div>
          <Link
            to="/private-jets"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 text-navy-950 font-bold text-sm hover:bg-amber-300 transition shrink-0"
          >
            Explore Private Fleet <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
