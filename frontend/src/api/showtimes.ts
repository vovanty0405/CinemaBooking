import axiosInstance from './axiosInstance';
import type { Showtime, PaginatedResponse } from '../types';

export const showtimesApi = {
  getAll: (params?: Record<string, any>) => axiosInstance.get<PaginatedResponse<Showtime>>('/showtimes', { params }),
  getById: (id: string) => axiosInstance.get('/showtimes/' + id),
  getByMovie: (movieId: string, date?: string) => axiosInstance.get('/showtimes', { params: { movieId, date } }),
  create: (data: { movieId: string; roomId: string; startTime: string; basePrice: number }) => axiosInstance.post('/showtimes', data),
  update: (id: string, data: any) => axiosInstance.patch('/showtimes/' + id, data),
  cancel: (id: string) => axiosInstance.patch('/showtimes/' + id + '/cancel'),
};
