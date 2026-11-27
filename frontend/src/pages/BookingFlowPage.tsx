import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2, Plane, Ticket, Users, Armchair } from 'lucide-react'
import { bookingApi, flightApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { computePriceForDestination, getAllowedDestinations } from '../utils/flightUtils'
import type { BookingResponse, FlightResponse, PassengerBooking, SeatResponse } from '../types'

export default function BookingFlowPage() {
  const { flightId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notify } = useToast()

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [flight, setFlight] = useState<FlightResponse | null>(
    (location.state as { flight?: FlightResponse } | null)?.flight ?? null
  )
  const [seats, setSeats] = useState<SeatResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSeats, setSelectedSeats] = useState<SeatResponse[]>([])
  const [passengers, setPassengers] = useState<PassengerBooking[]>([])
  const [contactEmail, setContactEmail] = useState(user?.email || '')
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState<BookingResponse[]>([])

  useEffect(() => {
    const id = Number(flightId)
    if (!id) return
    setLoading(true)
    Promise.all([
      flight ? Promise.resolve(flight) : flightApi.search().then((l) => l.find((x) => x.id === id) || null),
      flightApi.getSeats(id, false),
    ])
      .then(([f, s]) => {
        setFlight(f)
        setSeats(Array.isArray(s) ? s : [])
      })
      .catch((err) => notify(err instanceof Error ? err.message : 'Failed to load flight', 'error'))
      .finally(() => setLoading(false))
  }, [flightId])

  const allowedDestinations = useMemo(
    () => (flight ? getAllowedDestinations(flight) : []),
    [flight]
  )

  const toggleSeat = (seat: SeatResponse) => {
    if (seat.is_booked || !flight) return
    const exists = selectedSeats.some((s) => s.seat_number === seat.seat_number)
    if (exists) {
      setSelectedSeats((prev) => prev.filter((s) => s.seat_number !== seat.seat_number))
      setPassengers((prev) => prev.filter((p) => p.seat_number !== seat.seat_number))
    } else {
      setSelectedSeats((prev) => [...prev, seat])
      setPassengers((prev) => [
        ...prev,
        {
          passenger_name: '',
          destination: flight.destination,
          seat_type: seat.seat_type,
          seat_number: seat.seat_number,
        },
      ])
    }
  }

  const updatePassenger = (seatNumber: string, field: 'passenger_name' | 'destination', value: string) => {
    setPassengers((prev) =>
      prev.map((p) => (p.seat_number === seatNumber ? { ...p, [field]: value } : p))
    )
  }

  const totalFare = useMemo(() => {
    if (!flight) return 0
    return passengers.reduce(
      (sum, p) => sum + computePriceForDestination(flight, p.seat_type, p.destination),
      0
    )
  }, [flight, passengers])

  const handleConfirm = async () => {
    if (!flight) return
    setSubmitting(true)
    try {
      const res = await bookingApi.bookFlight(flight.id, {
        contact_email: contactEmail || null,
        passengers,
      })
      setConfirmed(res)
      setStep(4)
      notify(`Booked ${res.length} ticket(s) successfully!`, 'success')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Booking failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !flight) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
      </div>
    )
  }

  const steps = [
    { num: 1, label: 'Select Seats', icon: Armchair },
    { num: 2, label: 'Passengers', icon: Users },
    { num: 3, label: 'Review', icon: CheckCircle2 },
    { num: 4, label: 'Boarding Pass', icon: Ticket },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Stepper */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 p-4">
        {steps.map((s, idx) => {
          const active = step === s.num
          const done = step > s.num
          return (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : active
                      ? 'bg-coral-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {s.num}
                </div>
                <span className={`hidden sm:inline text-xs font-bold ${active || done ? 'text-navy-900' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && <div className="flex-1 h-0.5 bg-slate-200 mx-2" />}
            </React.Fragment>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-extrabold text-navy-900">Choose Your Seats</h2>
                <p className="text-xs text-slate-500">
                  {flight.airline || 'SkyBridge Air'} · {flight.source} → {flight.destination}
                </p>
              </div>
              <div className="flex gap-3 text-[11px] font-semibold">
                <span className="text-indigo-600">● Business</span>
                <span className="text-sky-600">● Premium</span>
                <span className="text-emerald-600">● Economy</span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-wrap gap-2.5 max-h-72 overflow-y-auto">
              {seats.map((seat) => {
                const selected = selectedSeats.some((s) => s.seat_number === seat.seat_number)
                const colorClass =
                  seat.seat_type === 'business'
                    ? 'border-indigo-300 text-indigo-700'
                    : seat.seat_type === 'premium'
                    ? 'border-sky-300 text-sky-700'
                    : 'border-emerald-300 text-emerald-700'
                return (
                  <motion.button
                    key={seat.id}
                    type="button"
                    whileHover={!seat.is_booked ? { scale: 1.08 } : undefined}
                    whileTap={!seat.is_booked ? { scale: 0.95 } : undefined}
                    disabled={seat.is_booked}
                    onClick={() => toggleSeat(seat)}
                    className={`px-3 py-2 rounded-lg font-mono text-xs font-bold border transition cursor-pointer ${
                      seat.is_booked
                        ? 'bg-slate-200 text-slate-400 border-slate-200 line-through cursor-not-allowed'
                        : selected
                        ? 'bg-coral-500 text-white border-coral-500 shadow-md shadow-orange-500/30'
                        : `bg-white ${colorClass}`
                    }`}
                  >
                    {seat.seat_number}
                  </motion.button>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="text-sm font-semibold text-slate-600">
                Selected: <span className="font-mono font-bold text-navy-900">{selectedSeats.length} seat(s)</span>
              </div>
              <button
                disabled={selectedSeats.length === 0}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-bold disabled:opacity-40 cursor-pointer"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
          >
            <div>
              <h2 className="text-xl font-extrabold text-navy-900">Passenger & Stop Details</h2>
              <p className="text-xs text-slate-500">
                Multi-stop flights automatically calculate segment fares based on each passenger&apos;s destination.
              </p>
            </div>

            <div className="space-y-3">
              {passengers.map((p) => {
                const segFare = computePriceForDestination(flight, p.seat_type, p.destination)
                return (
                  <div key={p.seat_number} className="rounded-xl bg-slate-50 border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Seat <span className="font-mono text-navy-900">{p.seat_number}</span> ({p.seat_type})
                      </label>
                      <input
                        required
                        value={p.passenger_name}
                        onChange={(e) => updatePassenger(p.seat_number, 'passenger_name', e.target.value)}
                        placeholder="Passenger Full Name"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Disembark At</label>
                      <select
                        value={p.destination}
                        onChange={(e) => updatePassenger(p.seat_number, 'destination', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      >
                        {allowedDestinations.map((dest) => (
                          <option key={dest} value={dest}>
                            {dest}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-right font-mono font-bold text-navy-900 text-base pb-1">
                      ₹{segFare.toLocaleString()}
                    </div>
                  </div>
                )
              })}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Confirmation Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="passenger@example.com"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => {
                  if (passengers.some((p) => !p.passenger_name.trim())) {
                    notify('Enter a name for every passenger', 'error')
                    return
                  }
                  setStep(3)
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-bold cursor-pointer"
              >
                Review Booking <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
          >
            <h2 className="text-xl font-extrabold text-navy-900">Review & Confirm</h2>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Flight</span>
                <span className="font-bold text-navy-900">{flight.airline} (#{flight.id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Route</span>
                <span className="font-bold text-navy-900">{flight.source} → {flight.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Passengers</span>
                <span className="font-bold text-navy-900">{passengers.length}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-base">
                <span className="font-bold text-navy-900">Total Fare</span>
                <span className="font-mono font-extrabold text-coral-600">₹{totalFare.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                disabled={submitting}
                onClick={handleConfirm}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-coral-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-500/25 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? 'Confirming...' : `Confirm & Pay ₹${totalFare.toLocaleString()}`}
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-emerald-200 p-8 text-center space-y-5"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-navy-900">Booking Confirmed!</h2>
              <p className="text-sm text-slate-500 mt-1">Your boarding passes are ready in your dashboard.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {confirmed.map((b) => (
                <div key={b.id} className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                      PNR: {b.booking_reference}
                    </span>
                    <span className="font-mono font-bold text-navy-900">₹{b.price_paid}</span>
                  </div>
                  <div className="font-bold text-navy-900 mt-2">{b.passenger_name}</div>
                  <div className="text-xs text-slate-500">
                    Seat {b.seat_number} ({b.seat_type}) · To {b.destination}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-bold cursor-pointer"
            >
              <Ticket className="w-4 h-4" /> View My Trips
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
