import type {
  BookingCreate,
  BookingResponse,
  FlightCreate,
  FlightResponse,
  PrivateJetBookingCreate,
  PrivateJetBookingResponse,
  PrivateJetCreate,
  PrivateJetResponse,
  SeatClass,
  SeatResponse,
  UserResponse,
} from '../types'

const ACCESS_KEY = 'skybridge_access_token'
const REFRESH_KEY = 'skybridge_refresh_token'

export function getTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  }
}

export function setTokens(accessToken?: string, refreshToken?: string) {
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function decodeJwt(token: string | null): Record<string, unknown> | null {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

async function tryRefreshAccessToken(): Promise<string | null> {
  const { refreshToken } = getTokens()
  if (!refreshToken) return null

  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(refreshToken),
  })

  if (!res.ok) {
    clearTokens()
    return null
  }

  const data = await res.json()
  if (data.access_token) {
    setTokens(data.access_token, refreshToken)
    return data.access_token
  }
  return null
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

async function request<T>(url: string, options: RequestOptions = {}, retry = true): Promise<T> {
  const { accessToken } = getTokens()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (accessToken && !options.skipAuth) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const res = await fetch(url, { ...options, headers })

  if (res.status === 401 && retry && !options.skipAuth) {
    const newToken = await tryRefreshAccessToken()
    if (newToken) {
      return request<T>(url, options, false)
    }
  }

  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null)

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'detail' in data
        ? typeof data.detail === 'string'
          ? data.detail
          : JSON.stringify(data.detail)
        : null) ||
      (typeof data === 'string' && data) ||
      `Request failed (${res.status})`
    throw new Error(message)
  }

  return data as T
}

export const authApi = {
  ping: () => request<{ status: string; message: string }>('/api/auth/ping', { skipAuth: true }),
  register: (payload: { name: string; email: string; password: string }) =>
    request<UserResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  login: (payload: { email: string; password: string }) =>
    request<{ access_token: string; refresh_token: string; token_type: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    }),
  logout: () => request<{ message: string }>('/api/auth/logout', { method: 'POST' }),
  getUsers: () => request<UserResponse[]>('/api/auth/get_users'),
  promoteAdmin: (userId: number) =>
    request<UserResponse>(`/api/auth/promote-admin/${userId}`, { method: 'POST' }),
}

export const flightApi = {
  listAll: (skip = 0, limit = 100) => request<FlightResponse[]>(`/api/flights/?skip=${skip}&limit=${limit}`),
  search: (params: {
    source?: string
    destination?: string
    departure_date?: string
    price_max?: string | number
    seat_class?: SeatClass | ''
  } = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
    })
    const query = qs.toString()
    return request<FlightResponse[]>(`/api/flights/search${query ? `?${query}` : ''}`, { skipAuth: true })
  },
  getSeats: (flightId: number, available = false) =>
    request<SeatResponse[]>(`/api/flights/${flightId}/seats?available=${available}`, { skipAuth: true }),
  create: (payload: FlightCreate) =>
    request<FlightResponse>('/api/flights/', { method: 'POST', body: JSON.stringify(payload) }),
  update: (flightId: number, payload: FlightCreate) =>
    request<FlightResponse>(`/api/flights/${flightId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (flightId: number) =>
    request<{ message: string }>(`/api/flights/${flightId}`, { method: 'DELETE' }),
}

export const bookingApi = {
  listMine: (skip = 0, limit = 50) => request<BookingResponse[]>(`/api/bookings/?skip=${skip}&limit=${limit}`),
  getById: (bookingId: number) => request<BookingResponse>(`/api/bookings/${bookingId}`),
  bookFlight: (flightId: number, payload: BookingCreate) =>
    request<BookingResponse[]>(`/api/bookings/flights/${flightId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  cancel: (bookingId: number) =>
    request<{ message: string }>(`/api/bookings/${bookingId}`, { method: 'DELETE' }),
}

export const privateJetApi = {
  list: (available = false) =>
    request<PrivateJetResponse[]>(`/api/private-jets/?available=${available}`, { skipAuth: true }),
  create: (payload: PrivateJetCreate) =>
    request<PrivateJetResponse>('/api/private-jets/', { method: 'POST', body: JSON.stringify(payload) }),
  book: (jetId: number, payload: PrivateJetBookingCreate) =>
    request<PrivateJetBookingResponse>(`/api/private-jets/${jetId}/book`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  cancelBooking: (bookingId: number) =>
    request<{ message: string }>(`/api/private-jets/${bookingId}/cancel`, { method: 'DELETE' }),
}

export const adminApi = {
  getLogs: (limit = 50, skip = 0) => request<unknown[]>(`/api/admin/logs?limit=${limit}&skip=${skip}`),
  getAnalytics: (flightId?: number) =>
    request<unknown[]>(`/api/admin/analytics${flightId ? `?flight_id=${flightId}` : ''}`),
  getBookingEvents: (limit = 50, skip = 0, eventType = '') => {
    const qs = new URLSearchParams({ limit: String(limit), skip: String(skip) })
    if (eventType) qs.set('event_type', eventType)
    return request<unknown[]>(`/api/admin/booking-events?${qs.toString()}`)
  },
}
