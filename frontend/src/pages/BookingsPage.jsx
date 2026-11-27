import React, { useEffect, useState } from 'react'
import { Ticket, Trash2, RefreshCw, Plane } from 'lucide-react'
import { bookingApi } from '../api/client'

export default function BookingsPage({ onNotify }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)

  const loadBookings = async () => {
    setLoading(true)
    try {
      const data = await bookingApi.listMine(0, 50)
      setBookings(Array.isArray(data) ? data : [])
    } catch (err) {
      onNotify(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const handleCancel = async (id) => {
    if (!window.confirm(`Cancel booking #${id}?`)) return
    setCancellingId(id)
    try {
      await bookingApi.cancel(id)
      onNotify(`Booking #${id} cancelled`, 'success')
      loadBookings()
    } catch (err) {
      onNotify(err.message, 'error')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="stack page-enter">
      <div className="page-header">
        <div>
          <h1>My Boarding Passes</h1>
          <p>Your confirmed tickets, seat assignments, and PNR references.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadBookings}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid-2">
          {[1, 2].map((n) => (
            <div className="card stack" key={n}>
              <div className="skeleton" style={{ height: '24px', width: '45%' }} />
              <div className="skeleton" style={{ height: '50px', width: '100%' }} />
              <div className="skeleton" style={{ height: '30px', width: '100%' }} />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="card empty-state">You have no flight bookings yet.</div>
      ) : (
        <div className="grid-2">
          {bookings.map((b, idx) => (
            <div
              className="boarding-pass stagger-item"
              style={{ animationDelay: `${idx * 65}ms` }}
              key={b.id}
            >
              <div className="row-between">
                <span className="badge badge-info mono">
                  <Ticket size={12} /> {b.booking_reference}
                </span>
                <span className={`badge ${b.status === 'confirmed' ? 'badge-success' : 'badge-danger'}`}>
                  {b.status}
                </span>
              </div>

              <div className="row-between" style={{ marginTop: '1rem' }}>
                <div>
                  <span className="muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    Passenger
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>
                    {b.passenger_name || 'Passenger'}
                  </div>
                  <div className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                    <Plane size={13} /> Flight #{b.flight_id} → <strong>{b.destination || '—'}</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    Fare Paid
                  </span>
                  <div className="mono" style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)' }}>
                    ₹{b.price_paid}
                  </div>
                  <div className="muted mono" style={{ fontSize: '0.82rem' }}>
                    Seat {b.seat_number || '—'} · {b.seat_type}
                  </div>
                </div>
              </div>

              <div className="boarding-divider" />

              <div className="row-between">
                <span className="muted" style={{ fontSize: '0.78rem' }}>
                  Issued: {new Date(b.booked_at).toLocaleString()}
                </span>
                {b.status !== 'cancelled' && (
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={cancellingId === b.id}
                    onClick={() => handleCancel(b.id)}
                  >
                    <Trash2 size={14} /> {cancellingId === b.id ? 'Cancelling...' : 'Cancel Ticket'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
