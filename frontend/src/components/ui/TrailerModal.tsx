import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerUrl: string;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ isOpen, onClose, trailerUrl }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !trailerUrl) return null;

  // Extract YouTube video ID
  let videoId = trailerUrl;
  try {
    if (trailerUrl.includes('youtube.com/watch')) {
      videoId = new URL(trailerUrl).searchParams.get('v') || '';
    } else if (trailerUrl.includes('youtu.be/')) {
      videoId = trailerUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (trailerUrl.includes('youtube.com/embed/')) {
      videoId = trailerUrl.split('youtube.com/embed/')[1]?.split('?')[0] || '';
    }
  } catch (e) {
    // Ignore URL parse errors
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" 
        onClick={onClose} 
      />
      
      {/* Video Container */}
      <div className="relative w-full max-w-5xl aspect-video mx-4 z-10 animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-[#E50914] transition-colors flex items-center gap-2"
        >
          <span className="uppercase text-sm font-bold tracking-widest hidden sm:block">Đóng</span>
          <div className="p-1 border-2 border-white rounded-full hover:border-[#E50914] transition-colors bg-black/50">
            <X size={24} />
          </div>
        </button>
        <iframe 
          className="w-full h-full rounded-lg shadow-2xl bg-black border border-white/10"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} 
          title="Movie Trailer" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};
