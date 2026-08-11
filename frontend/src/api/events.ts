import axiosInstance from './axiosInstance';


export interface Event {
  _id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  thumbnailUrl: string;
  bannerUrl?: string;
  content: string;
  category: 'promotion' | 'membership' | 'news' | 'seasonal';
  startDate: string;
  endDate?: string | null;
  isFeatured: boolean;
  status: 'draft' | 'published' | 'archived';
  viewCount: number;
  createdBy: any;
  createdAt: string;
  updatedAt: string;
}

export const eventsApi = {
  // Public
  getPublicEvents: (params?: { category?: string; limit?: number }) =>
    axiosInstance.get<{ data: Event[] }>('/events/public', { params }),
    
  getEventBySlug: (slug: string) =>
    axiosInstance.get<{ data: Event }>(`/events/public/${slug}`),

  // Admin
  getAdminEvents: (params?: Record<string, any>) =>
    axiosInstance.get<{ data: Event[]; pagination: { page: number; totalPages: number } }>('/events/admin', { params }),

  createEvent: (data: Partial<Event>) =>
    axiosInstance.post<{ message: string; data: Event }>('/events/admin', data),

  updateEvent: (id: string, data: Partial<Event>) =>
    axiosInstance.put<{ message: string; data: Event }>(`/events/admin/${id}`, data),

  deleteEvent: (id: string) =>
    axiosInstance.delete<{ message: string }>(`/events/admin/${id}`),
};
