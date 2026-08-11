import axiosInstance from './axiosInstance';
import type { User, ApiResponse } from '../types';

export const authApi = {
  login: (data: any) => axiosInstance.post('/auth/login', data),
  register: (data: any) => axiosInstance.post('/auth/register', data),
  refresh: () => axiosInstance.post('/auth/refresh'),
  logout: () => axiosInstance.post('/auth/logout'),
  getMe: () => axiosInstance.get<ApiResponse<User>>('/auth/me'),
  forgotPassword: (data: any) => axiosInstance.post('/auth/forgot-password', data),
  resetPassword: (data: any) => axiosInstance.post('/auth/reset-password', data),
  changePassword: (data: any) => axiosInstance.post('/auth/change-password', data),
  requestChangePasswordOtp: (data: { oldPassword: string }) => axiosInstance.post('/auth/change-password/otp', data),
  updateProfile: (data: { name: string; phone?: string }) => axiosInstance.patch('/auth/profile', data),
};
