import axiosInstance from './axiosInstance';
import type { Movie, PaginatedResponse } from '../types';

export const moviesApi = {
  getAll: (params?: Record<string, any>) => axiosInstance.get<PaginatedResponse<Movie>>('/movies', { params }),
  getById: (id: string) => axiosInstance.get('/movies/' + id),
  create: (data: Partial<Movie>) => axiosInstance.post('/movies', data),
  update: (id: string, data: Partial<Movie>) => axiosInstance.patch('/movies/' + id, data),
  delete: (id: string) => axiosInstance.delete('/movies/' + id),
};
