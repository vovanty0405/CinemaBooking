export interface Movie {
  _id: string
  title: string
  description: string
  duration: number
  genre: string[]
  language: string
  releaseDate: string
  endDate?: string
  posterUrl: string
  backdropUrl?: string
  trailerUrl?: string
  status?: 'coming_soon' | 'now_showing' | 'ended'
  isFeatured?: boolean
  avgRatingScore?: number
  rating: 'P' | 'C13' | 'C16' | 'C18'
  isActive: boolean
}

export interface Cinema {
  _id: string
  name: string
  address: string
  city: string
  phone?: string
  isActive?: boolean
}

export interface Room {
  _id: string
  cinema: Cinema | string
  name: string
  type: 'standard' | 'imax' | '4dx'
  rows?: number
  seatsPerRow?: number
  isActive?: boolean
}

export interface Showtime {
  _id: string
  movie: Movie | string
  room: Room & { cinema: Cinema }
  startTime: string
  endTime: string
  basePrice: number
  status: 'scheduled' | 'ongoing' | 'finished' | 'cancelled'
}

export interface Seat {
  _id: string
  row: string
  number: number
  type: 'standard' | 'vip' | 'couple'
  status: 'available' | 'locked' | 'booked' | 'maintenance' | 'broken' | 'active' | 'inactive'
  spanColumns?: number
}

export interface BookingSeat {
  seat: string
  row: string
  number: number
  type: string
  price: number
}

export interface Booking {
  _id: string
  user: string
  showtime: Showtime
  seats: BookingSeat[]
  totalAmount: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired'
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  expiresAt: string
  createdAt: string
}

export interface User {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
  isActive: boolean
  phone?: string
  createdAt: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  message?: string
  data: T
}

export interface PaginatedResponse<T> {
  data: {
    items?: T[]
    movies?: T[]
    bookings?: T[]
    showtimes?: T[]
    users?: T[]
    pagination: PaginationMeta
  }
}
