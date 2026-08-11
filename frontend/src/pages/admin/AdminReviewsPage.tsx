import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../../api/reviews';
import { moviesApi } from '../../api/movies';
import { useToastStore } from '../../stores/toastStore';
import { 
  MessageCircle, Star, Search, EyeOff, Trash2, 
  ChevronLeft, ChevronRight, FileDown, Film
} from 'lucide-react';
import { format } from 'date-fns';

export const AdminReviewsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState<string>('');
  const [movieSearch, setMovieSearch] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sort, setSort] = useState('newest');
  
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  // Get stats
  const { data: statsRes } = useQuery({
    queryKey: ['adminReviewStats'],
    queryFn: () => reviewsApi.getReviewStats()
  });
  const stats = statsRes?.data?.data || { totalReviews: 0, hiddenReviews: 0, avgRating: 0 };

  // Fetch movies for selection list
  const { data: moviesRes, isLoading: isLoadingMovies } = useQuery({
    queryKey: ['allMoviesForReviews'],
    queryFn: () => moviesApi.getAll({ limit: 100 })
  });
  const movies = moviesRes?.data?.data?.movies || [];

  // Filter movies locally for left sidebar search
  const filteredMovies = movies.filter((m: any) => 
    m.title.toLowerCase().includes(movieSearch.toLowerCase())
  );

  // Auto-select first movie when list loads
  useEffect(() => {
    if (movies.length > 0 && !selectedMovieId) {
      setSelectedMovieId(movies[0]._id);
    }
  }, [movies, selectedMovieId]);

  // Fetch reviews for selected movie
  const { data: reviewsRes, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['adminReviews', selectedMovieId, page, search, filterRating, filterType, filterStatus, sort],
    queryFn: () => reviewsApi.getAdminReviews({
      page, 
      limit: 8, 
      movieId: selectedMovieId || undefined,
      search, 
      rating: filterRating || undefined, 
      type: filterType || undefined, 
      status: filterStatus || undefined, 
      sort
    }),
    enabled: !!selectedMovieId
  });

  const reviews = reviewsRes?.data?.data || [];
  const pagination = reviewsRes?.data?.pagination || { totalPages: 1 };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reviewsApi.deleteReview(id),
    onSuccess: () => {
      addToast('Đã xóa đánh giá thành công', 'success');
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      queryClient.invalidateQueries({ queryKey: ['adminReviewStats'] });
    },
    onError: (err: any) => addToast(err.response?.data?.message || 'Lỗi khi xóa', 'error')
  });

  const handleDelete = (id: string, isRoot: boolean) => {
    if (window.confirm(isRoot ? 'Bạn có chắc muốn xóa đánh giá gốc này? Kèm theo toàn bộ câu trả lời sẽ bị ẩn.' : 'Bạn có chắc muốn xóa câu trả lời này?')) {
      deleteMutation.mutate(id);
    }
  };

  const selectedMovie = movies.find((m: any) => m._id === selectedMovieId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Quản lý Đánh giá</h1>
          <p className="text-text-secondary">Chọn phim để quản lý các đánh giá và phản hồi của người dùng.</p>
        </div>
        <button 
          className="flex items-center gap-2 bg-[#2B2B2B] hover:bg-[#3B3B3B] text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm border border-[#3A3A3A]"
          onClick={() => {
            addToast('Đã xuất báo cáo ra Excel (Mock)', 'success');
          }}
        >
          <FileDown size={18} /> Xuất Excel
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-surface p-5 rounded-xl border border-dark-input flex items-center justify-between">
          <div>
            <p className="text-text-muted text-sm font-medium">Tổng Đánh Giá Gốc</p>
            <h3 className="text-3xl font-bold text-white mt-1">{stats.totalReviews}</h3>
          </div>
          <div className="p-3 bg-brand-red/10 rounded-lg">
            <MessageCircle className="text-brand-red" size={24} />
          </div>
        </div>
        <div className="bg-dark-surface p-5 rounded-xl border border-dark-input flex items-center justify-between">
          <div>
            <p className="text-text-muted text-sm font-medium">Điểm TB Hệ Thống</p>
            <h3 className="text-3xl font-bold text-[#F5A623] mt-1">{stats.avgRating.toFixed(1)} / 5</h3>
          </div>
          <div className="p-3 bg-[#F5A623]/10 rounded-lg">
            <Star className="text-[#F5A623]" size={24} />
          </div>
        </div>
        <div className="bg-dark-surface p-5 rounded-xl border border-dark-input flex items-center justify-between">
          <div>
            <p className="text-text-muted text-sm font-medium">Đánh Giá Đã Ẩn</p>
            <h3 className="text-3xl font-bold text-white mt-1">{stats.hiddenReviews}</h3>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg">
            <EyeOff className="text-text-muted" size={24} />
          </div>
        </div>
      </div>

      {/* Main Split-Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Pane: Movie Selector */}
        <div className="lg:col-span-4 bg-dark-surface rounded-xl border border-dark-input flex flex-col h-[600px] overflow-hidden shadow-lg">
          <div className="p-4 border-b border-dark-input bg-[#1A1A1A]">
            <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Danh Sách Phim</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                type="text" 
                placeholder="Tìm phim..." 
                value={movieSearch}
                onChange={(e) => setMovieSearch(e.target.value)}
                className="w-full bg-[#2B2B2B] text-white text-xs pl-9 pr-4 py-2 rounded-lg border-none focus:ring-1 focus:ring-brand-red focus:outline-none"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-[#2B2B2B]">
            {isLoadingMovies ? (
              <div className="p-8 text-center text-text-muted text-sm">Đang tải danh sách phim...</div>
            ) : filteredMovies.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-sm">Không tìm thấy phim.</div>
            ) : (
              filteredMovies.map((m: any) => {
                const isSelected = m._id === selectedMovieId;
                return (
                  <button
                    key={m._id}
                    onClick={() => {
                      setSelectedMovieId(m._id);
                      setPage(1); // reset reviews page
                    }}
                    className={`w-full p-4 flex gap-4 text-left transition-colors items-center ${
                      isSelected ? 'bg-[#2B2B2B]/60 border-l-4 border-brand-red' : 'hover:bg-[#1C1C1C]'
                    }`}
                  >
                    <img 
                      src={m.posterUrl || 'https://via.placeholder.com/60x80'} 
                      alt={m.title} 
                      className="w-10 h-14 rounded object-cover shrink-0 bg-gray-900 border border-dark-input"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm truncate">{m.title}</h4>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex items-center gap-0.5 text-[#F5A623] text-xs">
                          <Star size={12} fill="currentColor" />
                          <span className="font-bold">{m.avgRatingScore?.toFixed(1) || 0}</span>
                        </div>
                        <span className="text-text-muted text-xs">•</span>
                        <span className="text-text-muted text-xs">{m.totalReviews || 0} đánh giá</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Review List for selected Movie */}
        <div className="lg:col-span-8 bg-dark-surface rounded-xl border border-dark-input flex flex-col h-[600px] overflow-hidden shadow-lg">
          {/* Header */}
          <div className="p-4 border-b border-dark-input bg-[#1A1A1A] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              {selectedMovie ? (
                <>
                  <Film size={20} className="text-brand-red shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedMovie.title}</h3>
                    <p className="text-xs text-text-muted">Đang quản lý các đánh giá của phim này</p>
                  </div>
                </>
              ) : (
                <h3 className="text-sm font-bold text-white">Chọn một phim để xem</h3>
              )}
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <select 
                value={filterRating} onChange={(e) => { setFilterRating(e.target.value); setPage(1); }}
                className="bg-[#2B2B2B] text-white text-xs px-2.5 py-1.5 rounded border-none focus:outline-none"
              >
                <option value="">Số sao</option>
                <option value="5">5 Sao</option>
                <option value="4">4 Sao</option>
                <option value="3">3 Sao</option>
                <option value="2">2 Sao</option>
                <option value="1">1 Sao</option>
              </select>
              <select 
                value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                className="bg-[#2B2B2B] text-white text-xs px-2.5 py-1.5 rounded border-none focus:outline-none"
              >
                <option value="">Loại</option>
                <option value="root">Chỉ đánh giá</option>
                <option value="reply">Chỉ reply</option>
              </select>
              <select 
                value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="bg-[#2B2B2B] text-white text-xs px-2.5 py-1.5 rounded border-none focus:outline-none"
              >
                <option value="">Trạng thái</option>
                <option value="visible">Hiển thị</option>
                <option value="hidden">Đã ẩn</option>
              </select>
              <select 
                value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="bg-[#2B2B2B] text-white text-xs px-2.5 py-1.5 rounded border-none focus:outline-none"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="highest">Sao cao</option>
                <option value="lowest">Sao thấp</option>
              </select>
            </div>
          </div>

          {/* Search box inside selected movie reviews */}
          <div className="p-3 border-b border-dark-input bg-dark-surface/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <input 
                type="text" 
                placeholder="Tìm bình luận của phim này..." 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-[#1A1A1A] text-white text-xs pl-8 pr-4 py-2 rounded border border-dark-input focus:border-brand-red focus:outline-none"
              />
            </div>
          </div>

          {/* Reviews Container */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#2B2B2B]">
            {!selectedMovieId ? (
              <div className="p-8 text-center text-text-muted text-sm italic">
                Hãy chọn một bộ phim từ danh sách bên trái để hiển thị đánh giá.
              </div>
            ) : isLoadingReviews ? (
              <div className="p-8 text-center text-text-muted text-sm">Đang tải đánh giá...</div>
            ) : reviews.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-sm italic">
                Không tìm thấy bình luận nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              reviews.map((review: any) => (
                <div key={review._id} className="p-4 hover:bg-[#1A1A1A] transition-colors flex gap-3 group relative">
                  <img 
                    src={review.userId?.avatarUrl || 'https://via.placeholder.com/32'} 
                    alt="avatar" 
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">{review.userId?.name || 'Khách'}</span>
                          {review.userId?.role === 'admin' && (
                            <span className="bg-brand-red text-white text-[9px] px-1 py-0.5 rounded-full font-bold">Admin</span>
                          )}
                          {review.threadRootId !== null && (
                            <span className="text-[10px] bg-[#2B2B2B] text-gray-400 px-1.5 py-0.5 rounded">Reply</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {review.threadRootId === null ? (
                            <div className="flex text-[#F5A623] gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={12} fill={i < review.rating ? 'currentColor' : 'none'} className={i < review.rating ? 'text-[#F5A623]' : 'text-gray-700'} />
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-text-muted">
                              Trả lời: <span className="text-white">{review.replyToReviewId?.userId?.name || 'Review gốc'}</span>
                            </p>
                          )}
                          <span className="text-[10px] text-text-muted">•</span>
                          <span className="text-[10px] text-text-muted">
                            {format(new Date(review.createdAt), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-2">
                        {review.isDeleted ? (
                          <span className="text-[10px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded">Đã ẩn</span>
                        ) : (
                          <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">Hiển thị</span>
                        )}
                        {!review.isDeleted && (
                          <button 
                            onClick={() => handleDelete(review._id, review.threadRootId === null)}
                            className="text-text-muted hover:text-brand-red p-1 rounded hover:bg-brand-red/10 transition-colors opacity-0 group-hover:opacity-100"
                            title="Xóa/Ẩn bình luận này"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-text-secondary mt-2 leading-relaxed whitespace-pre-wrap break-words">
                      {review.comment}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Pagination */}
          {selectedMovieId && pagination.totalPages > 1 && (
            <div className="p-3 border-t border-dark-input bg-[#1A1A1A] flex items-center justify-between shrink-0">
              <span className="text-xs text-text-muted">Trang {page} / {pagination.totalPages}</span>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 bg-[#2B2B2B] text-white rounded hover:bg-[#3B3B3B] disabled:opacity-30 disabled:hover:bg-[#2B2B2B] transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="p-1 bg-[#2B2B2B] text-white rounded hover:bg-[#3B3B3B] disabled:opacity-30 disabled:hover:bg-[#2B2B2B] transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
