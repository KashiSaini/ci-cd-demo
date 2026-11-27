import React, { useEffect, useState } from 'react'
import { ShieldCheck, Trash2, Edit3, Plus, RefreshCw } from 'lucide-react'
import { adminApi, authApi, flightApi, privateJetApi } from '../api/client'
import { useToast } from '../context/ToastContext'
import FlightRouteBuilder from '../components/FlightRouteBuilder'
import RouteTimeline from '../components/RouteTimeline'
import type { FlightCreate, FlightResponse, UserResponse } from '../types'

export default function AdminPage() {
  const { notify } = useToast()
  const [tab, setTab] = useState<'flights' | 'jets' | 'users' | 'telemetry'>('flights')
  const [flights, setFlights] = useState<FlightResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [editingFlight, setEditingFlight] = useState<FlightResponse | null>(null)
  const [logs, setLogs] = useState<unknown[]>([])
  const [analytics, setAnalytics] = useState<unknown[]>([])
  const [events, setEvents] = useState<unknown[]>([])
  const [obsError, setObsError] = useState('')

  const [jetForm, setJetForm] = useState({
    name: 'Gulfstream G650',
    description: 'Ultra-long-range business jet for up to 14 passengers',
    price_per_hour: 250000,
  })

  const loadFlights = () =>
    flightApi
      .listAll(0, 100)
      .then((d) => setFlights(Array.isArray(d) ? d : []))
      .catch((e) => notify(e.message, 'error'))

  const loadUsers = () =>
    authApi
      .getUsers()
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch((e) => notify(e.message, 'error'))

  const loadTelemetry = async () => {
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
      setObsError(`Observability unavailable (MongoDB/Kafka may be offline): ${err instanceof Error ? err.message : ''}`)
    }
  }

  useEffect(() => {
    loadFlights()
    loadUsers()
  }, [])

  useEffect(() => {
    if (tab === 'telemetry') loadTelemetry()
  }, [tab])

  const handleSaveFlight = async (payload: FlightCreate, editingId?: number) => {
    try {
      if (editingId) {
        await flightApi.update(editingId, payload)
        notify(`Flight #${editingId} updated!`, 'success')
        setEditingFlight(null)
      } else {
        await flightApi.create(payload)
        notify('Flight published with seats!', 'success')
      }
      loadFlights()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save flight', 'error')
    }
  }

  const handleDeleteFlight = async (id: number) => {
    if (!window.confirm(`Delete flight #${id}?`)) return
    try {
      await flightApi.remove(id)
      notify(`Flight #${id} deleted`, 'success')
      loadFlights()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Delete failed', 'error')
    }
  }

  const handleCreateJet = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await privateJetApi.create({ ...jetForm, price_per_hour: Number(jetForm.price_per_hour), is_available: true })
      notify('Private jet added to fleet!', 'success')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to add jet', 'error')
    }
  }

  const handlePromote = async (userId: number) => {
    try {
      await authApi.promoteAdmin(userId)
      notify(`User #${userId} promoted to Admin`, 'success')
      loadUsers()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Promotion failed', 'error')
    }
  }

  const totalSeats = flights.reduce(
    (s, f) => s + (f.economy_seats || 0) + (f.premium_seats || 0) + (f.business_seats || 0),
    0
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-coral-600 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Control Tower
          </span>
          <h1 className="text-3xl font-extrabold text-navy-900">Admin Dashboard</h1>
        </div>
        <div className="flex gap-4">
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5">
            <div className="text-[10px] font-bold uppercase text-slate-400">Flights</div>
            <div className="font-mono text-xl font-extrabold text-navy-900">{flights.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5">
            <div className="text-[10px] font-bold uppercase text-slate-400">Open Seats</div>
            <div className="font-mono text-xl font-extrabold text-sky-600">{totalSeats}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5">
            <div className="text-[10px] font-bold uppercase text-slate-400">Users</div>
            <div className="font-mono text-xl font-extrabold text-navy-900">{users.length}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {(
          [
            ['flights', 'Flights & Route Builder'],
            ['jets', 'Private Jets'],
            ['users', 'Users & Roles'],
            ['telemetry', 'Logs & Analytics'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              tab === key
                ? 'border-coral-500 text-navy-900'
                : 'border-transparent text-slate-500 hover:text-navy-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'flights' && (
        <div className="space-y-6">
          <FlightRouteBuilder
            editingFlight={editingFlight}
            onCancelEdit={() => setEditingFlight(null)}
            onSubmit={handleSaveFlight}
          />

          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200 bg-slate-50">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Airline</th>
                  <th className="py-3 px-4">Complete Route</th>
                  <th className="py-3 px-4">Seats (E/P/B)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flights.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-xs">#{f.id}</td>
                    <td className="py-3 px-4 font-semibold text-navy-900">{f.airline || '—'}</td>
                    <td className="py-3 px-4">
                      <RouteTimeline source={f.source} stops={f.stops} destination={f.destination} compact />
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {f.economy_seats} / {f.premium_seats} / {f.business_seats}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingFlight(f)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFlight(f.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold hover:bg-rose-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
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
        <form onSubmit={handleCreateJet} className="bg-white rounded-2xl border border-slate-200 p-6 max-w-xl space-y-4">
          <h3 className="text-lg font-extrabold text-navy-900">Add Private Jet</h3>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Aircraft Name</label>
            <input
              required
              value={jetForm.name}
              onChange={(e) => setJetForm({ ...jetForm, name: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
            <textarea
              rows={3}
              value={jetForm.description}
              onChange={(e) => setJetForm({ ...jetForm, description: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Price per Hour (₹)</label>
            <input
              type="number"
              required
              value={jetForm.price_per_hour}
              onChange={(e) => setJetForm({ ...jetForm, price_per_hour: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Aircraft
          </button>
        </form>
      )}

      {tab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-3 px-4 font-mono text-xs">#{u.id}</td>
                  <td className="py-3 px-4 font-semibold text-navy-900">{u.name}</td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        u.is_admin ? 'bg-orange-100 text-orange-700' : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {u.is_admin ? 'Admin' : 'Passenger'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {!u.is_admin && (
                      <button
                        onClick={() => handlePromote(u.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-navy-900 hover:bg-slate-100 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-coral-500" /> Promote to Admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'telemetry' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-navy-900">Observability Telemetry (MongoDB + Kafka)</h3>
            <button
              onClick={loadTelemetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
          {obsError ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              {obsError}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                ['Activity Logs', logs],
                ['Flight Analytics', analytics],
                ['Kafka Booking Events', events],
              ].map(([title, data]) => (
                <div key={title as string} className="bg-white rounded-2xl border border-slate-200 p-4">
                  <h4 className="font-bold text-navy-900 text-sm mb-2">
                    {title as string} ({(data as unknown[]).length})
                  </h4>
                  <pre className="text-[11px] font-mono text-slate-600 bg-slate-50 p-3 rounded-xl overflow-auto max-h-64">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
