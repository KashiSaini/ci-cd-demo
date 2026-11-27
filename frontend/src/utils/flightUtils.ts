import type { FlightResponse, SeatClass } from '../types'

export function getFlightRoute(flight: Pick<FlightResponse, 'source' | 'stops' | 'destination'>): string[] {
  return [flight.source, ...(flight.stops ?? []), flight.destination].filter(Boolean)
}

export function getAllowedDestinations(flight: Pick<FlightResponse, 'stops' | 'destination'>): string[] {
  return [...(flight.stops ?? []), flight.destination].filter(Boolean)
}

/**
 * Mirrors backend booking_service._compute_price_for_destination exactly
 */
export function computePriceForDestination(
  flight: FlightResponse,
  seatType: SeatClass,
  destination: string
): number {
  const route = getFlightRoute(flight)
  const destIndex = route.indexOf(destination)
  const fallback = Number(flight[`${seatType}_price`] ?? 0)

  if (destIndex <= 0) return fallback

  const segs = flight.segment_prices
  if (!segs || segs.length !== route.length - 1) return fallback

  let total = 0
  for (let i = 0; i < destIndex; i++) {
    const price = segs[i]?.[seatType]
    if (price === undefined || price === null) return fallback
    total += Number(price)
  }
  return total
}

export function formatDuration(departure?: string | null, arrival?: string | null): string {
  if (!departure || !arrival) return 'Schedule TBA'
  const diffMs = new Date(arrival).getTime() - new Date(departure).getTime()
  if (Number.isNaN(diffMs) || diffMs <= 0) return 'Schedule TBA'
  const totalMins = Math.round(diffMs / 60000)
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function formatTime(dt?: string | null): string {
  if (!dt) return 'TBA'
  return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatShortDate(dt?: string | null): string {
  if (!dt) return 'Flexible'
  return new Date(dt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export function getLowestFare(flight: FlightResponse): number | null {
  const prices = [flight.economy_price, flight.premium_price, flight.business_price]
    .filter((p): p is number => typeof p === 'number' && p > 0)
  if (prices.length === 0) return null
  return Math.min(...prices)
}
