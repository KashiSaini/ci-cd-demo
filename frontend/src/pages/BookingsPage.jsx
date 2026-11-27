import React, { useEffect, useState } from 'react'
import { Ticket, Trash2, RefreshCw } from 'lucide-react'
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
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>My Flight Bookings</h1>
          <p>View your confirmed tickets, seat assignments, and booking references.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadBookings}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="card empty-state">Loading your bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="card empty-state">You have no flight bookings yet.</div>
      ) : (
        <div className="grid-2">
          {bookings.map((b) => (
            <div className="card stack" key={b.id}>
              <div className="row-between">
                <span className="badge badge-info">
                  <Ticket size={12} /> {b.booking_reference}
                </span>
                <span className={`badge ${b.status === 'confirmed' ? 'badge-success' : 'badge-danger'}`}>
                  {b.status}
                </span>
              </div>

              <div className="row-between">
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    {b.passenger_name || 'Passenger'}
                  </div>
                  <div className="muted">
                    Flight #{b.flight_id} · Destination: {b.destination || '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{b.price_paid}</div>
                  <div className="muted">
                    Seat {b.seat_number || '—'} ({b.seat_type})
                  </div>
                </div>
              </div>

              <div className="row-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <span className="muted" style={{ fontSize: '0.78rem' }}>
                  Booked: {new Date(b.booked_at).toLocaleString()}
                </span>
                {b.status !== 'cancelled' && (
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={cancellingId === b.id}
                    onClick={() => handleCancel(b.id)}
                  >
                    <Trash2 size={14} /> {cancellingId === b.id ? 'Cancelling...' : 'Cancel'}
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
