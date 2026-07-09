import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { moviesApi } from '../api/movies';
import { MovieCard } from '../components/features/MovieCard';
import { Search, Film } from 'lucide-react';
import { Input } from '../components/ui/Input';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [localQuery, setLocalQuery] = useState(query);

  const { data: moviesRes, isLoading: isSearching } = useQuery({
    queryKey: ['searchMovies', query],
    queryFn: () => moviesApi.getAll({ title: query }),
    enabled: !!query,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localQuery !== query) {
        setSearchParams(localQuery ? { q: localQuery } : {});
      }
    }, 500); // Debounce

    return () => clearTimeout(handler);
  }, [localQuery, query, setSearchParams]);

  const searchResults = Array.isArray(moviesRes?.data?.data)
    ? moviesRes?.data?.data
    : (moviesRes?.data?.data?.movies || moviesRes?.data?.data?.items || []);

  return (
    <div className="container mx-auto px-4 py-8 min-h-[70vh]">
      <div className="max-w-2xl mx-auto mb-12 relative">
        <Input 
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Nhập tên phim..."
          leftIcon={<Search size={20} />}
          className="py-4 text-lg bg-dark-surface shadow-xl"
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-brand-red" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {query && (
        <h2 className="text-xl text-text-secondary mb-6">
          Kết quả tìm kiếm cho: <span className="text-white font-bold">"{query}"</span> ({searchResults.length})
        </h2>
      )}

      {query ? (
        searchResults.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {searchResults.map((movie: any) => (
              <MovieCard key={movie._id} movie={movie} variant="compact" />
            ))}
          </div>
        ) : (
          !isSearching && (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
              <Film size={64} className="mb-4 opacity-20" />
              <p className="text-lg">Không tìm thấy phim nào khớp với từ khóa.</p>
              <p className="text-sm mt-2">Thử tìm kiếm bằng từ khóa khác.</p>
            </div>
          )
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted opacity-50">
          <Search size={64} className="mb-4" />
          <p className="text-lg">Nhập từ khóa để bắt đầu tìm kiếm</p>
        </div>
      )}
    </div>
  );
};
