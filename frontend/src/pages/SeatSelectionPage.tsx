import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocketStore } from '../stores/socketStore';
import { SeatMap } from '../components/features/SeatMap';
import { useBookingStore } from '../stores/bookingStore';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { showtimesApi } from '../api/showtimes';
import { bookingsApi } from '../api/bookings';
import { useToastStore } from '../stores/toastStore';
import { useAuthStore } from '../stores/authStore';

export const SeatSelectionPage: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();
  const { selectedSeats, selectSeat, deselectSeat, clearSeats } = useBookingStore();

  const queryClient = useQueryClient();
  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket) return;
    
    const handleSeatsChanged = (data: any) => {
      if (data.showtimeId === showtimeId) {
        queryClient.invalidateQueries({ queryKey: ['seatmap', showtimeId] });
      }
    };

    socket.on('seats_status_changed', handleSeatsChanged);

    return () => {
      socket.off('seats_status_changed', handleSeatsChanged);
    };
  }, [socket, showtimeId, queryClient]);

  // Queries
  const { data: showtimeRes, isLoading: showtimeLoading } = useQuery({
    queryKey: ['showtime', showtimeId],
    queryFn: () => showtimesApi.getById(showtimeId!),
    enabled: !!showtimeId,
  });

  const { data: seatMapRes, isLoading: seatsLoading } = useQuery({
    queryKey: ['seatmap', showtimeId],
    queryFn: () => bookingsApi.getSeatMap(showtimeId!),
    enabled: !!showtimeId,
  });

  const showtime = showtimeRes?.data?.data as any;
  const seats = Array.isArray(seatMapRes?.data?.data)
    ? seatMapRes?.data?.data
    : ((seatMapRes?.data?.data as any)?.seats || []);
  const movie = showtime?.movie;

  // Initial load
  useEffect(() => {
    clearSeats();
  }, [clearSeats, showtimeId]);

  const handleSeatClick = (seat: any) => {
    // Không cho chọn ghế đã được book
    if (seat.status !== 'available') {
      return;
    }

    const isSelected = selectedSeats.some((s: any) => s._id === seat._id);
    if (isSelected) {
      deselectSeat(seat._id);
    } else {
      if (selectedSeats.length >= 8) {
        addToast('Bạn chỉ được chọn tối đa 8 ghế', 'warning');
        return;
      }
      selectSeat(seat);
    }
  };

  const validateSeatSelection = (allSeats: any[], selectedSeatIds: string[]) => {
    const seatsByRow: Record<string, any[]> = {};
    allSeats.forEach(seat => {
      if (!seatsByRow[seat.row]) seatsByRow[seat.row] = [];
      seatsByRow[seat.row].push(seat);
    });

    for (const row in seatsByRow) {
      const rowSeats = seatsByRow[row];
      const maxNum = Math.max(...rowSeats.map(s => s.number));
      const layout = Array(maxNum + 2).fill('U'); 
      
      rowSeats.forEach(seat => {
        const char = selectedSeatIds.includes(seat._id) ? 'S' : (seat.status === 'available' ? 'A' : 'U');
        layout[seat.number] = char;
        if (seat.spanColumns === 2) {
           layout[seat.number + 1] = char;
        }
      });
      
      const rowStr = layout.join('');
      if (rowStr.includes('UAS') || rowStr.includes('SAU') || rowStr.includes('SAS')) {
        return false;
      }
    }
    return true;
  };

  const handleContinue = () => {
    if (!isAuthenticated) {
      addToast('Vui lòng đăng nhập để tiếp tục', 'warning');
      navigate('/login', { state: { from: `/booking/seat-selection/${showtimeId}` } });
      return;
    }
    if (selectedSeats.length === 0) return;

    const selectedSeatIds = selectedSeats.map((s: any) => s._id);
    if (!validateSeatSelection(seats, selectedSeatIds)) {
      addToast('Vui lòng không chừa 1 ghế trống bên trái hoặc bên phải của các ghế bạn đã chọn.', 'error');
      return;
    }

    navigate(`/booking/combo-selection/${showtimeId}`);
  };

  const totalAmount = selectedSeats.reduce((sum, seat) => {
    const basePrice = showtime?.basePrice || 100000;
    if (seat.type === 'vip') return sum + basePrice * 1.3;
    if (seat.type === 'couple') return sum + basePrice * 2.2;
    return sum + basePrice;
  }, 0);

  const availableSeatsCount = seats.filter((s: any) => s.status === 'available').length;
  const totalSeatsCount = seats.length;

  if (showtimeLoading || seatsLoading) {
    return <div className="min-h-screen bg-dark-bg flex items-center justify-center text-text-muted">Đang tải sơ đồ ghế...</div>;
  }

  if (!showtime || !movie) {
    return <div className="min-h-screen bg-dark-bg flex items-center justify-center text-text-muted">Không tìm thấy suất chiếu</div>;
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col font-sans">
      {/* Header */}
      <div className="bg-dark-surface p-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-white uppercase tracking-wider text-center">Booking Online</h1>
        </div>
      </div>
      
      {/* Cinema Info Banner */}
      <div className="bg-dark-surface border-b border-dark-input px-6 py-4">
        <h2 className="text-lg font-bold text-white">
          {showtime.room?.cinema?.name || 'Rạp chiếu'} | {showtime.room?.name || 'Phòng chiếu'} | Số ghế ({availableSeatsCount}/{totalSeatsCount})
        </h2>
        <p className="text-text-secondary font-medium">{format(new Date(showtime.startTime), 'dd/MM/yyyy HH:mm')} ~ {format(new Date(showtime.endTime), 'dd/MM/yyyy HH:mm')}</p>
      </div>

      <div className="bg-dark-input py-2">
        <h3 className="text-center font-bold text-text-secondary uppercase">Người / Ghế</h3>
      </div>

      {/* Main Content (Seat Map) */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative">
        {/* Screen curved line */}
        <div className="w-full max-w-4xl mb-12 relative flex justify-center">
          <div className="w-full h-8 border-t-[8px] border-dark-input rounded-[100%] shadow-[0_-5px_10px_rgba(0,0,0,0.5)] absolute top-0"></div>
          <span className="bg-dark-bg px-4 text-text-muted font-bold text-xl uppercase tracking-widest relative z-10 -mt-3">Screen</span>
        </div>

        <div className="mb-12">
          <SeatMap 
            seats={seats} 
            selectedSeats={selectedSeats} 
            onSeatClick={handleSeatClick} 
            showtimeId={showtimeId || 'default'} 
          />
        </div>
      </div>

      {/* CGV Style Bottom Bar */}
      <div className="bg-[#111] text-white sticky bottom-0 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.8)] border-t-[10px] border-dashed border-[#2B2B2B]">
        <div className="container mx-auto px-2 lg:px-4 py-3 flex items-center justify-between gap-4 h-[120px]">
          
          {/* Previous Button */}
          <button 
            onClick={() => navigate(-1)} 
            className="flex flex-col items-center justify-center shrink-0 w-[100px] h-full bg-dark-input hover:bg-[#444] rounded-lg border-2 border-[#555] transition-colors"
          >
            <ArrowLeft size={32} className="mb-1" />
            <span className="font-bold text-sm uppercase">Previous</span>
          </button>

          {/* Movie Info */}
          <div className="flex flex-1 items-center gap-4 border-r border-[#333] pr-4 h-full min-w-0">
            <img 
              src={movie.posterUrl || 'https://via.placeholder.com/300x450'} 
              alt={movie.title} 
              className="h-full max-h-[96px] w-[64px] object-cover rounded shadow-lg hidden sm:block" 
            />
            <div className="flex flex-col flex-1 min-w-0 justify-center">
              <h3 className="font-bold text-base lg:text-lg uppercase truncate mb-1" title={movie.title}>{movie.title}</h3>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-dark-input text-white text-xs font-bold rounded border border-text-muted">2D</span>
                <span className="px-2 py-0.5 bg-brand-red text-white text-xs font-bold rounded">{movie.rating}</span>
              </div>
            </div>
          </div>

          {/* Showtime Info */}
          <div className="hidden md:flex flex-col gap-1 border-r border-[#333] pr-4 w-48 shrink-0 justify-center h-full">
            <div className="flex justify-between">
              <span className="text-[#999] text-sm">Rạp</span>
              <span className="font-bold text-sm text-right truncate w-24">{showtime.room?.cinema?.name || 'Rạp chiếu'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#999] text-sm">Suất chiếu</span>
              <span className="font-bold text-sm text-brand-red">{format(new Date(showtime.startTime), 'HH:mm, dd/MM/yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#999] text-sm">Phòng chiếu</span>
              <span className="font-bold text-sm truncate w-24 text-right">{showtime.room?.name || 'Cinema 1'}</span>
            </div>
          </div>

          {/* Price Info */}
          <div className="flex flex-col gap-1 w-32 shrink-0 justify-center h-full">
            <div className="flex justify-between">
              <span className="text-[#999] text-sm hidden sm:inline">Tổng</span>
              <span className="font-bold text-sm sm:text-base text-white">{totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          {/* Next Button */}
          <button 
            disabled={selectedSeats.length === 0}
            onClick={handleContinue}
            className="flex flex-col items-center justify-center shrink-0 w-[100px] h-full bg-[#E50914] disabled:bg-[#555] hover:bg-[#B20710] disabled:cursor-not-allowed rounded-lg border-2 border-transparent transition-colors"
          >
            <ArrowLeft size={32} className="mb-1 transform rotate-180" />
            <span className="font-bold text-sm uppercase">Next</span>
          </button>
        </div>
      </div>
    </div>
  );
};
