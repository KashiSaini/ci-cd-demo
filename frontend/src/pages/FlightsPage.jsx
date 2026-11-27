import React, { useEffect, useState } from 'react'
import { Search, Plane, Calendar, RefreshCw } from 'lucide-react'
import { flightApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import BookingModal from '../components/BookingModal'

function formatDate(dt) {
  if (!dt) return 'TBA'
  return new Date(dt).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function FlightsPage({ onNotify, onRequireAuth, onGoBookings }) {
  const { isAuthenticated } = useAuth()
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFlight, setSelectedFlight] = useState(null)

  const [filters, setFilters] = useState({
    source: '',
    destination: '',
    departure_date: '',
    price_max: '',
    seat_class: '',
  })

  const loadFlights = async (useSearch = false) => {
    setLoading(true)
    try {
      const hasFilters = Object.values(filters).some((v) => v !== '')
      const data =
        useSearch || hasFilters || !isAuthenticated
          ? await flightApi.search(filters)
          : await flightApi.listAll(0, 50)
      setFlights(Array.isArray(data) ? data : [])
    } catch (err) {
      onNotify(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFlights(false)
  }, [isAuthenticated])

  const handleSearch = (e) => {
    e.preventDefault()
    loadFlights(true)
  }

  const handleClear = () => {
    const empty = { source: '', destination: '', departure_date: '', price_max: '', seat_class: '' }
    setFilters(empty)
    setLoading(true)
    flightApi
      .search(empty)
      .then((data) => setFlights(Array.isArray(data) ? data : []))
      .catch((err) => onNotify(err.message, 'error'))
      .finally(() => setLoading(false))
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Explore Flights</h1>
          <p>Search routes, compare cabin classes, and pick your seats in real time.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => loadFlights(false)}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <form className="card" onSubmit={handleSearch}>
        <div className="form-grid">
          <div className="field">
            <label>From (Source)</label>
            <input
              placeholder="e.g. Delhi"
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            />
          </div>
          <div className="field">
            <label>To (Destination)</label>
            <input
              placeholder="e.g. Mumbai"
              value={filters.destination}
              onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Departure Date</label>
            <input
              type="date"
              value={filters.departure_date}
              onChange={(e) => setFilters({ ...filters, departure_date: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Cabin Class</label>
            <select
              value={filters.seat_class}
              onChange={(e) => setFilters({ ...filters, seat_class: e.target.value })}
            >
              <option value="">Any Class</option>
              <option value="economy">Economy</option>
              <option value="premium">Premium</option>
              <option value="business">Business</option>
            </select>
          </div>
          <div className="field">
            <label>Max Price</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 15000"
              value={filters.price_max}
              onChange={(e) => setFilters({ ...filters, price_max: e.target.value })}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
          <button type="submit" className="btn btn-primary">
            <Search size={16} /> Search Flights
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleClear}>
            Reset
          </button>
        </div>
      </form>

      {loading ? (
        <div className="card empty-state">Loading flights...</div>
      ) : flights.length === 0 ? (
        <div className="card empty-state">
          No flights found. Sign in as an Admin to add flights or adjust your search filters.
        </div>
      ) : (
        <div className="grid-2">
          {flights.map((f) => (
            <div className="card" key={f.id}>
              <div className="row-between">
                <span className="badge badge-info">
                  <Plane size={12} /> {f.airline || 'SkyBridge Air'}
                </span>
                <span className="muted">Flight #{f.id}</span>
              </div>

              <div className="route-row">
                <div className="city-code">{f.source}</div>
                <div className="route-line">
                  <span>{f.stops?.length ? `${f.stops.length} stop (${f.stops.join(', ')})` : 'Direct'}</span>
                </div>
                <div className="city-code">{f.destination}</div>
              </div>

              <div className="row-between muted" style={{ fontSize: '0.82rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={13} /> Dep: {formatDate(f.departure_time)}
                </span>
                <span>Arr: {formatDate(f.arrival_time)}</span>
              </div>

              <div className="price-strip">
                <div className="price-box">
                  <small>Economy ({f.economy_seats})</small>
                  <strong>{f.economy_price != null ? `₹${f.economy_price}` : '—'}</strong>
                </div>
                <div className="price-box">
                  <small>Premium ({f.premium_seats})</small>
                  <strong>{f.premium_price != null ? `₹${f.premium_price}` : '—'}</strong>
                </div>
                <div className="price-box">
                  <small>Business ({f.business_seats})</small>
                  <strong>{f.business_price != null ? `₹${f.business_price}` : '—'}</strong>
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  if (!isAuthenticated) {
                    onNotify('Please sign in to book a flight', 'error')
                    onRequireAuth()
                  } else {
                    setSelectedFlight(f)
                  }
                }}
              >
                Select Seats & Book
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedFlight && (
        <BookingModal
          flight={selectedFlight}
          onClose={() => setSelectedFlight(null)}
          onNotify={onNotify}
          onBooked={() => {
            setSelectedFlight(null)
            onGoBookings()
          }}
        />
      )}
    </div>
  )
}
