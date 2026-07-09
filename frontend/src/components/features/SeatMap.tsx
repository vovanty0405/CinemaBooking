import React, { useEffect } from 'react';
import { cn } from '../../utils/tailwind';
import type { Seat } from '../../types';
import { useSocketStore } from '../../stores/socketStore';

interface SeatMapProps {
  seats: Seat[];
  selectedSeats: Seat[];
  onSeatClick: (seat: Seat) => void;
  showtimeId: string;
}

export const SeatMap: React.FC<SeatMapProps> = ({ seats, selectedSeats, onSeatClick, showtimeId }) => {
  const { connect, joinShowtime, leaveShowtime } = useSocketStore();

  useEffect(() => {
    connect();
    joinShowtime(showtimeId);
    return () => {
      leaveShowtime(showtimeId);
    };
  }, [showtimeId, connect, joinShowtime, leaveShowtime]);

  // Group seats by row
  const rowNames = Array.from(new Set(seats.map(s => s.row))).sort();

  return (
    <div className="w-full flex flex-col items-center">
      {/* Screen Indicator */}
      <div className="w-full max-w-2xl mb-12">
        <div className="h-2 bg-gradient-to-b from-text-primary to-dark-bg w-full rounded-t-[50%] blur-[2px] opacity-80" />
        <div className="h-8 bg-gradient-to-b from-dark-surface to-transparent w-full rounded-t-[100%] border-t-4 border-text-secondary/50 flex items-center justify-center -mt-2">
          <span className="text-text-muted text-sm font-semibold tracking-widest mt-2 uppercase">Màn hình</span>
        </div>
      </div>

      {/* Seats Grid */}
      <div className="overflow-x-auto max-w-full pb-8">
        <div className="inline-flex flex-col gap-2 min-w-max">
          {rowNames.map(row => {
            const rowSeats = seats.filter(s => s.row === row).sort((a, b) => a.number - b.number);
            return (
              <div key={row} className="flex items-center gap-2">
                <div className="w-10 md:w-14 text-center text-sm font-bold text-text-muted mr-4 md:mr-12">
                  {row}
                </div>
                <div className="flex gap-2">
                  {rowSeats.map(seat => {
                    const isSelected = selectedSeats.some(s => s._id === seat._id);
                    const isVip = seat.type === 'vip';
                    const isCouple = seat.type === 'couple';
                    const isMaintenance = seat.status === 'maintenance' || seat.status === 'broken';
                    
                    let statusClass = 'seat-available';
                    if (isMaintenance) statusClass = 'seat-maintenance cursor-not-allowed opacity-50 bg-[#333] border-[#555]';
                    else if (seat.status === 'booked') statusClass = 'seat-booked cursor-not-allowed';
                    else if (seat.status === 'locked') statusClass = 'seat-held cursor-not-allowed';
                    else if (isSelected) {
                      statusClass = isCouple ? 'bg-pink-500 text-white' : (isVip ? 'seat-vip-selected' : 'seat-selected');
                    } else if (isCouple) {
                      statusClass = 'bg-pink-100 border border-pink-400 text-pink-600';
                    } else if (isVip) {
                      statusClass = 'seat-vip-available';
                    }

                    return (
                      <div
                        key={seat._id}
                        onClick={() => {
                          if (seat.status === 'available') {
                            onSeatClick(seat);
                          }
                        }}
                        className={cn(
                          'h-6 md:h-8 rounded-sm md:rounded flex items-center justify-center text-[10px] md:text-xs font-medium transition-all duration-200 select-none cursor-pointer',
                          seat.spanColumns === 2 ? 'w-14 md:w-20' : 'w-6 md:w-8',
                          statusClass
                        )}
                        title={`Ghế ${seat.row}${seat.number} - ${isCouple ? 'Đôi' : (isVip ? 'VIP' : 'Thường')} ${isMaintenance ? '(Đang bảo trì)' : ''}`}
                      >
                        {isSelected ? '✓' : seat.number}
                      </div>
                    );
                  })}
                </div>
                <div className="w-10 md:w-14 text-center text-sm font-bold text-text-muted ml-4 md:ml-12">
                  {row}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-6 border-t border-dark-input w-full">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-sm seat-available border border-dark-input" />
          <span className="text-sm text-text-secondary">Trống</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-sm seat-selected" />
          <span className="text-sm text-text-secondary">Đang chọn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-sm seat-vip-available border border-accent-purple" />
          <span className="text-sm text-text-secondary">VIP Trống</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-sm seat-booked" />
          <span className="text-sm text-text-secondary">Đã đặt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-sm seat-held" />
          <span className="text-sm text-text-secondary">Đang giữ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-5 rounded-sm bg-pink-100 border border-pink-400" />
          <span className="text-sm text-text-secondary">Ghế đôi (Couple)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-sm bg-[#333] border border-[#555] opacity-50 flex items-center justify-center text-[10px]">🔧</div>
          <span className="text-sm text-text-secondary">Bảo trì/Hỏng</span>
        </div>
      </div>
      

    </div>
  );
};
