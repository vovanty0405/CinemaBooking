import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/events';
import { format } from 'date-fns';
import { ChevronLeft, Calendar, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const EventDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: eventRes, isLoading, isError } = useQuery({
    queryKey: ['event', slug],
    queryFn: () => eventsApi.getEventBySlug(slug as string),
    enabled: !!slug
  });

  const event = eventRes?.data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141414] pt-24 pb-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen bg-[#141414] pt-24 pb-16 container mx-auto px-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Không tìm thấy sự kiện</h1>
        <p className="text-text-muted mb-8">Sự kiện này không tồn tại hoặc đã bị gỡ bỏ.</p>
        <Link to="/">
          <Button>Về trang chủ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] pb-24">
      {/* Banner */}
      <div className="relative w-full h-[40vh] md:h-[60vh] min-h-[300px] max-h-[600px]">
        <img 
          src={event.bannerUrl || event.thumbnailUrl} 
          alt={event.title}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
        
        <div className="absolute inset-0 container mx-auto px-4 flex flex-col justify-end pb-12">
          <Link to="/" className="inline-flex items-center text-text-muted hover:text-white transition-colors mb-6 w-fit">
            <ChevronLeft size={20} className="mr-1" />
            Trở lại
          </Link>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="bg-brand-red text-white text-xs font-bold px-3 py-1.5 rounded uppercase tracking-wider">
              {event.category === 'promotion' ? 'Khuyến mãi' : 
               event.category === 'news' ? 'Tin tức' : 
               event.category === 'membership' ? 'Thành viên' : 'Sự kiện mùa'}
            </span>
            <div className="flex items-center text-sm text-text-secondary bg-[#1F1F1F]/80 backdrop-blur px-3 py-1.5 rounded">
              <Calendar size={14} className="mr-2" />
              {format(new Date(event.startDate), 'dd/MM/yyyy')} 
              {event.endDate && ` - ${format(new Date(event.endDate), 'dd/MM/yyyy')}`}
            </div>
            <div className="flex items-center text-sm text-text-secondary bg-[#1F1F1F]/80 backdrop-blur px-3 py-1.5 rounded">
              <Eye size={14} className="mr-2" />
              {event.viewCount.toLocaleString()} lượt xem
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl text-balance">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 mt-8 md:mt-16 flex flex-col lg:flex-row gap-12">
        <div className="lg:w-2/3">
          {event.shortDescription && (
            <p className="text-lg md:text-xl text-text-secondary font-medium mb-12 italic border-l-4 border-brand-red pl-6 py-2">
              {event.shortDescription}
            </p>
          )}

          {/* HTML Content Rendered via Prose */}
          <div 
            className="prose prose-invert prose-brand max-w-none
              prose-headings:font-bold prose-headings:tracking-tight
              prose-a:text-brand-red hover:prose-a:text-brand-red-dark prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-img:shadow-2xl prose-img:mx-auto
              prose-p:text-text-primary prose-p:leading-relaxed prose-p:text-[17px]
              prose-strong:text-white prose-strong:font-semibold
              prose-ul:list-disc prose-ol:list-decimal
              prose-li:text-text-primary prose-li:my-2
              marker:text-brand-red"
            dangerouslySetInnerHTML={{ __html: event.content }}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:w-1/3">
          <div className="sticky top-28 bg-[#1F1F1F] rounded-xl border border-[#2B2B2B] p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6">Thông tin nổi bật</h3>
            
            <div className="space-y-6">
              <div>
                <div className="text-sm text-text-muted mb-1">Thể loại</div>
                <div className="font-semibold text-white">
                  {event.category === 'promotion' ? 'Chương trình Khuyến mãi' : 
                   event.category === 'news' ? 'Tin tức Điện ảnh' : 
                   event.category === 'membership' ? 'Đặc quyền Thành viên' : 'Sự kiện Đặc biệt'}
                </div>
              </div>

              <div>
                <div className="text-sm text-text-muted mb-1">Thời gian áp dụng</div>
                <div className="font-semibold text-white">
                  Bắt đầu: {format(new Date(event.startDate), 'dd/MM/yyyy HH:mm')}
                  {event.endDate && (
                    <><br />Kết thúc: {format(new Date(event.endDate), 'dd/MM/yyyy HH:mm')}</>
                  )}
                </div>
              </div>
            </div>

            {(event.category === 'promotion' || event.category === 'membership') && (
              <div className="mt-8 pt-8 border-t border-[#2B2B2B]">
                <Link to="/movies" className="block w-full">
                  <Button size="lg" className="w-full text-base font-bold shadow-[0_0_20px_rgba(229,9,20,0.4)]">
                    Đặt vé ngay
                  </Button>
                </Link>
                <p className="text-xs text-text-muted text-center mt-3">
                  Áp dụng ưu đãi khi thanh toán
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
