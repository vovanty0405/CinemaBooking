import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/tailwind';

interface CountdownTimerProps {
  expiresAt: string | Date;
  onExpired?: () => void;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiresAt, onExpired, className }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const targetDate = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        setTimeLeft(0);
        if (onExpired) onExpired();
      } else {
        setTimeLeft(distance);
      }
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const isWarning = timeLeft > 0 && timeLeft <= 120000; // < 2 minutes

  if (timeLeft <= 0) {
    return <span className={cn('text-brand-red font-bold', className)}>00:00</span>;
  }

  return (
    <span
      className={cn(
        'font-bold transition-colors',
        isWarning ? 'text-brand-red animate-pulse' : 'text-accent-orange',
        className
      )}
    >
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  );
};
