import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock } from 'lucide-react';
import type { Movie } from '../../types';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/tailwind';

interface MovieCardProps {
  movie: Movie;
  variant?: 'compact' | 'full';
  className?: string;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, variant = 'compact', className }) => {
  return (
    <Link 
      to={`/movies/${movie._id}`}
      className={cn(
        "group relative flex flex-col rounded-md overflow-hidden bg-dark-surface transition-all duration-300 hover:scale-105 hover:shadow-[0_4px_12px_rgba(229,9,20,0.35)]",
        className
      )}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-dark-input">
        <img 
          src={movie.posterUrl || 'https://via.placeholder.com/300x450?text=No+Poster'} 
          alt={movie.title} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-dark-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
          <div className="bg-brand-red text-white px-6 py-2 rounded-sm font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform">
            Đặt vé
          </div>
        </div>
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <Badge variant="default" className="bg-dark-black/80">{movie.rating}</Badge>
          {movie.genre.includes('action') && <Badge variant="hot">Hot</Badge>}
        </div>
      </div>
      
      <div className="p-3 flex-1 flex flex-col justify-between">
        <h3 className="text-base font-semibold text-text-primary line-clamp-1 group-hover:text-brand-red transition-colors">
          {movie.title}
        </h3>
        
        {variant === 'full' && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-text-secondary line-clamp-1">{movie.genre.join(', ')}</p>
            <div className="flex items-center justify-between text-xs text-text-muted">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{movie.duration} phút</span>
              </div>
              <div className="flex items-center gap-1 text-accent-gold">
                <Star size={14} fill="currentColor" />
                <span className="text-text-primary">8.5</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};
