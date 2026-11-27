const ACCESS_KEY = 'skybridge_access_token'
const REFRESH_KEY = 'skybridge_refresh_token'

export function getTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  }
}

export function setTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function decodeJwt(token) {
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

async function tryRefreshAccessToken() {
  const { refreshToken } = getTokens()
  if (!refreshToken) return null

  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // FastAPI endpoint expects: refresh_token: str = Body(...)
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

async function request(url, options = {}, retry = true) {
  const { accessToken } = getTokens()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (accessToken && !options.skipAuth) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const res = await fetch(url, { ...options, headers })

  if (res.status === 401 && retry && !options.skipAuth) {
    const newToken = await tryRefreshAccessToken()
    if (newToken) {
      return request(url, options, false)
    }
  }

  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null)

  if (!res.ok) {
    const message =
      (data && (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))) ||
      (typeof data === 'string' && data) ||
      `Request failed (${res.status})`
    const err = new Error(message)
    err.status = res.status
    throw err
  }

  return data
}

// 1. Auth Service (8001 -> /api/auth)
export const authApi = {
  ping: () => request('/api/auth/ping', { skipAuth: true }),
  register: (payload) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  login: (payload) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  getUsers: () => request('/api/auth/get_users'),
  promoteAdmin: (userId) => request(`/api/auth/promote-admin/${userId}`, { method: 'POST' }),
}

// 2. Flight Service (8002 -> /api/flights)
export const flightApi = {
  listAll: (skip = 0, limit = 50) => request(`/api/flights/?skip=${skip}&limit=${limit}`),
  search: (params = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v)
    })
    const query = qs.toString()
    return request(`/api/flights/search${query ? `?${query}` : ''}`, { skipAuth: true })
  },
  getSeats: (flightId, available = false) =>
    request(`/api/flights/${flightId}/seats?available=${available}`, { skipAuth: true }),
  create: (payload) => request('/api/flights/', { method: 'POST', body: JSON.stringify(payload) }),
  update: (flightId, payload) =>
    request(`/api/flights/${flightId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (flightId) => request(`/api/flights/${flightId}`, { method: 'DELETE' }),
}

// 3. Booking Service (8003 -> /api/bookings)
export const bookingApi = {
  listMine: (skip = 0, limit = 50) => request(`/api/bookings/?skip=${skip}&limit=${limit}`),
  getById: (bookingId) => request(`/api/bookings/${bookingId}`),
  bookFlight: (flightId, payload) =>
    request(`/api/bookings/flights/${flightId}`, { method: 'POST', body: JSON.stringify(payload) }),
  cancel: (bookingId) => request(`/api/bookings/${bookingId}`, { method: 'DELETE' }),
}

// 4. Private Jet Service (8004 -> /api/private-jets)
export const privateJetApi = {
  list: (available = false) =>
    request(`/api/private-jets/${available ? '?available=true' : '?available=false'}`, { skipAuth: true }),
  create: (payload) => request('/api/private-jets/', { method: 'POST', body: JSON.stringify(payload) }),
  book: (jetId, payload) =>
    request(`/api/private-jets/${jetId}/book`, { method: 'POST', body: JSON.stringify(payload) }),
  cancelBooking: (bookingId) =>
    request(`/api/private-jets/${bookingId}/cancel`, { method: 'DELETE' }),
}

// 5. Admin Service (8005 -> /api/admin)
export const adminApi = {
  getLogs: (limit = 50, skip = 0) => request(`/api/admin/logs?limit=${limit}&skip=${skip}`),
  getAnalytics: (flightId) =>
    request(`/api/admin/analytics${flightId ? `?flight_id=${flightId}` : ''}`),
  getBookingEvents: (limit = 50, skip = 0, eventType = '') => {
    const qs = new URLSearchParams({ limit: String(limit), skip: String(skip) })
    if (eventType) qs.set('event_type', eventType)
    return request(`/api/admin/booking-events?${qs.toString()}`)
  },
}
