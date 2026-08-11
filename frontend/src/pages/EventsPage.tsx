import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/events';
import { EventCard } from '../components/features/EventCard';
import { Search } from 'lucide-react';

export const EventsPage: React.FC = () => {
  const [category, setCategory] = useState<string>('');
  
  const { data: eventsRes, isLoading } = useQuery({
    queryKey: ['publicEventsAll', category],
    queryFn: () => eventsApi.getPublicEvents({ category, limit: 50 }),
  });

  const events = eventsRes?.data?.data || [];

  return (
    <div className="min-h-screen bg-[#141414] pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Sự Kiện & Tin Tức</h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Cập nhật những tin tức điện ảnh mới nhất, chương trình khuyến mãi hấp dẫn và đặc quyền thành viên.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <button 
            onClick={() => setCategory('')} 
            className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${!category ? 'bg-brand-red text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]' : 'bg-[#1F1F1F] text-text-muted hover:text-white border border-[#2B2B2B]'}`}
          >
            Tất cả
          </button>
          <button 
            onClick={() => setCategory('promotion')} 
            className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${category === 'promotion' ? 'bg-brand-red text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]' : 'bg-[#1F1F1F] text-text-muted hover:text-white border border-[#2B2B2B]'}`}
          >
            Khuyến mãi
          </button>
          <button 
            onClick={() => setCategory('news')} 
            className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${category === 'news' ? 'bg-brand-red text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]' : 'bg-[#1F1F1F] text-text-muted hover:text-white border border-[#2B2B2B]'}`}
          >
            Tin tức
          </button>
          <button 
            onClick={() => setCategory('membership')} 
            className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${category === 'membership' ? 'bg-brand-red text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]' : 'bg-[#1F1F1F] text-text-muted hover:text-white border border-[#2B2B2B]'}`}
          >
            Thành viên
          </button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-[#1F1F1F] rounded-xl border border-[#2B2B2B]">
            <Search className="mx-auto h-12 w-12 text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Không tìm thấy sự kiện nào</h3>
            <p className="text-text-secondary">Vui lòng thử lại với danh mục khác.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((event: any) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
