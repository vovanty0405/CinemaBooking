import axiosInstance from './axiosInstance';

export const paymentsApi = {
  createVNPay: (bookingId: string) => axiosInstance.post('/payments/vnpay/create', { bookingId }),
  getHistory: (params?: any) => axiosInstance.get('/payments/history', { params }),
};
