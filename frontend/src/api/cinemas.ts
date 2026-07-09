import axiosInstance from './axiosInstance';
import type { Cinema, Room, Seat, ApiResponse } from '../types';

export const cinemasApi = {
  getCinemas: () => axiosInstance.get<ApiResponse<Cinema[]>>('/cinemas'),
  getCinemaById: (id: string) => axiosInstance.get<ApiResponse<Cinema>>('/cinemas/' + id),
  createCinema: (data: Partial<Cinema>) => axiosInstance.post<ApiResponse<Cinema>>('/cinemas', data),
  updateCinema: (id: string, data: Partial<Cinema>) => axiosInstance.patch<ApiResponse<Cinema>>('/cinemas/' + id, data),
  deleteCinema: (id: string) => axiosInstance.delete('/cinemas/' + id),
  
  getRooms: (cinemaId: string) => axiosInstance.get<ApiResponse<Room[]>>('/cinemas/' + cinemaId + '/rooms'),
  createRoom: (cinemaId: string, data: Partial<Room> & { rows?: number; seatsPerRow?: number }) => axiosInstance.post<ApiResponse<Room>>('/cinemas/' + cinemaId + '/rooms', data),
  updateRoom: (roomId: string, data: Partial<Room>) => axiosInstance.patch<ApiResponse<Room>>('/cinemas/rooms/' + roomId, data),
  deleteRoom: (roomId: string) => axiosInstance.delete('/cinemas/rooms/' + roomId),
  
  getSeats: (roomId: string) => axiosInstance.get<ApiResponse<Seat[]>>('/cinemas/rooms/' + roomId + '/seats'),
  updateSeats: (data: any) => axiosInstance.post('/seats/bulk-update', data),
};
