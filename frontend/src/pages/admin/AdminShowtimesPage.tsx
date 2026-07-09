import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showtimesApi } from '../../api/showtimes';
import { cinemasApi } from '../../api/cinemas';
import { moviesApi } from '../../api/movies';
import { Plus, Search, RotateCcw, Ban, Edit } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { Showtime, Cinema, Movie, Room } from '../../types';

// ─── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Status helpers ────────────────────────────────────────────────────────────
const statusConfig: Record<Showtime['status'], { label: string; cls: string }> = {
  scheduled: {
    label: 'Scheduled',
    cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  },
  ongoing: {
    label: 'Ongoing',
    cls: 'bg-accent-teal/15 text-accent-teal border border-accent-teal/20',
  },
  finished: {
    label: 'Finished',
    cls: 'bg-text-muted/10 text-text-muted border border-text-muted/20',
  },
  cancelled: {
    label: 'Cancelled',
    cls: 'bg-brand-red/15 text-brand-red border border-brand-red/20',
  },
};

const formatVND = (n: number) => n.toLocaleString('vi-VN') + 'đ';

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('vi-VN'),
    time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  };
};

// ─── Component ─────────────────────────────────────────────────────────────────
export const AdminShowtimesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  // ── Filter / pagination state ──────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filterDate, setFilterDate] = useState('');
  const [filterCinema, setFilterCinema] = useState('');
  const [filterMovieTitle, setFilterMovieTitle] = useState('');
  const debouncedMovieTitle = useDebounce(filterMovieTitle, 500);

  // ── Modal / dialog state ───────────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Showtime | null>(null);

  // ── Create form state ──────────────────────────────────────────────────────
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [selectedCinemaForCreate, setSelectedCinemaForCreate] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);

  // ── Edit form state ────────────────────────────────────────────────────────
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Showtime | null>(null);
  const [editMovieId, setEditMovieId] = useState('');
  const [editCinemaId, setEditCinemaId] = useState('');
  const [editRoomId, setEditRoomId] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editBasePrice, setEditBasePrice] = useState<number>(0);

  // Reset page to 1 whenever filters change
  useEffect(() => { setPage(1); }, [filterDate, filterCinema, debouncedMovieTitle]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: showtimesData, isLoading } = useQuery({
    queryKey: ['adminShowtimes', page, limit, filterDate, filterCinema, debouncedMovieTitle],
    queryFn: () =>
      showtimesApi.getAll({
        page,
        limit,
        date: filterDate || undefined,
        cinemaId: filterCinema || undefined,
        movieTitle: debouncedMovieTitle || undefined,
      }),
  });

  const showtimes: Showtime[] = showtimesData?.data?.data?.showtimes || [];
  const pagination = showtimesData?.data?.data?.pagination;

  const { data: cinemasData } = useQuery({
    queryKey: ['cinemas'],
    queryFn: () => cinemasApi.getCinemas(),
  });
  const cinemas: Cinema[] = cinemasData?.data?.data || [];

  const { data: moviesData } = useQuery({
    queryKey: ['movies'],
    queryFn: () => moviesApi.getAll({ limit: 100 }),
  });
  const movies: Movie[] = moviesData?.data?.data?.movies || [];

  const { data: roomsData } = useQuery({
    queryKey: ['rooms', selectedCinemaForCreate],
    queryFn: () => cinemasApi.getRooms(selectedCinemaForCreate),
    enabled: !!selectedCinemaForCreate,
  });
  const rooms: Room[] = roomsData?.data?.data || [];

  const { data: editRoomsData } = useQuery({
    queryKey: ['rooms', editCinemaId],
    queryFn: () => cinemasApi.getRooms(editCinemaId),
    enabled: !!editCinemaId,
  });
  const editRooms: Room[] = editRoomsData?.data?.data || [];

  // Reset room when cinema changes in create form
  useEffect(() => { setSelectedRoomId(''); }, [selectedCinemaForCreate]);
  // Reset room when cinema changes in edit form
  useEffect(() => { if (editTarget && editCinemaId !== (typeof editTarget.room === 'string' ? '' : editTarget.room.cinema?._id || editTarget.room.cinema)) { setEditRoomId(''); } }, [editCinemaId, editTarget]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () =>
      showtimesApi.create({
        movieId: selectedMovieId,
        roomId: selectedRoomId,
        startTime,
        basePrice,
      }),
    onSuccess: () => {
      addToast('Tạo suất chiếu thành công!', 'success');
      queryClient.invalidateQueries({ queryKey: ['adminShowtimes'] });
      closeCreateModal();
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Lỗi khi tạo suất chiếu', 'error');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => showtimesApi.cancel(id),
    onSuccess: () => {
      addToast('Đã hủy suất chiếu thành công', 'success');
      queryClient.invalidateQueries({ queryKey: ['adminShowtimes'] });
      setCancelTarget(null);
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Lỗi khi hủy suất chiếu', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => showtimesApi.update(editTarget?._id!, data),
    onSuccess: () => {
      addToast('Cập nhật suất chiếu thành công!', 'success');
      queryClient.invalidateQueries({ queryKey: ['adminShowtimes'] });
      closeEditModal();
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Lỗi khi cập nhật suất chiếu', 'error');
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setSelectedMovieId('');
    setSelectedCinemaForCreate('');
    setSelectedRoomId('');
    setStartTime('');
    setBasePrice(0);
  };

  const openEditModal = (st: Showtime) => {
    setEditTarget(st);
    const movie = typeof st.movie === 'string' ? st.movie : st.movie._id;
    const cinema = st.room?.cinema?._id || (typeof st.room?.cinema === 'string' ? st.room.cinema : '');
    const room = st.room?._id;
    
    // convert ISO string to local datetime-local value (YYYY-MM-DDTHH:MM)
    const localDate = new Date(st.startTime);
    const tzOffset = localDate.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(localDate.getTime() - tzOffset)).toISOString().slice(0, 16);

    setEditMovieId(movie);
    setEditCinemaId(cinema);
    setEditRoomId(room);
    setEditStartTime(localISOTime);
    setEditBasePrice(st.basePrice);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditTarget(null);
    setEditMovieId('');
    setEditCinemaId('');
    setEditRoomId('');
    setEditStartTime('');
    setEditBasePrice(0);
  };

  const canSubmitCreate = selectedMovieId && selectedRoomId && startTime && basePrice > 0;
  const canSubmitEdit = editMovieId && editRoomId && editStartTime && editBasePrice > 0;

  const cancelTargetMovie = useMemo(() => {
    if (!cancelTarget) return null;
    const movie = typeof cancelTarget.movie === 'string' ? null : cancelTarget.movie;
    return movie;
  }, [cancelTarget]);

  const handleResetFilters = () => {
    setFilterDate('');
    setFilterCinema('');
    setFilterMovieTitle('');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full">
      {/* ─── Page Header & Actions ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Quản lý Suất chiếu</h2>
          <p className="text-sm text-text-muted mt-1">
            Manage and schedule movie screenings across all cinema locations.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-br from-brand-red to-[#B20710] text-white font-semibold px-6 py-3 rounded-lg hover:shadow-[0_0_15px_rgba(229,9,20,0.4)] transition-all duration-300 active:scale-95 flex-shrink-0"
        >
          <Plus size={18} />
          Thêm Suất chiếu
        </button>
      </div>

      {/* ─── Filters Bar ───────────────────────────────────────────────────── */}
      <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl p-4 flex flex-wrap items-center gap-4 mb-8">
        {/* Date filter */}
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 cursor-pointer"
          style={{ colorScheme: 'dark' }}
        />

        {/* Cinema filter */}
        <select
          value={filterCinema}
          onChange={(e) => setFilterCinema(e.target.value)}
          className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 min-w-[180px] cursor-pointer"
        >
          <option value="">Tất cả Rạp</option>
          {cinemas.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Movie title search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Tìm theo tên phim..."
            value={filterMovieTitle}
            onChange={(e) => setFilterMovieTitle(e.target.value)}
            className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none pl-9 pr-4 py-2 w-full"
          />
        </div>

        {/* Reset */}
        <button
          onClick={handleResetFilters}
          className="flex items-center gap-1.5 text-text-muted hover:text-white text-sm transition-colors ml-auto"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      {/* ─── Data Table ────────────────────────────────────────────────────── */}
      <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#201F1F] border-b border-[#2B2B2B]/50">
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-4 whitespace-nowrap">
                  Movie
                </th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-4 whitespace-nowrap">
                  Cinema / Room
                </th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-4 whitespace-nowrap">
                  Start Time
                </th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-4 whitespace-nowrap">
                  End Time
                </th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-4 whitespace-nowrap">
                  Format
                </th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-4 whitespace-nowrap text-right">
                  Price
                </th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-4 whitespace-nowrap text-center">
                  Status
                </th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-4 whitespace-nowrap text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2B2B]/30">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red mx-auto" />
                  </td>
                </tr>
              ) : showtimes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-text-muted">
                    Không tìm thấy suất chiếu nào.
                  </td>
                </tr>
              ) : (
                showtimes.map((st) => {
                  const movie = typeof st.movie === 'string' ? null : st.movie;
                  const start = formatDateTime(st.startTime);
                  const end = formatDateTime(st.endTime);
                  const status = statusConfig[st.status];
                  const showCancelBtn = st.status !== 'cancelled' && st.status !== 'finished';

                  return (
                    <tr
                      key={st._id}
                      className="hover:bg-[#2A2A2A]/50 transition-colors group even:bg-[#242424] odd:bg-[#1F1F1F]"
                    >
                      {/* Movie */}
                      <td className="px-6 py-3 min-w-[250px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 bg-dark-input rounded-md overflow-hidden flex-shrink-0">
                            {movie && (
                              <img
                                src={movie.posterUrl || 'https://via.placeholder.com/60x80'}
                                alt={movie.title}
                                className="w-[40px] h-[55px] object-cover rounded bg-dark-input"
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white line-clamp-1">
                              {movie?.title || 'Unknown'}
                            </p>
                            <p className="text-text-muted text-[12px] mt-0.5">
                              {movie?.duration ? `${movie.duration} min` : '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Cinema / Room */}
                      <td className="px-4 py-3">
                        <p className="text-white font-medium text-sm">
                          {st.room?.cinema?.name || 'Unknown'}
                        </p>
                        <p className="text-text-muted text-[12px] mt-0.5">
                          {st.room?.name || 'Unknown'}
                        </p>
                      </td>

                      {/* Start Time */}
                      <td className="px-4 py-3">
                        <p className="text-white text-sm">{start.date}</p>
                        <p className="text-text-muted text-[12px] mt-0.5 font-mono">{start.time}</p>
                      </td>

                      {/* End Time */}
                      <td className="px-4 py-3">
                        <p className="text-white text-sm">{end.date}</p>
                        <p className="text-text-muted text-[12px] mt-0.5 font-mono">{end.time}</p>
                      </td>

                      {/* Format */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-accent-teal/20 text-accent-teal border border-accent-teal/30">
                          {st.room?.type || '2D'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-right">
                        <p className="text-white font-mono font-medium text-sm">
                          {formatVND(st.basePrice)}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[12px] font-medium min-w-[80px] ${status.cls}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {showCancelBtn && (
                            <>
                              <button
                                onClick={() => openEditModal(st)}
                                className="p-1.5 text-text-muted hover:text-white transition-colors rounded-md hover:bg-[#353534]"
                                title="Sửa suất chiếu"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => setCancelTarget(st)}
                                className="p-1.5 text-text-muted hover:text-brand-red transition-colors rounded-md hover:bg-[#353534]"
                                title="Hủy suất chiếu"
                              >
                                <Ban size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            total={pagination.total}
            limit={limit}
          />
        )}
      </div>

      {/* ─── Create Showtime Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Thêm Suất chiếu mới"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmitCreate) createMutation.mutate();
          }}
          className="flex flex-col gap-5"
        >
          {/* Movie */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Phim</label>
            <select
              value={selectedMovieId}
              onChange={(e) => setSelectedMovieId(e.target.value)}
              className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full"
              required
            >
              <option value="">-- Chọn phim --</option>
              {movies.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title} ({m.duration} min)
                </option>
              ))}
            </select>
          </div>

          {/* Cinema */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Rạp</label>
            <select
              value={selectedCinemaForCreate}
              onChange={(e) => setSelectedCinemaForCreate(e.target.value)}
              className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full"
              required
            >
              <option value="">-- Chọn rạp --</option>
              {cinemas.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Room */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Phòng chiếu</label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full disabled:opacity-40"
              disabled={!selectedCinemaForCreate}
              required
            >
              <option value="">
                {selectedCinemaForCreate ? '-- Chọn phòng --' : '-- Chọn rạp trước --'}
              </option>
              {rooms.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Thời gian bắt đầu</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full"
              style={{ colorScheme: 'dark' }}
              required
            />
          </div>

          {/* Base Price */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Giá vé (VNĐ)</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={basePrice || ''}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              placeholder="VD: 75000"
              className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeCreateModal}
              className="flex-1 px-4 py-2.5 border border-[#2B2B2B] rounded-lg text-white hover:bg-[#2B2B2B] transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!canSubmitCreate || createMutation.isPending}
              className="flex-1 px-4 py-2.5 bg-gradient-to-br from-brand-red to-[#B20710] text-white rounded-lg font-medium transition-all hover:shadow-[0_0_15px_rgba(229,9,20,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Đang tạo...' : 'Tạo suất chiếu'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Edit Showtime Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Chỉnh sửa suất chiếu"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmitEdit) {
              updateMutation.mutate({
                movieId: editMovieId,
                roomId: editRoomId,
                startTime: editStartTime,
                basePrice: editBasePrice,
              });
            }
          }}
          className="flex flex-col gap-5"
        >
          {/* Movie */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Phim</label>
            <select
              value={editMovieId}
              onChange={(e) => setEditMovieId(e.target.value)}
              className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full"
              required
            >
              <option value="">-- Chọn phim --</option>
              {movies.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title} ({m.duration} min)
                </option>
              ))}
            </select>
          </div>

          {/* Cinema */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Rạp</label>
            <select
              value={editCinemaId}
              onChange={(e) => setEditCinemaId(e.target.value)}
              className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full"
              required
            >
              <option value="">-- Chọn rạp --</option>
              {cinemas.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Room */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Phòng chiếu</label>
            <select
              value={editRoomId}
              onChange={(e) => setEditRoomId(e.target.value)}
              className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full disabled:opacity-40"
              disabled={!editCinemaId}
              required
            >
              <option value="">
                {editCinemaId ? '-- Chọn phòng --' : '-- Chọn rạp trước --'}
              </option>
              {editRooms.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Thời gian bắt đầu</label>
            <input
              type="datetime-local"
              value={editStartTime}
              onChange={(e) => setEditStartTime(e.target.value)}
              className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full"
              style={{ colorScheme: 'dark' }}
              required
            />
          </div>

          {/* Base Price */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Giá vé (VNĐ)</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={editBasePrice || ''}
              onChange={(e) => setEditBasePrice(Number(e.target.value))}
              placeholder="VD: 75000"
              className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeEditModal}
              className="flex-1 px-4 py-2.5 border border-[#2B2B2B] rounded-lg text-white hover:bg-[#2B2B2B] transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!canSubmitEdit || updateMutation.isPending}
              className="flex-1 px-4 py-2.5 bg-gradient-to-br from-brand-red to-[#B20710] text-white rounded-lg font-medium transition-all hover:shadow-[0_0_15px_rgba(229,9,20,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Cancel Confirmation Dialog ────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) cancelMutation.mutate(cancelTarget._id);
        }}
        title="Hủy suất chiếu"
        message={
          cancelTarget
            ? `Bạn có chắc muốn hủy suất chiếu "${cancelTargetMovie?.title || 'Unknown'}" lúc ${formatDateTime(cancelTarget.startTime).time} ngày ${formatDateTime(cancelTarget.startTime).date}?`
            : ''
        }
        confirmText="Xác nhận hủy"
        variant="warning"
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
};
