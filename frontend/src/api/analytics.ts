import axiosInstance from './axiosInstance';

export const analyticsApi = {
  getKpi: (params?: Record<string, any>) => axiosInstance.get('/analytics/kpi', { params }),
  getRevenueByMovie: (params?: Record<string, any>) => axiosInstance.get('/analytics/revenue-by-movie', { params }),
  getFormatDistribution: (params?: Record<string, any>) => axiosInstance.get('/analytics/format-distribution', { params }),
  getBookingHeatmap: (params?: Record<string, any>) => axiosInstance.get('/analytics/booking-heatmap', { params }),
  exportAnalytics: (params?: Record<string, any>) => axiosInstance.get('/analytics/export', { params, responseType: 'blob' }),
};
