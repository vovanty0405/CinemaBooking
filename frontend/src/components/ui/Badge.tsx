import React from 'react';
import { cn } from '../../utils/tailwind';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'new' | 'hot' | 'imax' | 'selling-fast' | 'coming-soon' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  className, 
  ...props 
}) => {
  const variants = {
    'new': 'bg-accent-pink/10 text-accent-pink border border-accent-pink/20',
    'hot': 'bg-brand-red/10 text-brand-red border border-brand-red/20',
    'imax': 'bg-accent-purple/10 text-accent-purple border border-accent-purple/20',
    'selling-fast': 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20',
    'coming-soon': 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20',
    'default': 'bg-dark-surface text-text-secondary border border-dark-input',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
