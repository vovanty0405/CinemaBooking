import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../../api/events';
import type { Event } from '../../api/events';
import { useToastStore } from '../../stores/toastStore';
import { EventFormModal } from './EventFormModal';
import { Search, Edit, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export const AdminEventsTab: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  const { data: eventsRes, isLoading } = useQuery({
    queryKey: ['adminEvents', page, search],
    queryFn: () => eventsApi.getAdminEvents({ page, limit: 10, search })
  });

  const events: Event[] = eventsRes?.data?.data || [];
  const pagination = eventsRes?.data?.pagination || { totalPages: 1 };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.deleteEvent(id),
    onSuccess: () => {
      addToast('Xóa sự kiện thành công', 'success');
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
    },
    onError: (err: any) => addToast(err.response?.data?.message || 'Lỗi khi xóa', 'error')
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
      deleteMutation.mutate(id);
    }
  };

  const openAddModal = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-[#1F1F1F] rounded-xl border border-[#2B2B2B] overflow-hidden flex-1 flex flex-col">
      <div className="p-4 border-b border-[#2B2B2B] flex justify-between items-center bg-[#141414]">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input 
            type="text" 
            placeholder="Tìm theo tiêu đề..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-[#2B2B2B] text-white text-sm pl-9 pr-4 py-2 rounded-lg border-none focus:ring-1 focus:ring-brand-red focus:outline-none"
          />
        </div>
        <button 
          onClick={openAddModal}
          className="bg-brand-red hover:bg-brand-red-dark text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-[0_0_10px_rgba(229,9,20,0.3)]"
        >
          + Thêm Sự kiện mới
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#141414] border-b border-[#2B2B2B]">
              <th className="py-4 px-6 text-xs text-text-muted uppercase tracking-wider font-semibold">Ảnh / Tiêu đề</th>
              <th className="py-4 px-6 text-xs text-text-muted uppercase tracking-wider font-semibold">Danh mục</th>
              <th className="py-4 px-6 text-xs text-text-muted uppercase tracking-wider font-semibold">Trạng thái</th>
              <th className="py-4 px-6 text-xs text-text-muted uppercase tracking-wider font-semibold">Hiệu lực</th>
              <th className="py-4 px-6 text-xs text-text-muted uppercase tracking-wider font-semibold text-right">Lượt xem</th>
              <th className="py-4 px-6 text-xs text-text-muted uppercase tracking-wider font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2B2B2B]">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-text-muted">Đang tải...</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-text-muted">Chưa có sự kiện nào.</td></tr>
            ) : (
              events.map((event: Event) => (
                <tr key={event._id} className="hover:bg-[#2A2A2A]/50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex gap-4 items-center">
                      <img src={event.thumbnailUrl} alt={event.title} className="w-16 h-12 object-cover rounded bg-[#2B2B2B]" />
                      <div>
                        <p className="font-semibold text-sm text-white line-clamp-1" title={event.title}>{event.title}</p>
                        {event.isFeatured && <span className="inline-block mt-1 bg-brand-red text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">Nổi bật</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm">
                    {event.category === 'promotion' ? 'Khuyến mãi' : 
                     event.category === 'news' ? 'Tin tức' : 
                     event.category === 'membership' ? 'Thành viên' : 'Sự kiện mùa'}
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                      event.status === 'published' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' :
                      event.status === 'draft' ? 'bg-gray-800 text-gray-400 border border-gray-700' :
                      'bg-brand-red/15 text-brand-red border border-brand-red/30'
                    }`}>
                      {event.status === 'published' ? 'Đã đăng' : event.status === 'draft' ? 'Bản nháp' : 'Lưu trữ'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-text-muted">
                    {format(new Date(event.startDate), 'dd/MM/yyyy')} 
                    {event.endDate ? ` - ${format(new Date(event.endDate), 'dd/MM/yyyy')}` : ' - Không giới hạn'}
                  </td>
                  <td className="py-4 px-6 text-sm text-white text-right font-semibold">
                    {event.viewCount.toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={`/events/${event.slug}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 text-text-muted hover:text-white bg-[#2B2B2B] rounded"
                        title="Xem trang hiển thị"
                      >
                        <ExternalLink size={16} />
                      </a>
                      <button 
                        onClick={() => openEditModal(event)}
                        className="p-1.5 text-text-muted hover:text-white bg-[#2B2B2B] rounded"
                        title="Sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(event._id)}
                        className="p-1.5 text-text-muted hover:text-brand-red hover:bg-brand-red/10 bg-[#2B2B2B] rounded"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="p-4 border-t border-[#2B2B2B] bg-[#141414] flex justify-end gap-2">
          {Array.from({ length: pagination.totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded text-sm font-medium ${
                page === i + 1 ? 'bg-brand-red text-white' : 'bg-[#2B2B2B] text-text-muted hover:text-white'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {isModalOpen && (
        <EventFormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          eventToEdit={editingEvent} 
        />
      )}
    </div>
  );
};
