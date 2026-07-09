import React from 'react';
import type { Booking } from '../../types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { QrCode } from 'lucide-react';

interface ETicketProps {
  booking: Booking;
}

export const ETicket: React.FC<ETicketProps> = ({ booking }) => {
  const { showtime, seats, totalAmount, _id } = booking;
  const { movie, room, startTime } = showtime;
  const movieData = typeof movie === 'string' ? null : movie;

  const formattedDate = format(new Date(startTime), 'EEEE, dd/MM/yyyy', { locale: vi });
  const formattedTime = format(new Date(startTime), 'HH:mm');

  return (
    <div className="w-full max-w-md mx-auto bg-dark-surface rounded-xl overflow-hidden shadow-2xl border border-dark-input flex flex-col relative">
      {/* Ticket Header (Movie Info) */}
      <div className="p-6 pb-8 relative bg-gradient-to-br from-dark-surface to-dark-bg border-b border-dashed border-text-muted/50">
        <div className="flex gap-4">
          {movieData?.posterUrl && (
            <img 
              src={movieData.posterUrl} 
              alt={movieData.title} 
              className="w-20 h-28 object-cover rounded-md shadow-md"
            />
          )}
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-white leading-tight mb-2">{movieData?.title || 'Unknown'}</h3>
            <p className="text-sm text-text-secondary">{formattedDate}</p>
            <p className="text-sm text-brand-red font-semibold">{formattedTime}</p>
          </div>
        </div>

        {/* Cutouts for dashed line */}
        <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-dark-bg border-t border-r border-dark-input transform rotate-45" />
        <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-dark-bg border-t border-l border-dark-input transform -rotate-45" />
      </div>

      {/* Ticket Body (Details) */}
      <div className="p-6 pt-8 flex flex-col gap-6 relative bg-dark-surface">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Rạp</p>
            <p className="text-sm font-semibold text-white">{room.cinema.name}</p>
            <p className="text-xs text-text-secondary truncate mt-1" title={room.cinema.address}>
              {room.cinema.address}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Phòng chiếu</p>
            <p className="text-sm font-semibold text-white">{room.name}</p>
            <p className="text-xs text-accent-purple mt-1">{room.type.toUpperCase()}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Ghế ngồi</p>
          <div className="flex flex-wrap gap-2">
            {seats.map(seat => (
              <span key={seat.seat} className="text-sm font-semibold text-white bg-dark-input px-2 py-1 rounded">
                {seat.row}{seat.number}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-dark-input">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Tổng tiền</p>
            <p className="text-lg font-bold text-brand-red">
              {totalAmount.toLocaleString('vi-VN')} đ
            </p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Mã vé</p>
            <p className="font-mono text-sm font-bold text-white">#{_id.slice(-6).toUpperCase()}</p>
          </div>
        </div>

        {/* QR Code Placeholder */}
        <div className="mt-4 flex flex-col items-center justify-center p-4 bg-white rounded-lg">
          <QrCode className="text-dark-black" size={120} strokeWidth={1.5} />
          <p className="text-xs text-dark-black mt-2 font-medium">Quét mã tại quầy để lấy vé</p>
        </div>
      </div>
    </div>
  );
};
