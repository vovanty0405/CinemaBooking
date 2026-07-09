import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cinemasApi } from '../../api/cinemas';
import { Plus, Edit, Trash } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { Room, Cinema } from '../../types';

interface RoomFormData {
  name: string;
  type: 'standard' | 'imax' | '4dx';
  rows: number;
  seatsPerRow: number;
}

const initialFormData: RoomFormData = { name: '', type: 'standard', rows: 5, seatsPerRow: 10 };

export const AdminRoomsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  // ── State ──
  const [selectedCinema, setSelectedCinema] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomFormData>(initialFormData);

  // ── Queries ──
  const { data: cinemasData } = useQuery({
    queryKey: ['adminCinemas'],
    queryFn: cinemasApi.getCinemas,
  });

  const cinemas = cinemasData?.data?.data || [];

  // Auto-select first cinema
  useEffect(() => {
    if (cinemas.length > 0 && !selectedCinema) {
      setSelectedCinema(cinemas[0]._id);
    }
  }, [cinemas, selectedCinema]);

  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['adminRooms', selectedCinema],
    queryFn: () => cinemasApi.getRooms(selectedCinema),
    enabled: !!selectedCinema,
  });

  const rooms = roomsData?.data?.data || [];

  // ── Pre-fill form when editing ──
  useEffect(() => {
    if (editingRoom) {
      setFormData({
        name: editingRoom.name,
        type: editingRoom.type,
        rows: editingRoom.rows || 5,
        seatsPerRow: editingRoom.seatsPerRow || 10,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editingRoom]);

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data: RoomFormData) =>
      cinemasApi.createRoom(selectedCinema, {
        name: data.name,
        type: data.type,
        rows: data.rows,
        seatsPerRow: data.seatsPerRow,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRooms'] });
      addToast('Thêm phòng mới thành công!', 'success');
      closeModal();
    },
    onError: () => {
      addToast('Thêm phòng thất bại. Vui lòng thử lại.', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; type: string }) =>
      cinemasApi.updateRoom(editingRoom!._id, { name: data.name, type: data.type as Room['type'] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRooms'] });
      addToast('Cập nhật phòng thành công!', 'success');
      closeModal();
    },
    onError: () => {
      addToast('Cập nhật phòng thất bại. Vui lòng thử lại.', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cinemasApi.deleteRoom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRooms'] });
      addToast('Xóa phòng thành công!', 'success');
      setDeleteTarget(null);
    },
    onError: () => {
      addToast('Xóa phòng thất bại. Vui lòng thử lại.', 'error');
    },
  });

  // ── Handlers ──
  const openCreateModal = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoom) {
      updateMutation.mutate({ name: formData.name, type: formData.type });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const typeLabels: Record<string, string> = {
    standard: 'Standard',
    imax: 'IMAX',
    '4dx': '4DX',
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Quản lý Phòng Chiếu</h2>
          <p className="text-sm text-text-muted mt-1">Quản lý phòng chiếu và cấu hình ghế ngồi.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-br from-brand-red to-[#B20710] text-white font-semibold px-6 py-3 rounded-lg hover:shadow-[0_0_15px_rgba(229,9,20,0.4)] transition-all duration-300 active:scale-95 flex-shrink-0 disabled:opacity-50"
          disabled={!selectedCinema}
        >
          <Plus size={18} />
          Thêm Phòng Mới
        </button>
      </div>

      {/* Cinema filter */}
      <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl p-4 flex flex-wrap items-center gap-4 mb-8">
        <label className="text-sm font-semibold text-text-muted">Chọn rạp chiếu:</label>
        <select
          value={selectedCinema}
          onChange={(e) => setSelectedCinema(e.target.value)}
          className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 min-w-[200px]"
        >
          {cinemas.map((cinema: Cinema) => (
            <option key={cinema._id} value={cinema._id}>{cinema.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#201F1F] border-b border-[#2B2B2B]/50">
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-4 whitespace-nowrap">Tên Phòng</th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-4 whitespace-nowrap">Loại</th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-4 whitespace-nowrap">Số hàng</th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-4 whitespace-nowrap">Ghế/Hàng</th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2B2B]/30">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red mx-auto"></div>
                  </td>
                </tr>
              ) : !selectedCinema ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-text-muted">
                    Vui lòng chọn rạp chiếu để xem phòng.
                  </td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-text-muted">
                    Rạp này chưa có phòng chiếu nào.
                  </td>
                </tr>
              ) : (
                rooms.map((room: Room) => (
                  <tr key={room._id} className="hover:bg-[#2A2A2A]/50 transition-colors group even:bg-[#242424] odd:bg-[#1F1F1F]">
                    <td className="px-6 py-4 font-medium text-white">
                      {room.name}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-accent-teal/20 text-accent-teal border border-accent-teal/30">
                        {typeLabels[room.type] || room.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-text-muted">
                      {room.rows != null ? room.rows : '—'}
                    </td>
                    <td className="px-4 py-4 text-sm text-text-muted">
                      {room.seatsPerRow != null ? room.seatsPerRow : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(room)} className="p-1.5 text-text-muted hover:text-white transition-colors rounded-md hover:bg-[#353534]" title="Edit">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => setDeleteTarget(room)} className="p-1.5 text-text-muted hover:text-brand-red transition-colors rounded-md hover:bg-[#353534]" title="Delete">
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingRoom ? 'Chỉnh sửa Phòng' : 'Thêm Phòng Mới'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-text-muted mb-1 block">Tên phòng *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Phòng 1, Hall A"
              className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-muted mb-1 block">Loại phòng *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as RoomFormData['type'] })}
              className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full"
            >
              <option value="standard">Standard</option>
              <option value="imax">IMAX</option>
              <option value="4dx">4DX</option>
            </select>
          </div>

          {/* Only show rows & seatsPerRow when creating a new room */}
          {!editingRoom && (
            <>
              <div>
                <label className="text-sm font-medium text-text-muted mb-1 block">Số hàng ghế *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.rows}
                  onChange={(e) => setFormData({ ...formData, rows: parseInt(e.target.value) || 1 })}
                  placeholder="VD: 8"
                  className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-muted mb-1 block">Số ghế mỗi hàng *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.seatsPerRow}
                  onChange={(e) => setFormData({ ...formData, seatsPerRow: parseInt(e.target.value) || 1 })}
                  placeholder="VD: 12"
                  className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={isMutating}
              className="px-5 py-2.5 border border-[#2B2B2B] rounded-lg text-white hover:bg-[#2B2B2B] transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isMutating}
              className="px-5 py-2.5 bg-gradient-to-br from-brand-red to-[#B20710] text-white rounded-lg font-medium transition-all hover:shadow-[0_0_15px_rgba(229,9,20,0.4)] disabled:opacity-50"
            >
              {isMutating ? 'Đang xử lý...' : editingRoom ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        title="Xóa Phòng Chiếu"
        message={`Bạn có chắc chắn muốn xóa phòng '${deleteTarget?.name}'? Tất cả ghế trong phòng sẽ bị vô hiệu hóa.`}
        confirmText="Xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
