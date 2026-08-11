import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { moviesApi } from '../api/movies';
import { showtimesApi } from '../api/showtimes';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TrailerModal } from '../components/ui/TrailerModal';
import { Button } from '../components/ui/Button';
import { ReviewSection } from '../components/features/ReviewSection';
import { Star } from 'lucide-react';

export const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  // Generate next 7 days
  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // Queries
  const { data: movieRes, isLoading: movieLoading } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => moviesApi.getById(id!),
    enabled: !!id,
  });

  const { data: showtimesRes, isLoading: showtimesLoading } = useQuery({
    queryKey: ['showtimes', id, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => showtimesApi.getByMovie(id!, format(selectedDate, 'yyyy-MM-dd')),
    enabled: !!id,
  });

  const movie = movieRes?.data?.data;
  const showtimesData = showtimesRes?.data?.data as any;
  const showtimes = Array.isArray(showtimesData) 
    ? showtimesData 
    : (showtimesData?.showtimes || showtimesData?.items || []);

  // Group showtimes by cinema
  const showtimesByCinema = showtimes.reduce((acc: any, showtime: any) => {
    const cinemaId = showtime.room?.cinema?._id || 'unknown';
    if (!acc[cinemaId]) {
      acc[cinemaId] = {
        cinema: showtime.room?.cinema || { name: 'Rạp không xác định', location: '' },
        showtimes: []
      };
    }
    acc[cinemaId].showtimes.push(showtime);
    return acc;
  }, {});

  const groupedCinemas = Object.values(showtimesByCinema);

  if (movieLoading) {
    return <div className="w-full h-[60vh] flex items-center justify-center text-text-muted">Đang tải thông tin phim...</div>;
  }

  if (!movie) {
    return <div className="w-full h-[60vh] flex items-center justify-center text-text-muted">Không tìm thấy thông tin phim.</div>;
  }

  return (
    <div className="w-full pb-20 bg-dark-bg min-h-screen">
      {/* 1. Header Title */}
      <div className="container mx-auto px-4 pt-12">
        <h1 className="text-3xl md:text-4xl font-normal text-white border-b-2 border-[#2B2B2B] pb-4 mb-8 uppercase font-serif tracking-wider">
          Nội Dung Phim
        </h1>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Left: Poster */}
          <div className="w-full sm:w-2/3 md:w-[320px] mx-auto md:mx-0 flex-shrink-0">
            <div className="relative group">
              <img 
                src={movie.posterUrl || 'https://via.placeholder.com/300x450'} 
                alt={movie.title} 
                className="w-full rounded shadow-[0_10px_30px_rgba(0,0,0,0.8)] object-cover aspect-[2/3]"
              />
              <div 
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded"
                onClick={() => setIsTrailerOpen(true)}
              >
                <div className="w-16 h-16 rounded-full bg-[#E50914] flex items-center justify-center shadow-[0_0_20px_rgba(229,9,20,0.5)]">
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex-1 text-text-primary">
            <h2 className="text-3xl md:text-4xl font-bold uppercase mb-6 text-white leading-tight">
              {movie.title}
            </h2>
            
            <div className="space-y-3 text-sm md:text-base text-text-secondary">
              <p className="flex items-center gap-2 mb-2">
                <span className="font-bold text-white text-xl flex items-center gap-1">
                  <Star size={20} fill="#F5A623" className="text-[#F5A623]" /> 
                  {movie.avgRatingScore ? movie.avgRatingScore.toFixed(1) : 0}
                </span>
                <span className="text-text-muted">({movie.totalReviews || 0} đánh giá)</span>
              </p>
              <p><span className="font-bold text-white w-28 inline-block">Đạo diễn:</span> {movie.director || 'Đang cập nhật'}</p>
              <p><span className="font-bold text-white w-28 inline-block">Diễn viên:</span> {movie.cast && movie.cast.length > 0 ? movie.cast.join(', ') : 'Đang cập nhật'}</p>
              <p><span className="font-bold text-white w-28 inline-block">Thể loại:</span> <span className="capitalize">{(movie.genre || []).join(', ')}</span></p>
              <p><span className="font-bold text-white w-28 inline-block">Khởi chiếu:</span> {movie.releaseDate ? format(new Date(movie.releaseDate), 'dd/MM/yyyy') : 'N/A'}</p>
              <p><span className="font-bold text-white w-28 inline-block">Thời lượng:</span> {movie.duration || 120} phút</p>
              <p><span className="font-bold text-white w-28 inline-block">Ngôn ngữ:</span> {movie.language || 'Phụ đề Tiếng Việt'}</p>
              <p className="flex items-start">
                <span className="font-bold text-white w-28 shrink-0">Rated:</span> 
                <span>
                  <span className="inline-block bg-brand-red text-white text-xs font-bold px-1.5 py-0.5 rounded mr-2">
                    {movie.rating}
                  </span>
                  - Phim được phép phổ biến đến người xem {movie.rating === 'P' ? 'ở mọi độ tuổi' : 'từ ' + (movie.rating?.replace('C', '') || 13) + ' tuổi trở lên'}.
                </span>
              </p>
            </div>

            {/* Format Badges */}
            <div className="flex flex-wrap gap-2 mt-6">
              {(movie.formats || ['2D']).map((format: string) => {
                let borderClass = 'border-text-muted text-text-secondary';
                if (format === 'IMAX') borderClass = 'border-[#3B82F6] text-[#3B82F6]';
                else if (format === '4DX') borderClass = 'border-[#F97316] text-[#F97316]';
                
                return (
                  <span key={format} className={`px-3 py-1 border text-xs font-bold rounded uppercase ${borderClass}`}>
                    {format}
                  </span>
                );
              })}
            </div>

            {/* Buy Ticket Button */}
            <div className="mt-8">
              <Button 
                onClick={() => {
                  const el = document.getElementById('showtimes-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-[#E50914] hover:bg-[#B20710] text-white font-bold uppercase px-12 py-3.5 rounded-sm shadow-[0_4px_15px_rgba(229,9,20,0.4)] transition-all hover:scale-105 flex items-center gap-3 text-lg"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Mua vé
              </Button>
            </div>
          </div>
        </div>

        {/* Divider: Chi tiết | Trailer */}
        <div className="mt-16 border-t border-[#2B2B2B] relative flex justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E50914] text-white px-10 py-2.5 font-bold flex gap-6 uppercase shadow-lg transform -skew-x-12">
            <span className="transform skew-x-12 cursor-pointer hover:text-white/80 transition-colors">Chi tiết</span>
            <span className="transform skew-x-12 opacity-50">|</span>
            <span className="transform skew-x-12 cursor-pointer hover:text-white/80 transition-colors" onClick={() => setIsTrailerOpen(true)}>Trailer</span>
          </div>
        </div>

        {/* Description */}
        <div className="mt-16 text-text-secondary leading-relaxed text-base md:text-lg text-justify mx-auto max-w-5xl">
          <p>{movie.description || 'Chưa có thông tin mô tả cho phim này.'}</p>
        </div>
      </div>

      {/* 2. Lịch chiếu */}
      <div className="container mx-auto px-4 mt-20" id="showtimes-section">
        <h2 className="text-3xl md:text-4xl font-normal text-white border-b-2 border-[#2B2B2B] pb-4 mb-8 uppercase font-serif tracking-wider">
          Lịch Chiếu
        </h2>
        
        {/* Date Tabs */}
        <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar border-b border-dark-input mb-8">
          {next7Days.map((date, idx) => {
            const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center min-w-[80px] p-3 rounded-t-lg transition-colors border-b-2 ${
                  isSelected 
                    ? 'border-brand-red bg-dark-surface text-white' 
                    : 'border-transparent text-text-muted hover:text-white hover:bg-dark-input'
                }`}
              >
                <span className="text-xs uppercase font-medium">{idx === 0 ? 'Hôm nay' : format(date, 'EEEE', { locale: vi })}</span>
                <span className="text-lg font-bold">{format(date, 'dd/MM')}</span>
              </button>
            );
          })}
        </div>

        {/* Cinema List */}
        <div className="space-y-8 max-w-5xl mx-auto">
          {showtimesLoading ? (
            <div className="text-center py-8 text-text-muted">Đang tải lịch chiếu...</div>
          ) : groupedCinemas.length > 0 ? (
            groupedCinemas.map((group: any, cIdx) => (
              <div key={cIdx} className="bg-dark-surface p-6 rounded-xl border border-dark-input shadow-lg">
                <div className="mb-6 pb-4 border-b border-dark-input flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 8h8" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{group.cinema.name}</h3>
                    <p className="text-sm text-text-secondary mt-1">{group.cinema.location}</p>
                  </div>
                </div>
                
                <div className="pl-2">
                  <p className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                    <span className="px-2 py-0.5 border border-text-muted rounded text-xs">2D</span> 
                    Standard
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {group.showtimes.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map((showtime: any, tIdx: number) => {
                      const timeString = format(new Date(showtime.startTime), 'HH:mm');
                      const isPast = new Date(showtime.startTime).getTime() < new Date().getTime();
                      return (
                        <Link 
                          key={tIdx} 
                          to={isPast ? '#' : `/booking/seat-selection/${showtime._id}`}
                          className={`px-5 py-2.5 rounded font-medium text-sm transition-all flex items-center gap-2 shadow-sm ${
                            isPast 
                              ? 'bg-dark-bg text-text-muted cursor-not-allowed opacity-40 line-through' 
                              : 'bg-dark-input text-white hover:bg-brand-red hover:text-white hover:shadow-[0_0_15px_rgba(229,9,20,0.6)] border border-transparent hover:border-brand-red'
                          }`}
                        >
                          {timeString}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-dark-surface rounded-xl border border-dashed border-dark-input">
              <p className="text-text-muted text-lg">Không có suất chiếu nào vào ngày này.</p>
            </div>
          )}
        </div>
        
        {/* Review Section */}
        <ReviewSection 
          movieId={movie._id} 
          avgRatingScore={movie.avgRatingScore || 0}
          totalReviews={movie.totalReviews || 0}
        />
      </div>
      
      <TrailerModal 
        isOpen={isTrailerOpen} 
        onClose={() => setIsTrailerOpen(false)} 
        trailerUrl={movie.trailerUrl} 
      />
    </div>
  );
};
