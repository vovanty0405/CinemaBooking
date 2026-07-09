import axiosInstance from './axiosInstance';
import type { Booking, Seat, ApiResponse } from '../types';

export const bookingsApi = {
  create: (data: any) => axiosInstance.post<ApiResponse<Booking>>('/bookings', data),
  getById: (id: string) => axiosInstance.get<ApiResponse<Booking>>(`/bookings/${id}`),
  getSeatMap: (showtimeId: string) => axiosInstance.get<ApiResponse<{ seats: Seat[] }>>(`/bookings/seat-map/${showtimeId}`),
  cancel: (id: string) => axiosInstance.patch(`/bookings/${id}/cancel`),
  getMyBookings: (params?: any) => axiosInstance.get('/bookings/my', { params }),
};
