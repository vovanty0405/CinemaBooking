import React from 'react';
import { cn } from '../../utils/tailwind';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  rounded = 'md',
  ...props
}) => {
  const roundings = {
    'sm': 'rounded-sm',
    'md': 'rounded-md',
    'lg': 'rounded-lg',
    'xl': 'rounded-xl',
    'full': 'rounded-full',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-dark-input',
        roundings[rounded],
        className
      )}
      style={{
        width: width || '100%',
        height: height || 'auto',
      }}
      {...props}
    />
  );
};
