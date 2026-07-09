import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ETicket } from '../components/features/ETicket';
import { Button } from '../components/ui/Button';
import { bookingsApi } from '../api/bookings';
import { useBookingStore } from '../stores/bookingStore';

export const BookingSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const { clearSeats } = useBookingStore();
  const [showContent, setShowContent] = useState(false);

  // Queries
  const { data: bookingRes, isLoading, isError } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getById(bookingId!),
    enabled: !!bookingId,
  });

  const booking = bookingRes?.data?.data;

  useEffect(() => {
    // Prevent back navigation to payment
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', () => {
      navigate('/', { replace: true });
    });

    // Animation delay
    setTimeout(() => {
      setShowContent(true);
      clearSeats();
    }, 100);

    return () => {
      window.removeEventListener('popstate', () => {});
    };
  }, [navigate, clearSeats]);

  if (!bookingId) {
    return (
      <div className="container mx-auto px-4 py-20 text-center flex flex-col items-center min-h-[70vh]">
        <h1 className="text-2xl font-bold text-brand-red mb-4">Không tìm thấy thông tin đặt vé</h1>
        <Button onClick={() => navigate('/')}>Về trang chủ</Button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="container mx-auto px-4 py-20 text-center flex flex-col items-center min-h-[70vh] text-text-muted">Đang tải thông tin vé...</div>;
  }

  if (isError || !booking) {
    return (
      <div className="container mx-auto px-4 py-20 text-center flex flex-col items-center min-h-[70vh]">
        <h1 className="text-2xl font-bold text-brand-red mb-4">Có lỗi xảy ra khi tải thông tin vé</h1>
        <Button onClick={() => navigate('/profile')}>Xem lịch sử đặt vé</Button>
      </div>
    );
  }

  // Chuyển đổi dữ liệu cho ETicket
  const formattedBooking = {
    _id: booking._id,
    user: booking.user,
    showtime: {
      _id: booking.showtime._id,
      movie: {
        ...(typeof booking.showtime.movie === 'object' ? booking.showtime.movie : {}),
        duration: typeof booking.showtime.movie === 'object' ? (booking.showtime.movie as any).duration || 120 : 120,
        genre: typeof booking.showtime.movie === 'object' ? (booking.showtime.movie as any).genre || ['N/A'] : ['N/A']
      } as any,
      cinema: (booking.showtime as any).cinema || { _id: '1', name: 'CineBooking', location: 'Cinema' },
      room: booking.showtime.room,
      startTime: booking.showtime.startTime,
      endTime: booking.showtime.endTime || booking.showtime.startTime,
      basePrice: 100000,
      status: 'scheduled'
    },
    seats: booking.seats.map((s: any) => ({
      seat: s._id,
      row: s.row,
      number: s.number,
      type: s.type,
      price: s.price
    })),
    totalAmount: booking.totalAmount || 0,
    status: booking.status,
    createdAt: booking.createdAt
  };

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[70vh]">
      <div className={`transition-all duration-700 transform ${showContent ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-10'} flex flex-col items-center`}>
        {/* Animated Checkmark */}
        <div className="w-20 h-20 bg-accent-teal/20 rounded-full flex items-center justify-center mb-6">
          <div className="w-14 h-14 bg-accent-teal rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.5)]">
            <svg className="w-8 h-8 text-white animate-[draw_0.5s_ease-out_forwards]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-accent-teal mb-2">Đặt vé thành công!</h1>
        <p className="text-text-secondary mb-10 text-center max-w-md">
          Cảm ơn bạn đã sử dụng dịch vụ của CineBook. Thông tin vé đã được lưu vào lịch sử của bạn.
        </p>

        <div className="w-full mb-10 animate-in slide-in-from-bottom-10 delay-300 duration-700 fade-in fill-mode-both">
          <ETicket booking={formattedBooking as any} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in delay-700 fill-mode-both">
          <Button variant="secondary" onClick={() => navigate('/profile')} className="px-8">
            Xem lịch sử đặt vé
          </Button>
          <Button variant="primary" onClick={() => navigate('/')} className="px-8">
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
};
