import React, { useEffect, useMemo, useState } from 'react'
import { X, Trash2, CheckCircle2, Plane } from 'lucide-react'
import { bookingApi, flightApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function BookingModal({ flight, onClose, onBooked, onNotify }) {
  const { user } = useAuth()
  const [seats, setSeats] = useState([])
  const [loadingSeats, setLoadingSeats] = useState(true)
  const [contactEmail, setContactEmail] = useState(user?.email || '')
  const [selectedSeats, setSelectedSeats] = useState([])
  const [passengers, setPassengers] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const allowedDestinations = useMemo(() => {
    const list = []
    if (Array.isArray(flight.stops)) list.push(...flight.stops)
    list.push(flight.destination)
    return list
  }, [flight])

  useEffect(() => {
    setLoadingSeats(true)
    flightApi
      .getSeats(flight.id, false)
      .then((data) => setSeats(Array.isArray(data) ? data : []))
      .catch((err) => onNotify(err.message, 'error'))
      .finally(() => setLoadingSeats(false))
  }, [flight.id, onNotify])

  const toggleSeat = (seat) => {
    if (seat.is_booked) return
    const exists = selectedSeats.find((s) => s.seat_number === seat.seat_number)
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

  const updatePassenger = (seatNumber, field, value) => {
    setPassengers((prev) =>
      prev.map((p) => (p.seat_number === seatNumber ? { ...p, [field]: value } : p))
    )
  }

  const estimateSeatPrice = (seatType) => Number(flight[`${seatType}_price`] || 0)
  const totalEstimate = passengers.reduce((sum, p) => sum + estimateSeatPrice(p.seat_type), 0)

  const handleConfirm = async (e) => {
    e.preventDefault()
    if (passengers.length === 0) {
      onNotify('Select at least one available seat first', 'error')
      return
    }
    if (passengers.some((p) => !p.passenger_name.trim())) {
      onNotify('Enter a name for every selected passenger', 'error')
      return
    }

    setSubmitting(true)
    try {
      const created = await bookingApi.bookFlight(flight.id, {
        contact_email: contactEmail || null,
        passengers,
      })
      onNotify(`Booked ${created.length} ticket(s) successfully!`, 'success')
      onBooked(created)
    } catch (err) {
      onNotify(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-info">
                <Plane size={12} /> Flight #{flight.id}
              </span>
              <span className="muted">{flight.airline || 'SkyBridge Air'}</span>
            </div>
            <h2 style={{ marginTop: '0.35rem' }}>
              {flight.source} → {flight.destination}
            </h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form className="stack" onSubmit={handleConfirm}>
          <div>
            <div className="row-between" style={{ marginBottom: '0.55rem' }}>
              <strong>1. Interactive Cabin Seat Map</strong>
              <span className="muted" style={{ fontSize: '0.78rem' }}>
                Purple: Business · Blue: Premium · Green: Economy
              </span>
            </div>

            <div className="cabin-shell">
              {loadingSeats ? (
                <div className="skeleton" style={{ height: '90px' }} />
              ) : seats.length === 0 ? (
                <p className="muted">No seats configured for this flight.</p>
              ) : (
                <div className="seat-grid">
                  {seats.map((seat) => {
                    const isSelected = selectedSeats.some((s) => s.seat_number === seat.seat_number)
                    return (
                      <button
                        type="button"
                        key={seat.id}
                        disabled={seat.is_booked}
                        onClick={() => toggleSeat(seat)}
                        className={`seat-chip ${seat.seat_type} ${isSelected ? 'selected' : ''} ${seat.is_booked ? 'booked' : ''}`}
                        title={`${seat.seat_number} (${seat.seat_type}) — ${seat.is_booked ? 'Booked' : 'Available'}`}
                      >
                        {seat.seat_number}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="field">
            <label>Confirmation Email (optional)</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="passenger@example.com"
            />
          </div>

          {passengers.length > 0 && (
            <div className="stack">
              <strong>2. Passenger Details ({passengers.length})</strong>
              {passengers.map((p, idx) => (
                <div
                  key={p.seat_number}
                  className="card stagger-item"
                  style={{
                    padding: '0.9rem',
                    background: 'rgba(7, 13, 28, 0.7)',
                    animationDelay: `${idx * 40}ms`,
                  }}
                >
                  <div className="form-grid">
                    <div className="field">
                      <label>
                        Seat <span className="mono">{p.seat_number}</span> ({p.seat_type})
                      </label>
                      <input
                        required
                        placeholder="Passenger Full Name"
                        value={p.passenger_name}
                        onChange={(e) => updatePassenger(p.seat_number, 'passenger_name', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Destination</label>
                      <select
                        value={p.destination}
                        onChange={(e) => updatePassenger(p.seat_number, 'destination', e.target.value)}
                      >
                        {allowedDestinations.map((dest) => (
                          <option key={dest} value={dest}>
                            {dest}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field" style={{ justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => toggleSeat({ seat_number: p.seat_number, is_booked: false })}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="row-between" style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <div>
              <span className="muted">Estimated Total</span>
              <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)' }}>
                ₹{totalEstimate.toLocaleString()}
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting || passengers.length === 0}>
              <CheckCircle2 size={16} />
              {submitting ? 'Confirming...' : `Confirm Booking (${passengers.length})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
