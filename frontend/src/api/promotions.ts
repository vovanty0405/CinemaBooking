import axiosInstance from './axiosInstance';

export const promotionsApi = {
  getCombos: (params?: any) => axiosInstance.get('/promotions/combos', { params }),
  createCombo: (data: any) => axiosInstance.post('/promotions/combos', data),
  getCoupons: (params?: any) => axiosInstance.get('/promotions/coupons', { params }),
  createCoupon: (data: any) => axiosInstance.post('/promotions/coupons', data),
  validateCoupon: (data: any) => axiosInstance.post('/promotions/coupons/validate', data),
};
