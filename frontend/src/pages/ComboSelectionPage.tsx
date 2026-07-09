import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { promotionsApi } from '../api/promotions';
import { showtimesApi } from '../api/showtimes';
import { useBookingStore } from '../stores/bookingStore';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { StepProgress } from '../components/features/StepProgress';

export const ComboSelectionPage: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const { selectedSeats, selectedCombos, updateComboQuantity } = useBookingStore();

  const { data: showtimeRes, isLoading: showtimeLoading } = useQuery({
    queryKey: ['showtime', showtimeId],
    queryFn: () => showtimesApi.getById(showtimeId!),
    enabled: !!showtimeId,
  });

  const { data: combosRes, isLoading: combosLoading } = useQuery({
    queryKey: ['combos'],
    queryFn: () => promotionsApi.getCombos({ status: 'active' }),
  });

  const showtime = showtimeRes?.data?.data as any;
  const movie = showtime?.movie;
  const dbCombos = combosRes?.data?.data || [];

  // Fallback combos if DB is empty to match the provided image
  const defaultCombos = [
    {
      _id: 'default1',
      name: 'SINGLE TOY STORY BLIND BOX COMBO',
      imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&q=80&w=500',
      items: [
        { itemName: '01 Hộp mù Toy Story 5', quantity: 1 },
        { itemName: '01 Nước ngọt siêu lớn', quantity: 1 },
        { itemName: '01 Phần bắp ngọt lớn', quantity: 1 }
      ],
      comboPrice: 249000,
      description: 'Blindbox ngẫu nhiên, không thay đổi nhân vật sau khi xé.'
    },
    {
      _id: 'default2',
      name: 'SINGLE MINION & MONSTER COMBO',
      imageUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&q=80&w=500',
      items: [
        { itemName: '01 Ly theo phim Minion 2026', quantity: 1 },
        { itemName: '01 Nước ngọt siêu lớn', quantity: 1 },
        { itemName: '01 Phần bắp ngọt lớn', quantity: 1 }
      ],
      comboPrice: 249000,
      description: 'Ly Minion cực xịn bản đặc biệt.'
    },
    {
      _id: 'default3',
      name: 'P CGV COMBO',
      imageUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&q=80&w=500',
      items: [
        { itemName: 'FREE ĐỔI VỊ CARAMEL ONLINE', quantity: 1 },
        { itemName: '01 Bắp ngọt lớn', quantity: 1 },
        { itemName: '02 Nước ngọt siêu lớn', quantity: 2 },
        { itemName: '01 Snack', quantity: 1 }
      ],
      comboPrice: 135000,
      description: 'Phần bắp nước đôi lý tưởng cho cặp đôi.'
    },
    {
      _id: 'default4',
      name: 'P MY COMBO',
      imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&q=80&w=500',
      items: [
        { itemName: 'FREE ĐỔI VỊ CARAMEL ONLINE', quantity: 1 },
        { itemName: '01 Bắp ngọt lớn', quantity: 1 },
        { itemName: '01 Nước ngọt siêu lớn', quantity: 1 },
        { itemName: '01 Snack', quantity: 1 }
      ],
      comboPrice: 115000,
      description: 'Phần bắp nước đơn tiện lợi.'
    }
  ];

  const combos = dbCombos.length > 0 ? dbCombos : defaultCombos;

  const ticketAmount = selectedSeats.reduce((sum, seat) => {
    const basePrice = showtime?.basePrice || 100000;
    if (seat.type === 'vip') return sum + basePrice * 1.3;
    if (seat.type === 'couple') return sum + basePrice * 2.2;
    return sum + basePrice;
  }, 0);

  const comboAmount = selectedCombos.reduce((sum, combo) => sum + combo.price * combo.quantity, 0);
  const totalAmount = ticketAmount + comboAmount;

  if (showtimeLoading || combosLoading) {
    return <div className="min-h-screen bg-dark-bg flex items-center justify-center text-text-muted">Đang tải danh sách bắp nước...</div>;
  }

  if (!showtime || !movie) {
    return <div className="min-h-screen bg-dark-bg flex items-center justify-center text-text-muted">Không tìm thấy suất chiếu</div>;
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col font-sans text-text-primary">
      {/* Step Progress */}
      <div className="bg-dark-surface py-6 border-b border-dark-input">
        <div className="max-w-2xl mx-auto px-4">
          <StepProgress steps={['Chọn ghế', 'Chọn bắp nước', 'Thanh toán', 'Xác nhận']} currentStep={1} />
        </div>
      </div>

      <div className="bg-[#fdfaf3] text-[#333] py-2 px-6 font-bold text-center border-b border-[#ddd] uppercase tracking-wider">
        Bắp Nước (Concessions)
      </div>

      {/* Main Grid */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {combos.map((combo: any) => {
            const selected = selectedCombos.find(c => c.comboId === combo._id);
            const quantity = selected ? selected.quantity : 0;

            return (
              <div key={combo._id} className="flex bg-[#fdfaf3] border border-[#e2dec9] rounded-lg p-4 gap-4 shadow-sm hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="w-32 h-32 md:w-36 md:h-36 shrink-0 bg-white border border-[#eae6d5] rounded overflow-hidden flex items-center justify-center relative">
                  <img src={combo.imageUrl} alt={combo.name} className="w-full h-full object-contain" />
                  {combo.tagLabel && (
                    <span className="absolute top-1 left-1 bg-brand-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                      {combo.tagLabel}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-col flex-1 min-w-0">
                  <h3 className="font-bold text-sm md:text-base text-[#111] uppercase tracking-tight line-clamp-1 mb-1">{combo.name}</h3>
                  
                  {/* Items List */}
                  <div className="text-xs text-[#555] space-y-0.5 mb-2 flex-1">
                    {combo.items && combo.items.map((item: any, idx: number) => (
                      <div key={idx} className="truncate">
                        • {item.itemName || item} {item.quantity ? `x${item.quantity}` : ''}
                      </div>
                    ))}
                    {combo.description && <p className="text-xs italic text-[#777] mt-1">{combo.description}</p>}
                  </div>

                  {/* Pricing and Counter */}
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-bold text-sm md:text-base text-[#E50914]">
                      Giá: {combo.comboPrice.toLocaleString('vi-VN')} đ
                    </span>

                    {/* Counter Buttons */}
                    <div className="flex items-center border border-[#ccc] rounded overflow-hidden bg-white">
                      <button 
                        onClick={() => updateComboQuantity(combo._id, combo.name, combo.comboPrice, -1)}
                        className="p-1 px-2.5 bg-[#eaeaea] hover:bg-[#ddd] text-[#333] transition"
                      >
                        <Minus size={12} className="stroke-[3]" />
                      </button>
                      <span className="px-3 text-sm font-bold text-[#111] w-8 text-center">{quantity}</span>
                      <button 
                        onClick={() => updateComboQuantity(combo._id, combo.name, combo.comboPrice, 1)}
                        className="p-1 px-2.5 bg-[#eaeaea] hover:bg-[#ddd] text-[#333] transition"
                      >
                        <Plus size={12} className="stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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

          {/* Selected seats info */}
          <div className="hidden md:flex flex-col gap-1 border-r border-[#333] pr-4 w-48 shrink-0 justify-center h-full">
            <div className="flex justify-between">
              <span className="text-[#999] text-sm">Ghế đã chọn</span>
              <span className="font-bold text-sm text-right truncate w-24">
                {selectedSeats.map(s => `${s.row}${s.number}`).join(', ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#999] text-sm">Suất chiếu</span>
              <span className="font-bold text-sm text-brand-red">{format(new Date(showtime.startTime), 'HH:mm, dd/MM/yyyy')}</span>
            </div>
          </div>

          {/* Price Info */}
          <div className="flex flex-col gap-1 w-36 shrink-0 justify-center h-full">
            <div className="flex justify-between text-xs">
              <span className="text-[#999]">Vé:</span>
              <span className="font-semibold text-white">{ticketAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            {comboAmount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-[#999]">Bắp nước:</span>
                <span className="font-semibold text-white">{comboAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-1 border-t border-[#333]">
              <span className="text-white font-bold">Tổng:</span>
              <span className="font-bold text-brand-red">{totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          {/* Next Button */}
          <button 
            onClick={() => navigate(`/booking/${showtimeId}/payment`)}
            className="flex flex-col items-center justify-center shrink-0 w-[100px] h-full bg-[#E50914] hover:bg-[#B20710] rounded-lg border-2 border-transparent transition-colors"
          >
            <ArrowLeft size={32} className="mb-1 transform rotate-180" />
            <span className="font-bold text-sm uppercase">Next</span>
          </button>
        </div>
      </div>
    </div>
  );
};
