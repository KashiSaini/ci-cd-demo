import React, { useEffect, useState } from 'react'
import { Plus, Trash2, ShieldCheck, RefreshCw } from 'lucide-react'
import { adminApi, authApi, flightApi, privateJetApi } from '../api/client'

export default function AdminPage({ onNotify }) {
  const [tab, setTab] = useState('flights')
  const [users, setUsers] = useState([])
  const [flights, setFlights] = useState([])
  const [logs, setLogs] = useState([])
  const [analytics, setAnalytics] = useState([])
  const [events, setEvents] = useState([])
  const [obsError, setObsError] = useState('')

  const [flightForm, setFlightForm] = useState({
    airline: 'SkyBridge Air',
    source: 'Delhi',
    destination: 'Mumbai',
    departure_time: '',
    arrival_time: '',
    economy_price: 4500,
    premium_price: 8500,
    business_price: 16000,
    economy_seats: 12,
    premium_seats: 6,
    business_seats: 4,
  })

  const [jetForm, setJetForm] = useState({
    name: 'Gulfstream G650',
    description: 'Ultra-long-range business jet for up to 14 passengers',
    price_per_hour: 250000,
    is_available: true,
  })

  const loadFlights = () =>
    flightApi.listAll(0, 50).then((d) => setFlights(Array.isArray(d) ? d : [])).catch((e) => onNotify(e.message, 'error'))

  const loadUsers = () =>
    authApi.getUsers().then((d) => setUsers(Array.isArray(d) ? d : [])).catch((e) => onNotify(e.message, 'error'))

  const loadObservability = async () => {
    setObsError('')
    try {
      const [l, a, ev] = await Promise.all([
        adminApi.getLogs(30, 0),
        adminApi.getAnalytics(),
        adminApi.getBookingEvents(30, 0),
      ])
      setLogs(Array.isArray(l) ? l : [])
      setAnalytics(Array.isArray(a) ? a : [])
      setEvents(Array.isArray(ev) ? ev : [])
    } catch (err) {
      setObsError(`Observability unavailable (MongoDB/Kafka may not be running on EC2): ${err.message}`)
    }
  }

  useEffect(() => {
    if (tab === 'flights') loadFlights()
    if (tab === 'users') loadUsers()
    if (tab === 'observability') loadObservability()
  }, [tab])

  const handleCreateFlight = async (e) => {
    e.preventDefault()
    try {
      await flightApi.create({
        ...flightForm,
        economy_price: Number(flightForm.economy_price),
        premium_price: Number(flightForm.premium_price),
        business_price: Number(flightForm.business_price),
        economy_seats: Number(flightForm.economy_seats),
        premium_seats: Number(flightForm.premium_seats),
        business_seats: Number(flightForm.business_seats),
        departure_time: flightForm.departure_time ? new Date(flightForm.departure_time).toISOString() : null,
        arrival_time: flightForm.arrival_time ? new Date(flightForm.arrival_time).toISOString() : null,
      })
      onNotify('Flight created with seats!', 'success')
      loadFlights()
    } catch (err) {
      onNotify(err.message, 'error')
    }
  }

  const handleDeleteFlight = async (id) => {
    if (!window.confirm(`Delete flight #${id}?`)) return
    try {
      await flightApi.remove(id)
      onNotify(`Flight #${id} deleted`, 'success')
      loadFlights()
    } catch (err) {
      onNotify(err.message, 'error')
    }
  }

  const handleCreateJet = async (e) => {
    e.preventDefault()
    try {
      await privateJetApi.create({
        ...jetForm,
        price_per_hour: Number(jetForm.price_per_hour),
      })
      onNotify('Private jet added to fleet!', 'success')
    } catch (err) {
      onNotify(err.message, 'error')
    }
  }

  const handlePromote = async (userId) => {
    try {
      await authApi.promoteAdmin(userId)
      onNotify(`User #${userId} promoted to Admin`, 'success')
      loadUsers()
    } catch (err) {
      onNotify(err.message, 'error')
    }
  }

  return (
    <div className="stack page-enter">
      <div className="page-header">
        <div>
          <span className="badge badge-admin" style={{ marginBottom: '0.45rem' }}>
            <ShieldCheck size={12} /> Control Tower
          </span>
          <h1>Admin Console</h1>
          <p>Manage flights, private jets, user roles, and observability telemetry.</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'flights' ? 'active' : ''}`} onClick={() => setTab('flights')}>
          Flights
        </button>
        <button className={`tab ${tab === 'jets' ? 'active' : ''}`} onClick={() => setTab('jets')}>
          Private Jets
        </button>
        <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          Users & Roles
        </button>
        <button className={`tab ${tab === 'observability' ? 'active' : ''}`} onClick={() => setTab('observability')}>
          Logs & Analytics
        </button>
      </div>

      {tab === 'flights' && (
        <div className="stack page-enter">
          <form className="card stack" onSubmit={handleCreateFlight}>
            <h3>Create New Flight</h3>
            <div className="form-grid">
              <div className="field">
                <label>Airline</label>
                <input value={flightForm.airline} onChange={(e) => setFlightForm({ ...flightForm, airline: e.target.value })} />
              </div>
              <div className="field">
                <label>Source</label>
                <input required value={flightForm.source} onChange={(e) => setFlightForm({ ...flightForm, source: e.target.value })} />
              </div>
              <div className="field">
                <label>Destination</label>
                <input required value={flightForm.destination} onChange={(e) => setFlightForm({ ...flightForm, destination: e.target.value })} />
              </div>
              <div className="field">
                <label>Departure</label>
                <input type="datetime-local" value={flightForm.departure_time} onChange={(e) => setFlightForm({ ...flightForm, departure_time: e.target.value })} />
              </div>
              <div className="field">
                <label>Arrival</label>
                <input type="datetime-local" value={flightForm.arrival_time} onChange={(e) => setFlightForm({ ...flightForm, arrival_time: e.target.value })} />
              </div>
              <div className="field">
                <label>Economy Price</label>
                <input type="number" value={flightForm.economy_price} onChange={(e) => setFlightForm({ ...flightForm, economy_price: e.target.value })} />
              </div>
              <div className="field">
                <label>Premium Price</label>
                <input type="number" value={flightForm.premium_price} onChange={(e) => setFlightForm({ ...flightForm, premium_price: e.target.value })} />
              </div>
              <div className="field">
                <label>Business Price</label>
                <input type="number" value={flightForm.business_price} onChange={(e) => setFlightForm({ ...flightForm, business_price: e.target.value })} />
              </div>
              <div className="field">
                <label>Economy Seats</label>
                <input type="number" min="0" value={flightForm.economy_seats} onChange={(e) => setFlightForm({ ...flightForm, economy_seats: e.target.value })} />
              </div>
              <div className="field">
                <label>Premium Seats</label>
                <input type="number" min="0" value={flightForm.premium_seats} onChange={(e) => setFlightForm({ ...flightForm, premium_seats: e.target.value })} />
              </div>
              <div className="field">
                <label>Business Seats</label>
                <input type="number" min="0" value={flightForm.business_seats} onChange={(e) => setFlightForm({ ...flightForm, business_seats: e.target.value })} />
              </div>
            </div>
            <div>
              <button type="submit" className="btn btn-primary">
                <Plus size={16} /> Create Flight
              </button>
            </div>
          </form>

          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Airline</th>
                  <th>Route</th>
                  <th>Seats (E/P/B)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {flights.map((f) => (
                  <tr key={f.id}>
                    <td className="mono">#{f.id}</td>
                    <td>{f.airline || '—'}</td>
                    <td><strong>{f.source}</strong> → <strong>{f.destination}</strong></td>
                    <td className="mono">{f.economy_seats} / {f.premium_seats} / {f.business_seats}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteFlight(f.id)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'jets' && (
        <form className="card stack page-enter" style={{ maxWidth: '620px' }} onSubmit={handleCreateJet}>
          <h3>Add Private Jet</h3>
          <div className="field">
            <label>Aircraft Name</label>
            <input required value={jetForm.name} onChange={(e) => setJetForm({ ...jetForm, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea rows="3" value={jetForm.description} onChange={(e) => setJetForm({ ...jetForm, description: e.target.value })} />
          </div>
          <div className="field">
            <label>Price per Hour (₹)</label>
            <input type="number" required value={jetForm.price_per_hour} onChange={(e) => setJetForm({ ...jetForm, price_per_hour: e.target.value })} />
          </div>
          <div>
            <button type="submit" className="btn btn-gold">
              <Plus size={16} /> Add Private Jet
            </button>
          </div>
        </form>
      )}

      {tab === 'users' && (
        <div className="card table-wrap page-enter">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="mono">#{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.is_admin ? 'badge-admin' : 'badge-info'}`}>
                      {u.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td>
                    {!u.is_admin && (
                      <button className="btn btn-secondary btn-sm" onClick={() => handlePromote(u.id)}>
                        <ShieldCheck size={14} /> Promote to Admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'observability' && (
        <div className="stack page-enter">
          <div className="row-between">
            <h3>Admin Telemetry (MongoDB + Kafka)</h3>
            <button className="btn btn-secondary btn-sm" onClick={loadObservability}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
          {obsError ? (
            <div className="card" style={{ borderColor: 'rgba(251, 191, 36, 0.45)', color: 'var(--warning)' }}>
              {obsError}
            </div>
          ) : (
            <div className="grid-3">
              <div className="card">
                <h4>Activity Logs ({logs.length})</h4>
                <pre className="muted mono" style={{ marginTop: '0.5rem', overflow: 'auto', maxHeight: '260px', fontSize: '0.74rem' }}>
                  {JSON.stringify(logs, null, 2)}
                </pre>
              </div>
              <div className="card">
                <h4>Flight Analytics ({analytics.length})</h4>
                <pre className="muted mono" style={{ marginTop: '0.5rem', overflow: 'auto', maxHeight: '260px', fontSize: '0.74rem' }}>
                  {JSON.stringify(analytics, null, 2)}
                </pre>
              </div>
              <div className="card">
                <h4>Kafka Booking Events ({events.length})</h4>
                <pre className="muted mono" style={{ marginTop: '0.5rem', overflow: 'auto', maxHeight: '260px', fontSize: '0.74rem' }}>
                  {JSON.stringify(events, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
