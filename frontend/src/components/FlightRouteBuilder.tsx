import React, { useEffect, useState } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown, Plane, Save, X } from 'lucide-react'
import RouteTimeline from './RouteTimeline'
import type { FlightCreate, FlightResponse, SegmentPrice } from '../types'

interface Props {
  editingFlight?: FlightResponse | null
  onCancelEdit?: () => void
  onSubmit: (payload: FlightCreate, editingId?: number) => Promise<void>
}

export default function FlightRouteBuilder({ editingFlight, onCancelEdit, onSubmit }: Props) {
  const [airline, setAirline] = useState('SkyBridge Air')
  const [source, setSource] = useState('Delhi')
  const [stops, setStops] = useState<string[]>([])
  const [destination, setDestination] = useState('Dubai')
  const [departureTime, setDepartureTime] = useState('')
  const [arrivalTime, setArrivalTime] = useState('')
  const [economyPrice, setEconomyPrice] = useState(5500)
  const [premiumPrice, setPremiumPrice] = useState(10500)
  const [businessPrice, setBusinessPrice] = useState(21000)
  const [economySeats, setEconomySeats] = useState(18)
  const [premiumSeats, setPremiumSeats] = useState(8)
  const [businessSeats, setBusinessSeats] = useState(4)
  const [segmentPrices, setSegmentPrices] = useState<SegmentPrice[]>([])
  const [saving, setSaving] = useState(false)

  // Hydrate when editing an existing flight
  useEffect(() => {
    if (!editingFlight) return
    setAirline(editingFlight.airline || 'SkyBridge Air')
    setSource(editingFlight.source || '')
    setStops(editingFlight.stops ? [...editingFlight.stops] : [])
    setDestination(editingFlight.destination || '')
    setDepartureTime(editingFlight.departure_time ? editingFlight.departure_time.slice(0, 16) : '')
    setArrivalTime(editingFlight.arrival_time ? editingFlight.arrival_time.slice(0, 16) : '')
    setEconomyPrice(editingFlight.economy_price ?? 0)
    setPremiumPrice(editingFlight.premium_price ?? 0)
    setBusinessPrice(editingFlight.business_price ?? 0)
    setEconomySeats(editingFlight.economy_seats ?? 0)
    setPremiumSeats(editingFlight.premium_seats ?? 0)
    setBusinessSeats(editingFlight.business_seats ?? 0)
    if (editingFlight.segment_prices) {
      setSegmentPrices(editingFlight.segment_prices)
    }
  }, [editingFlight])

  // Auto-sync segment_prices whenever source, stops, or destination changes
  useEffect(() => {
    const cleanStops = stops.map((s) => s.trim())
    if (cleanStops.length === 0) {
      setSegmentPrices([])
      return
    }
    const route = [source.trim() || 'Departure', ...cleanStops.map((s, i) => s || `Stop ${i + 1}`), destination.trim() || 'Destination']
    setSegmentPrices((prev) => {
      const next: SegmentPrice[] = []
      for (let i = 0; i < route.length - 1; i++) {
        const existing = prev[i]
        next.push({
          from_location: route[i],
          to_location: route[i + 1],
          economy: existing ? existing.economy : Math.round(economyPrice / (route.length - 1)) || 3000,
          premium: existing ? existing.premium : Math.round(premiumPrice / (route.length - 1)) || 6000,
          business: existing ? existing.business : Math.round(businessPrice / (route.length - 1)) || 12000,
        })
      }
      return next
    })
  }, [source, stops, destination])

  const addStop = () => setStops((prev) => [...prev, ''])
  const updateStop = (index: number, value: string) =>
    setStops((prev) => prev.map((s, i) => (i === index ? value : s)))
  const removeStop = (index: number) =>
    setStops((prev) => prev.filter((_, i) => i !== index))
  const moveStop = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= stops.length) return
    setStops((prev) => {
      const copy = [...prev]
      const temp = copy[index]
      copy[index] = copy[target]
      copy[target] = temp
      return copy
    })
  }

  const updateSegmentPrice = (index: number, field: 'economy' | 'premium' | 'business', value: number) => {
    setSegmentPrices((prev) =>
      prev.map((seg, i) => (i === index ? { ...seg, [field]: Number(value) || 0 } : seg))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanStops = stops.map((s) => s.trim()).filter(Boolean)
    const hasStops = cleanStops.length > 0

    // Keep totals consistent with segment sums when stops exist
    const totalEco = hasStops ? segmentPrices.reduce((s, p) => s + Number(p.economy), 0) : Number(economyPrice)
    const totalPrem = hasStops ? segmentPrices.reduce((s, p) => s + Number(p.premium), 0) : Number(premiumPrice)
    const totalBus = hasStops ? segmentPrices.reduce((s, p) => s + Number(p.business), 0) : Number(businessPrice)

    const payload: FlightCreate = {
      airline: airline.trim() || 'SkyBridge Air',
      source: source.trim(),
      destination: destination.trim(),
      stops: hasStops ? cleanStops : null,
      segment_prices: hasStops
        ? segmentPrices.map((sp, i) => ({
            from_location: i === 0 ? source.trim() : cleanStops[i - 1],
            to_location: i === cleanStops.length ? destination.trim() : cleanStops[i],
            economy: Number(sp.economy),
            premium: Number(sp.premium),
            business: Number(sp.business),
          }))
        : null,
      economy_price: totalEco,
      premium_price: totalPrem,
      business_price: totalBus,
      economy_seats: Number(economySeats),
      premium_seats: Number(premiumSeats),
      business_seats: Number(businessSeats),
      departure_time: departureTime ? new Date(departureTime).toISOString() : null,
      arrival_time: arrivalTime ? new Date(arrivalTime).toISOString() : null,
    }

    setSaving(true)
    try {
      await onSubmit(payload, editingFlight?.id)
      if (!editingFlight) {
        setStops([])
        setSegmentPrices([])
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-extrabold text-navy-900">
            {editingFlight ? `Edit Flight #${editingFlight.id}` : 'Dynamic Multi-Stop Flight Route Builder'}
          </h3>
          <p className="text-sm text-slate-500">
            Add, remove, or reorder intermediate stops. Final destination always stays separate.
          </p>
        </div>
        {editingFlight && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <X className="w-4 h-4" /> Cancel Edit
          </button>
        )}
      </div>

      {/* Live Visual Route Preview */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          Live Route Preview ({stops.filter((s) => s.trim()).length} intermediate stop
          {stops.filter((s) => s.trim()).length === 1 ? '' : 's'})
        </div>
        <RouteTimeline
          source={source || 'Departure'}
          stops={stops.filter((s) => s.trim())}
          destination={destination || 'Destination'}
        />
      </div>

      {/* Route Builder Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Departure */}
        <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-navy-900">
            1. Departure
          </label>
          <input
            required
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. Delhi"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
          <label className="block text-xs font-semibold text-slate-500 pt-1">Airline</label>
          <input
            value={airline}
            onChange={(e) => setAirline(e.target.value)}
            placeholder="SkyBridge Air"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </div>

        {/* Intermediate Stops */}
        <div className="rounded-xl border border-sky-200 p-4 bg-sky-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-sky-900">
              2. Intermediate Stops (Optional)
            </label>
            <button
              type="button"
              onClick={addStop}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Stop
            </button>
          </div>

          {stops.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center border border-dashed border-sky-200 rounded-lg">
              Direct flight (no stops). Click <strong>Add Stop</strong> for multi-leg routes.
            </p>
          ) : (
            <div className="space-y-2">
              {stops.map((stop, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-sky-700 w-6">#{idx + 1}</span>
                  <input
                    required
                    value={stop}
                    onChange={(e) => updateStop(idx, e.target.value)}
                    placeholder={`Stop ${idx + 1} (e.g. Mumbai)`}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => moveStop(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-35"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStop(idx, 1)}
                    disabled={idx === stops.length - 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-35"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStop(idx)}
                    className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    title="Remove stop"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Final Destination */}
        <div className="rounded-xl border border-orange-200 p-4 bg-orange-50/40 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-orange-900">
            3. Final Destination
          </label>
          <input
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Dubai"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-coral-500 focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500">Departure</label>
              <input
                type="datetime-local"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500">Arrival</label>
              <input
                type="datetime-local"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Segment Pricing Table (Auto-shown when stops exist, matching backend validation) */}
      {segmentPrices.length > 0 ? (
        <div className="rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-bold text-navy-900">
              Segment-Wise Pricing (Required by Backend for Multi-Stop Flights)
            </h4>
            <span className="text-xs text-slate-500 font-mono">
              {segmentPrices.length} segments auto-synced
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3">Segment</th>
                  <th className="py-2 px-2">Economy (₹)</th>
                  <th className="py-2 px-2">Premium (₹)</th>
                  <th className="py-2 pl-2">Business (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {segmentPrices.map((seg, idx) => (
                  <tr key={idx}>
                    <td className="py-2 pr-3 font-semibold text-navy-900 whitespace-nowrap">
                      {seg.from_location} <Plane className="inline w-3.5 h-3.5 text-coral-500 mx-1" /> {seg.to_location}
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        required
                        value={seg.economy}
                        onChange={(e) => updateSegmentPrice(idx, 'economy', Number(e.target.value))}
                        className="w-28 rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-xs"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        required
                        value={seg.premium}
                        onChange={(e) => updateSegmentPrice(idx, 'premium', Number(e.target.value))}
                        className="w-28 rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-xs"
                      />
                    </td>
                    <td className="py-2 pl-2">
                      <input
                        type="number"
                        min="0"
                        required
                        value={seg.business}
                        onChange={(e) => updateSegmentPrice(idx, 'business', Number(e.target.value))}
                        className="w-28 rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Economy Price (₹)</label>
            <input
              type="number"
              min="0"
              value={economyPrice}
              onChange={(e) => setEconomyPrice(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Premium Price (₹)</label>
            <input
              type="number"
              min="0"
              value={premiumPrice}
              onChange={(e) => setPremiumPrice(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Business Price (₹)</label>
            <input
              type="number"
              min="0"
              value={businessPrice}
              onChange={(e) => setBusinessPrice(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
            />
          </div>
        </div>
      )}

      {/* Seat Capacity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Economy Seats (max 500)</label>
          <input
            type="number"
            min="0"
            max="500"
            value={economySeats}
            onChange={(e) => setEconomySeats(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Premium Seats (max 500)</label>
          <input
            type="number"
            min="0"
            max="500"
            value={premiumSeats}
            onChange={(e) => setPremiumSeats(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Business Seats (max 500)</label>
          <input
            type="number"
            min="0"
            max="500"
            value={businessSeats}
            onChange={(e) => setBusinessSeats(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-coral-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:brightness-105 disabled:opacity-50 transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving Flight...' : editingFlight ? 'Update Flight' : 'Publish Flight Route'}
        </button>
      </div>
    </form>
  )
}
