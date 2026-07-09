import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { moviesApi } from '../api/movies';
import { promotionsApi } from '../api/promotions';
import { MovieCard } from '../components/features/MovieCard';
import { Button } from '../components/ui/Button';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TrailerModal } from '../components/ui/TrailerModal';
import { useRef } from 'react';

export const HomePage: React.FC = () => {
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [currentTrailerUrl, setCurrentTrailerUrl] = useState('');

  const { data: moviesRes, isLoading } = useQuery({
    queryKey: ['movies'],
    queryFn: () => moviesApi.getAll({ limit: 10 }),
  });

  const movies = Array.isArray(moviesRes?.data?.data) 
    ? moviesRes?.data?.data 
    : (moviesRes?.data?.data?.movies || moviesRes?.data?.data?.items || []);

  const heroMovies = movies.filter((m: any) => m.isFeatured).slice(0, 5);
  // fallback if no featured
  const featuredOrShowing = heroMovies.length > 0 ? heroMovies : movies.slice(0, 5);
  
  // Filter strictly by status
  const showingMovies = movies.filter((m: any) => m.status === 'now_showing').slice(0, 12);
  const upcomingMovies = movies.filter((m: any) => m.status === 'coming_soon').slice(0, 12);

  // Refs for sliders
  const showingRef = useRef<HTMLDivElement>(null);
  const upcomingRef = useRef<HTMLDivElement>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 400;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const { data: couponsRes } = useQuery({
    queryKey: ['featuredCoupons'],
    queryFn: () => promotionsApi.getCoupons({ isFeaturedOnHome: true, status: 'active' }),
  });
  const coupons = couponsRes?.data?.data || [];

  const { data: combosRes } = useQuery({
    queryKey: ['featuredCombos'],
    queryFn: () => promotionsApi.getCombos({ isFeaturedOnHome: true, status: 'active' }),
  });
  const combos = combosRes?.data?.data || [];

  const [isPaused, setIsPaused] = useState(false);

  // Auto slide effect
  useEffect(() => {
    if (featuredOrShowing.length === 0 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % featuredOrShowing.length);
    }, 6000); // 6s per the prompt
    return () => clearInterval(timer);
  }, [featuredOrShowing.length, isPaused]);

  return (
    <div className="w-full">
      {/* 1. Hero Banner */}
      <section 
        className="relative w-full h-[85vh] md:h-screen min-h-[600px] max-h-[900px] overflow-hidden bg-[#141414] group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#141414]">
            <span className="text-text-muted">Đang tải phim...</span>
          </div>
        ) : featuredOrShowing.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#141414]">
            <span className="text-text-muted">Chưa có dữ liệu phim</span>
          </div>
        ) : (
          featuredOrShowing.map((movie: any, index: number) => (
            <div
              key={movie._id || index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentHeroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {/* Backdrop Image with proper object fit */}
              <div 
                className="absolute inset-0 aspect-video md:aspect-[21/9]"
              >
                <img 
                  src={movie.backdropUrl || movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1920'} 
                  alt={movie.title}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Gradient Overlays */}
              <div 
                className="absolute inset-0 hidden md:block" 
                style={{ background: 'linear-gradient(90deg, #141414 0%, rgba(20,20,20,0.85) 35%, rgba(20,20,20,0.2) 65%, transparent 100%)' }} 
              />
              <div 
                className="absolute inset-0 md:hidden" 
                style={{ background: 'linear-gradient(0deg, #141414 60%, rgba(20,20,20,0.4) 100%)' }} 
              />
              <div 
                className="absolute inset-0 bottom-0 top-auto h-32" 
                style={{ background: 'linear-gradient(0deg, #141414 0%, transparent 100%)' }} 
              />
              
              {/* Content Box */}
              <div className="absolute inset-0 flex flex-col md:flex-row items-center md:items-end pb-20 md:pb-32 px-4 md:px-12 container mx-auto">
                <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left mt-auto md:mt-0 transition-transform duration-700 delay-100 translate-y-0">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                    <span className="bg-[#E50914] text-white text-xs font-bold px-2.5 py-1 rounded-sm uppercase tracking-wide">
                      {movie.status === 'coming_soon' ? 'SẮP CHIẾU' : 'ĐANG HOT'}
                    </span>
                    <span className="bg-[#F5A623] text-black text-xs font-bold px-2.5 py-1 rounded-sm shadow-sm">
                      {movie.rating || 'P'}
                    </span>
                  </div>
                  
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4 text-balance drop-shadow-2xl font-serif">
                    {movie.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-[#B3B3B3] mb-6 font-medium">
                    {movie.genre && movie.genre.length > 0 && (
                      <>
                        <span>{movie.genre.slice(0, 3).join(', ')}</span>
                        <span className="w-1 h-1 rounded-full bg-[#6B6B6B]" />
                      </>
                    )}
                    <span>{new Date(movie.releaseDate).getFullYear()}</span>
                    <span className="w-1 h-1 rounded-full bg-[#6B6B6B]" />
                    <span>{movie.duration} Phút</span>
                  </div>

                  <p className="text-base md:text-lg text-[#B3B3B3] mb-8 line-clamp-2 md:line-clamp-3 max-w-xl drop-shadow-md">
                    {movie.description}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link to={`/movies/${movie._id}`} className="w-full sm:w-auto">
                      <Button size="lg" className="w-full px-8 py-6 bg-[#E50914] hover:bg-[#B20710] text-white font-bold text-lg rounded shadow-xl transition-all hover:scale-105 active:scale-95">
                        Đặt vé ngay
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="lg" 
                      className="w-full sm:w-auto border-2 border-white/40 bg-black/20 text-white hover:bg-white/20 hover:border-white font-bold text-lg rounded px-8 py-6 gap-2 backdrop-blur-sm transition-all"
                      onClick={() => {
                        setCurrentTrailerUrl(movie.trailerUrl);
                        setIsTrailerOpen(true);
                      }}
                    >
                      <Play fill="currentColor" size={20} /> Xem trailer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Indicators */}
        {featuredOrShowing.length > 0 && (
          <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-2.5">
            {featuredOrShowing.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentHeroIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentHeroIndex ? 'w-8 bg-[#E50914]' : 'w-2.5 bg-white/40 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      <div className="container mx-auto px-4 py-16 space-y-24">
        {/* 2. Phim đang chiếu */}
        <section className="relative group/section">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 relative inline-block">
                Phim Đang Chiếu
                <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-brand-red rounded-full"></span>
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/movies" className="text-brand-red hover:text-white transition-colors text-sm font-medium hidden sm:block">
                Xem tất cả &rarr;
              </Link>
            </div>
          </div>
          
          <div className="relative">
            {/* Navigation buttons */}
            <button 
              onClick={() => scroll(showingRef, 'left')}
              className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-[#E50914] border border-white/10 hover:border-transparent text-white p-2.5 rounded-full shadow-2xl opacity-0 group-hover/section:opacity-100 transition-all duration-300 hidden md:block"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div 
              ref={showingRef}
              className="flex overflow-x-auto gap-6 pb-8 snap-x no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 min-h-[350px]"
            >
              {isLoading ? (
                <div className="text-text-muted w-full text-center">Đang tải...</div>
              ) : showingMovies.length > 0 ? (
                showingMovies.map((movie: any) => (
                  <div key={movie._id} className="w-[200px] md:w-[240px] flex-none snap-start shrink-0">
                    <MovieCard movie={movie} variant="full" />
                  </div>
                ))
              ) : (
                <div className="text-text-muted">Không có phim nào đang chiếu.</div>
              )}
            </div>

            <button 
              onClick={() => scroll(showingRef, 'right')}
              className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-[#E50914] border border-white/10 hover:border-transparent text-white p-2.5 rounded-full shadow-2xl opacity-0 group-hover/section:opacity-100 transition-all duration-300 hidden md:block"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </section>

        {/* 3. Phim sắp chiếu */}
        <section className="relative group/section">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 relative inline-block">
                Phim Sắp Ra Mắt
                <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-accent-purple rounded-full"></span>
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/movies" className="text-accent-purple hover:text-white transition-colors text-sm font-medium hidden sm:block">
                Xem tất cả &rarr;
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => scroll(upcomingRef, 'left')}
              className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-accent-purple border border-white/10 hover:border-transparent text-white p-2.5 rounded-full shadow-2xl opacity-0 group-hover/section:opacity-100 transition-all duration-300 hidden md:block"
            >
              <ChevronLeft size={24} />
            </button>

            <div 
              ref={upcomingRef}
              className="flex overflow-x-auto gap-6 pb-8 snap-x no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 min-h-[300px]"
            >
              {isLoading ? (
                <div className="text-text-muted w-full text-center">Đang tải...</div>
              ) : upcomingMovies.length > 0 ? (
                upcomingMovies.map((movie: any) => (
                  <div key={movie._id} className="w-[160px] md:w-[200px] flex-none snap-start shrink-0 relative">
                    <MovieCard movie={movie} variant="compact" />
                    <div className="absolute top-2 right-2">
                      <span className="bg-accent-purple text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">
                        SẮP RA MẮT
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-text-muted">Không có phim sắp ra mắt.</div>
              )}
            </div>

            <button 
              onClick={() => scroll(upcomingRef, 'right')}
              className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-accent-purple border border-white/10 hover:border-transparent text-white p-2.5 rounded-full shadow-2xl opacity-0 group-hover/section:opacity-100 transition-all duration-300 hidden md:block"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </section>

        {/* 4. Banner khuyến mãi */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-16">
          {coupons.slice(0, 2).map((coupon: any, index: number) => (
            <div key={`coupon-${index}`} className="rounded-xl p-8 flex flex-col justify-center items-start min-h-[200px] relative overflow-hidden group cursor-pointer" style={{ background: 'var(--gradient-premium)' }}>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-0" />
              <div className="relative z-10">
                <span className="bg-white text-dark-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                  {coupon.tagLabel || 'Khuyến mãi'}
                </span>
                <h3 className="text-2xl font-bold text-white mb-2">{coupon.name}</h3>
                <p className="text-white/80 max-w-sm font-mono text-lg mt-2 bg-black/40 px-3 py-1 inline-block rounded">Mã: {coupon.code}</p>
              </div>
            </div>
          ))}
          
          {combos.slice(0, 2).map((combo: any, index: number) => (
            <div key={`combo-${index}`} className="rounded-xl p-8 flex flex-col justify-center items-start min-h-[200px] relative overflow-hidden group cursor-pointer bg-dark-surface border border-dark-input hover:border-brand-red transition-colors">
              <div className="relative z-10">
                <span className="bg-brand-red text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                  {combo.tagLabel || 'Combo'}
                </span>
                <h3 className="text-2xl font-bold text-white mb-2">{combo.name}</h3>
                <p className="text-brand-red font-bold text-xl">{combo.comboPrice.toLocaleString('vi-VN')} đ</p>
              </div>
              <img src={combo.imageUrl} alt={combo.name} className="absolute right-4 bottom-4 h-32 w-32 object-contain opacity-50 group-hover:opacity-100 transition-opacity z-0 drop-shadow-xl" />
            </div>
          ))}

          {/* Static fallbacks if no dynamic promos found */}
          {coupons.length === 0 && combos.length === 0 && (
            <>
              <div className="rounded-xl p-8 flex flex-col justify-center items-start min-h-[200px] relative overflow-hidden group cursor-pointer" style={{ background: 'var(--gradient-premium)' }}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-0" />
                <div className="relative z-10">
                  <span className="bg-white text-dark-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                    Thành viên VIP
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-2">Giảm 20% khi mua vé online</h3>
                  <p className="text-white/80 max-w-sm">Áp dụng cho mọi suất chiếu trong tuần. Đăng ký ngay hôm nay!</p>
                </div>
              </div>
              <div className="rounded-xl p-8 flex flex-col justify-center items-start min-h-[200px] relative overflow-hidden group cursor-pointer bg-dark-surface border border-dark-input hover:border-brand-red transition-colors">
                <div className="relative z-10">
                  <span className="bg-brand-red text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                    Cuối tuần
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-2">Combo Bắp Nước Siêu Rẻ</h3>
                  <p className="text-text-secondary max-w-sm">Mua 2 vé bất kỳ tặng 1 phần bắp khổng lồ miễn phí.</p>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
      <TrailerModal 
        isOpen={isTrailerOpen} 
        onClose={() => setIsTrailerOpen(false)} 
        trailerUrl={currentTrailerUrl} 
      />
    </div>
  );
};
