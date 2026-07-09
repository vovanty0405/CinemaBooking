import axiosInstance from './axiosInstance';

export const usersApi = {
  getAll: (params?: Record<string, any>) => axiosInstance.get('/users', { params }),
  updateRole: (id: string, role: string) => axiosInstance.patch('/users/' + id + '/role', { role }),
  toggleStatus: (id: string) => axiosInstance.patch('/users/' + id + '/status'),
};
