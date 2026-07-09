import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cinemasApi } from '../../api/cinemas';
import { useToastStore } from '../../stores/toastStore';
import type { Cinema, Room, Seat } from '../../types';

export const AdminSeatsPage: React.FC = () => {
  const [selectedCinema, setSelectedCinema] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  const updateSeatsMutation = useMutation({
    mutationFn: (data: any) => cinemasApi.updateSeats(data),
    onSuccess: () => {
      addToast('Cập nhật ghế thành công!', 'success');
      setSelectedSeatIds([]);
      queryClient.invalidateQueries({ queryKey: ['adminSeats', selectedRoom] });
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Lỗi cập nhật ghế', 'error');
    }
  });

  const handleBulkUpdate = (updateData: any) => {
    if (selectedSeatIds.length === 0) return;
    updateSeatsMutation.mutate({ seatIds: selectedSeatIds, ...updateData });
  };

  const handleSeatClick = (seatId: string) => {
    setSelectedSeatIds(prev => 
      prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId]
    );
  };

  const { data: cinemasData } = useQuery({
    queryKey: ['adminCinemas'],
    queryFn: cinemasApi.getCinemas,
  });
  const cinemas = cinemasData?.data?.data || [];

  const { data: roomsData } = useQuery({
    queryKey: ['adminRooms', selectedCinema],
    queryFn: () => cinemasApi.getRooms(selectedCinema),
    enabled: !!selectedCinema,
  });
  const rooms = roomsData?.data?.data || [];

  const { data: seatsData, isLoading: isLoadingSeats } = useQuery({
    queryKey: ['adminSeats', selectedRoom],
    queryFn: () => cinemasApi.getSeats(selectedRoom),
    enabled: !!selectedRoom,
  });
  const seats = seatsData?.data?.data || [];

  // Group seats by row
  const rows = seats.reduce((acc: any, seat: Seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const rowKeys = Object.keys(rows).sort();

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Quản lý Ghế (Seat Map)</h2>
          <p className="text-sm text-text-muted mt-1">Quản lý sơ đồ ghế, loại ghế và trạng thái ghế cho từng phòng chiếu.</p>
        </div>
      </div>

      <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl p-4 flex flex-wrap items-center gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-text-muted">Chọn rạp chiếu:</label>
          <select 
            value={selectedCinema}
            onChange={(e) => {
              setSelectedCinema(e.target.value);
              setSelectedRoom('');
            }}
            className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 min-w-[200px]"
          >
            <option value="">-- Chọn rạp --</option>
            {cinemas.map((cinema: Cinema) => (
              <option key={cinema._id} value={cinema._id}>{cinema.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-text-muted">Chọn phòng chiếu:</label>
          <select 
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            disabled={!selectedCinema || rooms.length === 0}
            className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 min-w-[200px] disabled:opacity-50"
          >
            <option value="">-- Chọn phòng --</option>
            {rooms.map((room: Room) => (
              <option key={room._id} value={room._id}>{room.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl overflow-hidden flex flex-col flex-1 p-8 items-center">
        {!selectedRoom ? (
          <div className="flex items-center justify-center h-64 text-text-muted">
            Vui lòng chọn rạp và phòng chiếu để xem sơ đồ ghế.
          </div>
        ) : isLoadingSeats ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
          </div>
        ) : seats.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-text-muted">
            Phòng chiếu này chưa có cấu hình ghế.
          </div>
        ) : (
          <div className="w-full max-w-4xl overflow-x-auto pb-8">
            {/* Screen Arc */}
            <div className="w-3/4 max-w-2xl mx-auto h-8 border-t-4 border-[#2B2B2B] rounded-[50%] mb-16 relative flex justify-center mt-4">
              <span className="absolute -top-6 text-text-muted font-bold tracking-[0.3em] uppercase text-xs">Màn hình</span>
              <div className="absolute w-full h-12 bg-gradient-to-b from-[#2B2B2B]/40 to-transparent top-0 opacity-50 blur-md"></div>
            </div>

            {/* Seat Grid */}
            <div className="flex flex-col gap-3 mx-auto w-max">
              {rowKeys.map(rowKey => (
                <div key={rowKey} className="flex gap-2 justify-center items-center">
                  <div className="w-12 text-center font-bold text-text-muted text-sm mr-12">{rowKey}</div>
                  {rows[rowKey].sort((a: Seat, b: Seat) => a.number - b.number).map((seat: Seat) => {
                    let bgClass = "bg-[#353534] border-[#2B2B2B]"; // standard available
                    if (seat.type === 'vip') bgClass = "bg-[#E50914]/20 border-[#E50914]/50 text-[#E50914]";
                    if (seat.type === 'couple') bgClass = "bg-accent-teal/20 border-accent-teal/50 text-accent-teal w-16";
                    if (seat.status === 'locked' || seat.status === 'booked' || seat.status === 'inactive') bgClass = "bg-[#2B2B2B]/40 border-[#2B2B2B]/20 opacity-50 cursor-not-allowed text-text-muted";
                    if (seat.status === 'maintenance' || seat.status === 'broken') bgClass = "bg-[#ff9900]/20 border-[#ff9900]/50 text-[#ff9900] opacity-80 line-through";

                    const isSelected = selectedSeatIds.includes(seat._id);
                    if (isSelected) {
                      bgClass += " ring-2 ring-white ring-offset-2 ring-offset-[#1F1F1F]";
                    }

                    return (
                      <div 
                        key={seat._id}
                        className={`h-8 rounded-t-lg rounded-b-sm border flex items-center justify-center text-xs font-mono transition-transform hover:scale-110 cursor-pointer ${
                          seat.type === 'couple' ? 'w-16' : 'w-8'
                        } ${bgClass}`}
                        title={`${seat.row}${seat.number} - ${seat.type} (${seat.status})`}
                        onClick={() => handleSeatClick(seat._id)}
                      >
                        {seat.status === 'maintenance' || seat.status === 'broken' ? '🔧' : seat.number}
                      </div>
                    )
                  })}
                  <div className="w-12 text-center font-bold text-text-muted text-sm ml-12">{rowKey}</div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-12 pt-6 border-t border-[#2B2B2B]/50">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-t-sm border border-[#2B2B2B] bg-[#353534]"></div>
                <span className="text-xs text-text-muted">Ghế Thường</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-t-sm border border-[#E50914]/50 bg-[#E50914]/20"></div>
                <span className="text-xs text-text-muted">Ghế VIP</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 rounded-t-sm border border-accent-teal/50 bg-accent-teal/20"></div>
                <span className="text-xs text-text-muted">Ghế Đôi</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-t-sm border border-[#2B2B2B]/20 bg-[#2B2B2B]/40 opacity-50"></div>
                <span className="text-xs text-text-muted">Đã Đặt/Bảo Trì</span>
              </div>
            </div>

            {/* Floating Action Bar */}
            {selectedSeatIds.length > 0 && (
              <div className="fixed top-1/2 right-8 -translate-y-1/2 bg-[#2B2B2B] border border-[#333] shadow-2xl rounded-2xl p-6 flex flex-col items-center gap-6 z-50 animate-in slide-in-from-right-10 fade-in">
                <button onClick={() => setSelectedSeatIds([])} className="absolute top-2 right-2 text-text-muted hover:text-white transition p-1">✕</button>
                
                <div className="text-white font-bold text-lg text-center w-full pb-4 border-b border-[#444]">
                  Đã chọn:<br /><span className="text-brand-red text-2xl">{selectedSeatIds.length}</span> ghế
                </div>
                
                <div className="flex flex-col gap-3 w-full">
                  <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">Loại ghế</span>
                  <button onClick={() => handleBulkUpdate({ type: 'standard' })} className="w-full py-2.5 bg-[#353534] hover:bg-[#444] rounded text-sm font-semibold text-white transition">Thường</button>
                  <button onClick={() => handleBulkUpdate({ type: 'vip' })} className="w-full py-2.5 bg-[#E50914]/20 hover:bg-[#E50914]/40 border border-[#E50914]/50 rounded text-sm font-semibold text-[#E50914] transition">VIP</button>
                  <button onClick={() => handleBulkUpdate({ type: 'couple', spanColumns: 2 })} className="w-full py-2.5 bg-accent-teal/20 hover:bg-accent-teal/40 border border-accent-teal/50 rounded text-sm font-semibold text-accent-teal transition">Đôi</button>
                </div>
                
                <div className="w-full h-px bg-[#444]"></div>

                <div className="flex flex-col gap-3 w-full">
                  <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">Trạng thái</span>
                  <button onClick={() => handleBulkUpdate({ status: 'active' })} className="w-full py-2.5 bg-green-500/20 hover:bg-green-500/40 border border-green-500/50 rounded text-sm font-semibold text-green-500 transition">Hoạt động</button>
                  <button onClick={() => {
                    const note = prompt('Nhập lý do bảo trì:');
                    if (note !== null) handleBulkUpdate({ status: 'maintenance', statusNote: note });
                  }} className="w-full py-2.5 bg-[#ff9900]/20 hover:bg-[#ff9900]/40 border border-[#ff9900]/50 rounded text-sm font-semibold text-[#ff9900] transition">Bảo trì</button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};
