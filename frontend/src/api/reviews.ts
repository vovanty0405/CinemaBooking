import axiosInstance from './axiosInstance';

export const reviewsApi = {
  getMovieReviews: (movieId: string, params?: { page?: number; limit?: number; sort?: string }) => 
    axiosInstance.get(`/reviews/movie/${movieId}`, { params }),
    
  createReview: (data: { movieId: string; rating: number; comment: string }) => 
    axiosInstance.post('/reviews', data),
    
  replyReview: (reviewId: string, data: { comment: string }) => 
    axiosInstance.post(`/reviews/${reviewId}/reply`, data),
    
  // Admin APIs
  getAdminReviews: (params?: Record<string, any>) => 
    axiosInstance.get('/reviews/admin', { params }),
    
  deleteReview: (reviewId: string) => 
    axiosInstance.delete(`/reviews/admin/${reviewId}`),
    
  getReviewStats: () => 
    axiosInstance.get('/reviews/admin/stats'),
};
