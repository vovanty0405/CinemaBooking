import React from 'react';
import { Clock } from 'lucide-react';
import { CountdownTimer } from '../ui/CountdownTimer';

interface BookingTimerProps {
  expiresAt: string | Date;
  onExpired?: () => void;
}

export const BookingTimer: React.FC<BookingTimerProps> = ({ expiresAt, onExpired }) => {
  return (
    <div className="flex items-center gap-2 bg-dark-surface border border-dark-input px-4 py-2 rounded-md">
      <Clock className="text-text-muted" size={18} />
      <span className="text-sm text-text-secondary">Thời gian giữ ghế:</span>
      <CountdownTimer 
        expiresAt={expiresAt} 
        onExpired={onExpired}
        className="text-lg"
      />
    </div>
  );
};
