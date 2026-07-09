import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { moviesApi } from '../api/movies';
import { MovieCard } from '../components/features/MovieCard';
import { Input } from '../components/ui/Input';
import { Search } from 'lucide-react';

export const MoviesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFormat, setFilterFormat] = useState('All');

  const { data: moviesRes, isLoading } = useQuery({
    queryKey: ['movies'],
    queryFn: () => moviesApi.getAll(),
  });

  const movies = Array.isArray(moviesRes?.data?.data)
    ? moviesRes?.data?.data
    : (moviesRes?.data?.data?.movies || moviesRes?.data?.data?.items || []);

  const filteredMovies = movies.filter((movie: any) => 
    movie.title.toLowerCase().includes(searchTerm.toLowerCase())
    // Thêm logic lọc format nếu có field format (ví dụ: movie.format === filterFormat)
    // Hiện tại mock data không có format rõ ràng, nên ta chỉ lọc search term
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 sticky top-16 bg-dark-bg/95 backdrop-blur-sm z-30 py-4 border-b border-dark-input">
        <h1 className="text-h2 text-white">Danh sách phim</h1>
        
        <div className="flex w-full md:w-auto flex-col sm:flex-row gap-4">
          <Input 
            placeholder="Tìm kiếm phim..." 
            leftIcon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <div className="flex items-center gap-2 bg-dark-input p-1 rounded-sm">
            <button className={`px-4 py-1.5 text-sm rounded ${filterFormat === 'All' ? 'bg-dark-surface text-white shadow' : 'text-text-muted hover:text-white'} transition-all`} onClick={() => setFilterFormat('All')}>Tất cả</button>
            <button className={`px-4 py-1.5 text-sm rounded ${filterFormat === '2D' ? 'bg-dark-surface text-white shadow' : 'text-text-muted hover:text-white'} transition-all`} onClick={() => setFilterFormat('2D')}>2D</button>
            <button className={`px-4 py-1.5 text-sm rounded ${filterFormat === 'IMAX' ? 'bg-dark-surface text-white shadow' : 'text-text-muted hover:text-white'} transition-all`} onClick={() => setFilterFormat('IMAX')}>IMAX</button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-text-muted">Đang tải phim...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredMovies.length > 0 ? (
            filteredMovies.map((movie: any) => (
              <MovieCard key={movie._id} movie={movie} variant="full" />
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-text-muted">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="text-lg">Không tìm thấy phim nào phù hợp.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
