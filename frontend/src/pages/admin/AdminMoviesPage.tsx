import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moviesApi } from '../../api/movies';
import { Modal } from '../../components/ui/Modal';
import axiosInstance from '../../api/axiosInstance';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToastStore } from '../../stores/toastStore';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Edit,
  Trash,
  Clock,
  Star,
  Film,
  Download,
} from 'lucide-react';
import type { Movie } from '../../types';

// ────────────────────────────── constants ──────────────────────────────
const GENRE_OPTIONS = [
  'action',
  'comedy',
  'drama',
  'horror',
  'sci-fi',
  'romance',
  'animation',
  'thriller',
] as const;

const RATING_OPTIONS: Movie['rating'][] = ['P', 'C13', 'C16', 'C18'];

interface MovieFormData {
  title: string;
  description: string;
  duration: number | '';
  genre: string[];
  language: string;
  releaseDate: string;
  endDate: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  rating: Movie['rating'];
  status: 'coming_soon' | 'now_showing' | 'ended';
  isFeatured: boolean;
}

const EMPTY_FORM: MovieFormData = {
  title: '',
  description: '',
  duration: '',
  genre: [],
  language: 'Vietnamese',
  releaseDate: '',
  endDate: '',
  posterUrl: '',
  backdropUrl: '',
  trailerUrl: '',
  rating: 'P',
  status: 'coming_soon',
  isFeatured: false,
};

// ────────────────────────────── component ──────────────────────────────
export const AdminMoviesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  // ── state ──
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [filterGenre, setFilterGenre] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Movie | null>(null);

  const [form, setForm] = useState<MovieFormData>(EMPTY_FORM);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [isUploadingBackdrop, setIsUploadingBackdrop] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'posterUrl' | 'backdropUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    if (field === 'posterUrl') setIsUploadingPoster(true);
    else setIsUploadingBackdrop(true);

    try {
      const res = await axiosInstance.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.data?.url;
      if (url) {
        setForm(prev => ({ ...prev, [field]: url }));
        addToast('Tải ảnh lên thành công!', 'success');
      } else {
        addToast('Không nhận được URL ảnh', 'error');
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Lỗi khi tải ảnh lên', 'error');
    } finally {
      if (field === 'posterUrl') setIsUploadingPoster(false);
      else setIsUploadingBackdrop(false);
    }
  };

  // ── debounce search (500 ms) ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // reset page when search or filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterGenre, filterStatus]);

  // ── query ──
  const { data, isLoading } = useQuery({
    queryKey: ['adminMovies', page, limit, debouncedSearch, filterGenre, filterStatus],
    queryFn: () =>
      moviesApi.getAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        genre: filterGenre || undefined,
        status: filterStatus || undefined,
      }),
  });

  const movies: Movie[] = data?.data?.data?.movies || [];
  const pagination = data?.data?.data?.pagination;

  // ── mutations ──
  const createMutation = useMutation({
    mutationFn: (payload: Partial<Movie>) => moviesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMovies'] });
      closeModal();
      addToast('Thêm phim thành công!', 'success');
    },
    onError: () => {
      addToast('Thêm phim thất bại. Vui lòng thử lại.', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Movie> }) =>
      moviesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMovies'] });
      closeModal();
      addToast('Cập nhật phim thành công!', 'success');
    },
    onError: () => {
      addToast('Cập nhật phim thất bại. Vui lòng thử lại.', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => moviesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMovies'] });
      setDeleteTarget(null);
      addToast('Xóa phim thành công!', 'success');
    },
    onError: () => {
      addToast('Xóa phim thất bại. Vui lòng thử lại.', 'error');
    },
  });

  // ── helpers ──
  const openCreateModal = useCallback(() => {
    setEditingMovie(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((movie: Movie) => {
    setEditingMovie(movie);
    setForm({
      title: movie.title,
      description: movie.description || '',
      duration: movie.duration,
      genre: movie.genre || [],
      language: movie.language || 'Vietnamese',
      releaseDate: movie.releaseDate
        ? movie.releaseDate.substring(0, 10)
        : '',
      endDate: movie.endDate
        ? movie.endDate.substring(0, 10)
        : '',
      posterUrl: movie.posterUrl || '',
      backdropUrl: movie.backdropUrl || '',
      trailerUrl: movie.trailerUrl || '',
      rating: movie.rating || 'P',
      status: movie.status || 'coming_soon',
      isFeatured: movie.isFeatured || false,
    });
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingMovie(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleGenre = (genre: string) => {
    setForm((prev) => ({
      ...prev,
      genre: prev.genre.includes(genre)
        ? prev.genre.filter((g) => g !== genre)
        : [...prev.genre, genre],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Partial<Movie> = {
      title: form.title,
      description: form.description,
      duration: Number(form.duration),
      genre: form.genre,
      language: form.language,
      releaseDate: form.releaseDate || undefined,
      endDate: form.endDate || undefined,
      posterUrl: form.posterUrl,
      backdropUrl: form.backdropUrl,
      trailerUrl: form.trailerUrl,
      rating: form.rating,
      status: form.status,
      isFeatured: form.isFeatured,
    };

    if (editingMovie) {
      updateMutation.mutate({ id: editingMovie._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ── rating badge color ──
  const ratingColor = (r: string) => {
    switch (r) {
      case 'P':
        return 'bg-green-600/20 text-green-400 border-green-500/30';
      case 'C13':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30';
      case 'C16':
        return 'bg-orange-600/20 text-orange-400 border-orange-500/30';
      case 'C18':
        return 'bg-red-600/20 text-red-400 border-red-500/30';
      default:
        return 'bg-[#353534] text-white';
    }
  };

  // ──────────────────────────── render ─────────────────────────────────
  return (
    <div className="flex flex-col min-h-full">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Quản lý Phim</h2>
          <p className="text-sm text-text-muted mt-1">
            Quản lý danh sách phim, thông tin và lịch chiếu.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2B2B2B] text-white hover:bg-[#1F1F1F] transition-colors text-sm font-semibold">
            <Download size={18} />
            Export Excel
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-brand-red to-[#B20710] hover:from-[#FF1E2A] hover:to-[#CC0812] text-white text-sm font-semibold shadow-lg shadow-brand-red/20 transition-all active:scale-95"
          >
            <Plus size={18} />
            Thêm Phim Mới
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-[#1F1F1F]/80 backdrop-blur-xl border border-[#2B2B2B] rounded-xl p-4 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* view toggle */}
        <div className="flex items-center gap-2 bg-[#1C1B1B] p-1 rounded-lg border border-[#2B2B2B]">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded flex items-center justify-center transition-colors ${
              viewMode === 'grid'
                ? 'bg-[#353534] text-white shadow-sm'
                : 'text-text-muted hover:bg-[#2A2A2A]'
            }`}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded flex items-center justify-center transition-colors ${
              viewMode === 'list'
                ? 'bg-[#353534] text-white shadow-sm'
                : 'text-text-muted hover:bg-[#2A2A2A]'
            }`}
          >
            <List size={20} />
          </button>
        </div>

        {/* search and filters */}
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Tìm theo tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#2B2B2B] border border-[#2B2B2B] rounded-lg text-sm text-white placeholder-text-muted focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-colors"
            />
          </div>
          
          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red outline-none px-4 py-2 cursor-pointer w-full md:w-auto"
          >
            <option value="">Tất cả thể loại</option>
            {GENRE_OPTIONS.map((g) => (
              <option key={g} value={g} className="capitalize">{g}</option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red outline-none px-4 py-2 cursor-pointer w-full md:w-auto"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="now_showing">Đang chiếu</option>
            <option value="coming_soon">Sắp chiếu</option>
            <option value="ended">Đã kết thúc</option>
          </select>
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red" />
        </div>
      ) : movies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Film size={48} className="mb-4 opacity-40" />
          <p className="text-lg font-medium">Không tìm thấy phim nào</p>
          <p className="text-sm mt-1">
            {debouncedSearch
              ? 'Thử tìm kiếm với từ khóa khác.'
              : 'Bắt đầu bằng cách thêm phim mới.'}
          </p>
        </div>
      ) : (
        <>
          {/* ── Grid View ── */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {movies.map((movie) => (
                <div
                  key={movie._id}
                  className="group flex flex-col bg-[#201F1F] rounded-xl overflow-hidden border border-[#2B2B2B] transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 duration-300 relative"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden">
                    <img
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={movie.posterUrl}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent opacity-80" />

                    {/* status badge */}
                    <div className="absolute top-2 left-2 flex gap-1 flex-col">
                      <span className="bg-brand-red/20 text-brand-red text-[10px] px-2 py-1 rounded-sm backdrop-blur-md border border-brand-red/30 uppercase font-bold tracking-wider">
                        {movie.isActive ? 'Đang Chiếu' : 'Ngừng Chiếu'}
                      </span>
                    </div>
                    {/* rating */}
                    <div className="absolute top-2 right-2">
                      <span className="bg-brand-red/90 text-white text-[11px] px-2 py-1 rounded-sm shadow-md font-bold">
                        {movie.rating}
                      </span>
                    </div>

                    {/* hover overlay */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 flex items-center justify-center gap-2 transition-opacity duration-300 group-hover:opacity-100">
                      <button
                        onClick={() => openEditModal(movie)}
                        className="w-10 h-10 rounded-full bg-[#131313] text-white flex items-center justify-center hover:bg-brand-red transition-colors shadow-lg"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(movie)}
                        className="w-10 h-10 rounded-full bg-[#131313] text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-sm font-semibold text-white line-clamp-1 mb-1">
                      {movie.title}
                    </h3>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[12px] text-text-muted flex items-center gap-1">
                        <Clock size={12} /> {movie.duration} Phút
                      </span>
                      <div className="flex items-center text-[#FFD700]">
                        <Star size={12} fill="#FFD700" />
                        <span className="text-[12px] ml-1 text-white">
                          4.5
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {movie.genre.slice(0, 2).map((g, i) => (
                        <span
                          key={i}
                          className="px-2 py-[2px] rounded-full bg-accent-teal/10 text-accent-teal text-[10px] border border-accent-teal/20"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── List / Table View ── */
            <div className="bg-[#201F1F] rounded-xl border border-[#2B2B2B] overflow-hidden">
              <table className="w-full text-left text-sm text-text-muted">
                <thead className="bg-[#1C1B1B] text-white font-semibold">
                  <tr>
                    <th className="px-4 py-3">Phim</th>
                    <th className="px-4 py-3">Thời lượng</th>
                    <th className="px-4 py-3">Ngày chiếu</th>
                    <th className="px-4 py-3">Độ tuổi</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B2B2B]">
                  {movies.map((movie, idx) => (
                    <tr
                      key={movie._id}
                      className={`group hover:bg-[#2A2A2A] transition-colors ${
                        idx % 2 === 1 ? 'bg-[#1A1A1A]' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-[60px] h-[80px] object-cover rounded bg-dark-input flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-white line-clamp-1">
                              {movie.title}
                            </p>
                            <p className="text-xs mt-0.5">
                              {movie.genre.join(', ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{movie.duration} phút</td>
                      <td className="px-4 py-3">
                        {movie.releaseDate
                          ? new Date(movie.releaseDate).toLocaleDateString(
                              'vi-VN',
                            )
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${ratingColor(
                            movie.rating,
                          )}`}
                        >
                          {movie.rating}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {movie.isActive ? (
                          <span className="text-accent-teal text-xs flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-accent-teal inline-block" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="text-text-muted text-xs flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-text-muted inline-block" />
                            Ngừng chiếu
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(movie)}
                            className="p-1.5 rounded hover:bg-[#353534] hover:text-white transition-colors"
                            title="Sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(movie)}
                            className="p-1.5 rounded hover:bg-red-600/20 hover:text-red-500 transition-colors"
                            title="Xóa"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {pagination && (
            <div className="mt-6">
              <Pagination
                page={page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                total={pagination.total}
                limit={limit}
              />
            </div>
          )}
        </>
      )}

      {/* ── Create / Edit Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingMovie ? 'Chỉnh sửa phim' : 'Thêm phim mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cột trái: Thông tin văn bản */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Tên phim <span className="text-brand-red">*</span></label>
                <input type="text" name="title" required value={form.title} onChange={handleFormChange} placeholder="Nhập tên phim..." className="w-full px-4 py-2.5 bg-[#2B2B2B] text-white rounded-lg border border-[#2B2B2B] focus:ring-2 focus:ring-brand-red outline-none text-sm placeholder-text-muted" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Mô tả</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} placeholder="Nhập mô tả phim..." className="w-full px-4 py-2.5 bg-[#2B2B2B] text-white rounded-lg border border-[#2B2B2B] focus:ring-2 focus:ring-brand-red outline-none text-sm placeholder-text-muted resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Thời lượng (phút) <span className="text-brand-red">*</span></label>
                  <input type="number" name="duration" required min={1} value={form.duration} onChange={handleFormChange} placeholder="120" className="w-full px-4 py-2.5 bg-[#2B2B2B] text-white rounded-lg border border-[#2B2B2B] focus:ring-2 focus:ring-brand-red outline-none text-sm placeholder-text-muted" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Phân loại</label>
                  <select name="rating" value={form.rating} onChange={handleFormChange} className="w-full px-4 py-2.5 bg-[#2B2B2B] text-white rounded-lg border border-[#2B2B2B] focus:ring-2 focus:ring-brand-red outline-none text-sm cursor-pointer">
                    {RATING_OPTIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Ngày khởi chiếu</label>
                  <input type="date" name="releaseDate" value={form.releaseDate} onChange={handleFormChange} className="w-full px-4 py-2.5 bg-[#2B2B2B] text-white rounded-lg border border-[#2B2B2B] focus:ring-2 focus:ring-brand-red outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Ngày kết thúc</label>
                  <input type="date" name="endDate" value={form.endDate} onChange={handleFormChange} className="w-full px-4 py-2.5 bg-[#2B2B2B] text-white rounded-lg border border-[#2B2B2B] focus:ring-2 focus:ring-brand-red outline-none text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Trạng thái</label>
                  <select name="status" value={form.status} onChange={handleFormChange} className="w-full px-4 py-2.5 bg-[#2B2B2B] text-white rounded-lg border border-[#2B2B2B] focus:ring-2 focus:ring-brand-red outline-none text-sm cursor-pointer">
                    <option value="coming_soon">Sắp chiếu</option>
                    <option value="now_showing">Đang chiếu</option>
                    <option value="ended">Đã kết thúc</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Ngôn ngữ</label>
                  <input type="text" name="language" value={form.language} onChange={handleFormChange} placeholder="Vietnamese" className="w-full px-4 py-2.5 bg-[#2B2B2B] text-white rounded-lg border border-[#2B2B2B] focus:ring-2 focus:ring-brand-red outline-none text-sm placeholder-text-muted" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Thể loại</label>
                <div className="grid grid-cols-3 gap-2">
                  {GENRE_OPTIONS.map((genre) => (
                    <label key={genre} className={`flex items-center gap-2 px-2 py-2 rounded-lg border cursor-pointer transition-colors text-xs select-none ${form.genre.includes(genre) ? 'bg-brand-red/15 border-brand-red/40 text-white' : 'bg-[#2B2B2B] border-[#2B2B2B] text-text-muted hover:border-[#3B3B3B]'}`}>
                      <input type="checkbox" checked={form.genre.includes(genre)} onChange={() => toggleGenre(genre)} className="sr-only" />
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${form.genre.includes(genre) ? 'bg-brand-red border-brand-red' : 'border-[#555] bg-transparent'}`}>
                        {form.genre.includes(genre) && (<svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>)}
                      </span>
                      <span className="capitalize">{genre}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center mt-2">
                <input type="checkbox" id="isFeatured" name="isFeatured" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="w-4 h-4 text-brand-red bg-dark-input border-dark-input focus:ring-brand-red rounded" />
                <label htmlFor="isFeatured" className="ml-2 text-sm font-medium text-white cursor-pointer">Phim nổi bật (Hiển thị Hero Banner)</label>
              </div>
            </div>

            {/* Cột phải: Media / Hình ảnh */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Poster Phim (2:3) <span className="text-brand-red">*</span></label>
                <div className="flex gap-2 mb-3">
                  <input type="text" name="posterUrl" required value={form.posterUrl} onChange={handleFormChange} placeholder="Nhập URL ảnh..." className="flex-1 px-4 py-2.5 bg-[#2B2B2B] text-white rounded-lg border border-[#2B2B2B] focus:ring-2 focus:ring-brand-red outline-none text-sm placeholder-text-muted" />
                  <label className="px-4 py-2 bg-brand-red/10 border border-brand-red/20 text-brand-red hover:bg-brand-red/20 text-sm font-semibold rounded-lg flex items-center justify-center cursor-pointer transition-colors whitespace-nowrap">
                    {isUploadingPoster ? 'Đang tải...' : 'Tải file'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'posterUrl')} disabled={isUploadingPoster} />
                  </label>
                </div>
                <div className="relative w-32 aspect-[2/3] bg-[#2B2B2B] rounded-lg overflow-hidden border border-[#3B3B3B] flex items-center justify-center">
                  {form.posterUrl ? (
                    <img src={form.posterUrl} alt="Poster preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  ) : (
                    <span className="text-text-muted text-xs">Preview 2:3</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Backdrop Phim (16:9)</label>
                <div className="flex gap-2 mb-3">
                  <input type="text" name="backdropUrl" value={form.backdropUrl} onChange={handleFormChange} placeholder="Nhập URL ảnh..." className="flex-1 px-4 py-2.5 bg-[#2B2B2B] text-white rounded-lg border border-[#2B2B2B] focus:ring-2 focus:ring-brand-red outline-none text-sm placeholder-text-muted" />
                  <label className="px-4 py-2 bg-brand-red/10 border border-brand-red/20 text-brand-red hover:bg-brand-red/20 text-sm font-semibold rounded-lg flex items-center justify-center cursor-pointer transition-colors whitespace-nowrap">
                    {isUploadingBackdrop ? 'Đang tải...' : 'Tải file'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'backdropUrl')} disabled={isUploadingBackdrop} />
                  </label>
                </div>
                <div className="relative w-full max-w-[200px] aspect-[16/9] bg-[#2B2B2B] rounded-lg overflow-hidden border border-[#3B3B3B] flex items-center justify-center">
                  {form.backdropUrl ? (
                    <img src={form.backdropUrl} alt="Backdrop preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  ) : (
                    <span className="text-text-muted text-xs text-center px-2">Ảnh nền trang chủ (16:9)</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Trailer URL (YouTube)</label>
                <input type="text" name="trailerUrl" value={form.trailerUrl} onChange={handleFormChange} placeholder="https://youtube.com/watch?v=..." className="w-full px-4 py-2.5 bg-[#2B2B2B] text-white rounded-lg border border-[#2B2B2B] focus:ring-2 focus:ring-brand-red outline-none text-sm placeholder-text-muted mb-3" />
                {form.trailerUrl && (form.trailerUrl.includes('youtube.com') || form.trailerUrl.includes('youtu.be')) && (
                  <div className="relative w-full max-w-[240px] aspect-video bg-black rounded-lg overflow-hidden border border-[#3B3B3B]">
                    <iframe src={`https://www.youtube.com/embed/${form.trailerUrl.split('v=')[1]?.split('&')[0] || form.trailerUrl.split('youtu.be/')[1]?.split('?')[0]}`} title="Trailer" className="w-full h-full" allowFullScreen></iframe>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#2B2B2B]">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSaving}
              className="px-5 py-2.5 border border-[#2B2B2B] rounded-lg text-white hover:bg-[#2B2B2B] transition-colors font-medium text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-brand-red to-[#B20710] hover:from-[#FF1E2A] hover:to-[#CC0812] text-white text-sm font-semibold shadow-lg shadow-brand-red/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving
                ? 'Đang lưu...'
                : editingMovie
                ? 'Cập nhật'
                : 'Thêm phim'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm Dialog ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget._id);
        }}
        title="Xóa phim"
        message={`Bạn có chắc chắn muốn xóa phim '${deleteTarget?.title}'? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
