export type SeatClass = 'economy' | 'premium' | 'business'

export interface AuthUser {
  id: string
  email: string
  isAdmin: boolean
}

export interface UserResponse {
  id: number
  name: string
  email: string
  is_admin: boolean
}

export interface SegmentPrice {
  from_location: string
  to_location: string
  business: number
  premium: number
  economy: number
}

export interface FlightCreate {
  source: string
  destination: string
  stops?: string[] | null
  segment_prices?: SegmentPrice[] | null
  business_price?: number | null
  premium_price?: number | null
  economy_price?: number | null
  business_seats: number
  premium_seats: number
  economy_seats: number
  departure_time?: string | null
  arrival_time?: string | null
  airline?: string | null
}

export interface FlightResponse {
  id: number
  source: string
  destination: string
  stops?: string[] | null
  segment_prices?: SegmentPrice[] | null
  business_price?: number | null
  premium_price?: number | null
  economy_price?: number | null
  business_seats: number
  premium_seats: number
  economy_seats: number
  departure_time?: string | null
  arrival_time?: string | null
  airline?: string | null
}

export interface SeatResponse {
  id: number
  flight_id: number
  seat_number: string
  seat_type: SeatClass
  is_booked: boolean
}

export interface PassengerBooking {
  passenger_name: string
  destination: string
  seat_type: SeatClass
  seat_number: string
}

export interface BookingCreate {
  contact_email?: string | null
  passengers: PassengerBooking[]
}

export interface BookingResponse {
  id: number
  user_id: number
  flight_id: number
  seat_id?: number | null
  seat_number?: string | null
  seat_type: SeatClass
  price_paid: number
  passenger_name?: string | null
  destination?: string | null
  booking_reference: string
  status: string
  booked_at: string
}

export interface PrivateJetCreate {
  name: string
  description?: string | null
  price_per_hour: number
  is_available?: boolean
  available_from?: string | null
  available_to?: string | null
}

export interface PrivateJetResponse {
  id: number
  owner_id?: number | null
  name: string
  description?: string | null
  price_per_hour: number
  is_available: boolean
  available_from?: string | null
  available_to?: string | null
}

export interface PrivateJetBookingCreate {
  start_time: string
  end_time: string
}

export interface PrivateJetBookingResponse {
  id: number
  user_id: number
  private_jet_id: number
  start_time: string
  end_time: string
  price_paid?: number | null
  status: string
  booked_at: string
}
