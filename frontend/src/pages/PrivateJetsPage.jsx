import React, { useEffect, useState } from 'react'
import { Sparkles, Clock, RefreshCw, X, CheckCircle2 } from 'lucide-react'
import { privateJetApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function PrivateJetsPage({ onNotify, onRequireAuth }) {
  const { isAuthenticated } = useAuth()
  const [jets, setJets] = useState([])
  const [loading, setLoading] = useState(true)
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [selectedJet, setSelectedJet] = useState(null)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [recentBooking, setRecentBooking] = useState(null)
  const [cancelId, setCancelId] = useState('')

  const loadJets = async () => {
    setLoading(true)
    try {
      const data = await privateJetApi.list(onlyAvailable)
      setJets(Array.isArray(data) ? data : [])
    } catch (err) {
      onNotify(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJets()
  }, [onlyAvailable])

  const estimatedHours =
    startTime && endTime
      ? Math.max(0, (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60))
      : 0

  const handleBook = async (e) => {
    e.preventDefault()
    if (!startTime || !endTime || estimatedHours <= 0) {
      onNotify('End time must be after start time', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await privateJetApi.book(selectedJet.id, {
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      })
      setRecentBooking(res)
      onNotify(`Charter booked! Booking ID #${res.id} (₹${res.price_paid})`, 'success')
      setSelectedJet(null)
      loadJets()
    } catch (err) {
      onNotify(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelById = async (e) => {
    e.preventDefault()
    if (!cancelId) return
    try {
      const res = await privateJetApi.cancelBooking(Number(cancelId))
      onNotify(res.message || 'Private jet booking cancelled', 'success')
      setCancelId('')
      loadJets()
    } catch (err) {
      onNotify(err.message, 'error')
    }
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Private Jet Charters</h1>
          <p>Reserve luxury aircraft by the hour with instant availability updates.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
            />
            Available only
          </label>
          <button className="btn btn-secondary btn-sm" onClick={loadJets}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {recentBooking && (
        <div className="card" style={{ borderColor: 'var(--success)' }}>
          <div className="row-between">
            <div>
              <strong>Latest Charter Confirmed — Booking #{recentBooking.id}</strong>
              <p className="muted">
                Jet #{recentBooking.private_jet_id} · Paid ₹{recentBooking.price_paid} · Status: {recentBooking.status}
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setRecentBooking(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card empty-state">Loading fleet...</div>
      ) : jets.length === 0 ? (
        <div className="card empty-state">No private jets listed yet. Admins can add aircraft from the Admin Console.</div>
      ) : (
        <div className="grid-3">
          {jets.map((jet) => (
            <div className="card stack" key={jet.id}>
              <div className="row-between">
                <span className="badge badge-info">
                  <Sparkles size={12} /> Jet #{jet.id}
                </span>
                <span className={`badge ${jet.is_available ? 'badge-success' : 'badge-danger'}`}>
                  {jet.is_available ? 'Available' : 'Chartered'}
                </span>
              </div>

              <div>
                <h3>{jet.name}</h3>
                <p className="muted" style={{ marginTop: '0.25rem' }}>
                  {jet.description || 'Executive charter aircraft'}
                </p>
              </div>

              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                ₹{jet.price_per_hour.toLocaleString()} <span className="muted">/ hour</span>
              </div>

              <button
                className="btn btn-primary"
                disabled={!jet.is_available}
                onClick={() => {
                  if (!isAuthenticated) {
                    onNotify('Sign in to charter a private jet', 'error')
                    onRequireAuth()
                  } else {
                    setSelectedJet(jet)
                  }
                }}
              >
                <Clock size={15} /> {jet.is_available ? 'Charter Now' : 'Currently Unavailable'}
              </button>
            </div>
          ))}
        </div>
      )}

      {isAuthenticated && (
        <form className="card row-between" onSubmit={handleCancelById}>
          <div>
            <strong>Cancel a Private Jet Booking</strong>
            <p className="muted">Enter your charter Booking ID to release the jet.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              min="1"
              placeholder="Booking ID"
              style={{ width: '140px' }}
              value={cancelId}
              onChange={(e) => setCancelId(e.target.value)}
            />
            <button type="submit" className="btn btn-danger btn-sm">
              Cancel Charter
            </button>
          </div>
        </form>
      )}

      {selectedJet && (
        <div className="modal-backdrop" onClick={() => setSelectedJet(null)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Charter {selectedJet.name}</h2>
                <p className="muted">₹{selectedJet.price_per_hour}/hour</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedJet(null)}>
                <X size={16} />
              </button>
            </div>
            <form className="stack" onSubmit={handleBook}>
              <div className="field">
                <label>Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="field">
                <label>End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
              <div className="row-between" style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <div>
                  <span className="muted">
                    Duration: {estimatedHours.toFixed(1)} hr(s)
                  </span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    ₹{Math.round(estimatedHours * selectedJet.price_per_hour).toLocaleString()}
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <CheckCircle2 size={16} /> {submitting ? 'Booking...' : 'Confirm Charter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
