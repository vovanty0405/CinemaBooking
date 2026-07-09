import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cinemasApi } from '../../api/cinemas';
import { Plus, Edit, Trash, MapPin, Phone } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { Cinema } from '../../types';

interface CinemaFormData {
  name: string;
  address: string;
  city: string;
  phone: string;
}

const initialFormData: CinemaFormData = { name: '', address: '', city: '', phone: '' };

export const AdminCinemasPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  // ── State ──
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCinema, setEditingCinema] = useState<Cinema | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cinema | null>(null);
  const [formData, setFormData] = useState<CinemaFormData>(initialFormData);

  // ── Query ──
  const { data, isLoading } = useQuery({
    queryKey: ['adminCinemas'],
    queryFn: cinemasApi.getCinemas,
  });

  const cinemas = data?.data?.data || [];

  const filteredCinemas = cinemas.filter((c: Cinema) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Pre-fill form when editing ──
  useEffect(() => {
    if (editingCinema) {
      setFormData({
        name: editingCinema.name,
        address: editingCinema.address,
        city: editingCinema.city,
        phone: editingCinema.phone || '',
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editingCinema]);

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data: CinemaFormData) => cinemasApi.createCinema(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCinemas'] });
      addToast('Thêm rạp mới thành công!', 'success');
      closeModal();
    },
    onError: () => {
      addToast('Thêm rạp thất bại. Vui lòng thử lại.', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CinemaFormData) =>
      cinemasApi.updateCinema(editingCinema!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCinemas'] });
      addToast('Cập nhật rạp thành công!', 'success');
      closeModal();
    },
    onError: () => {
      addToast('Cập nhật rạp thất bại. Vui lòng thử lại.', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cinemasApi.deleteCinema(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCinemas'] });
      addToast('Xóa rạp thành công!', 'success');
      setDeleteTarget(null);
    },
    onError: () => {
      addToast('Xóa rạp thất bại. Vui lòng thử lại.', 'error');
    },
  });

  // ── Handlers ──
  const openCreateModal = () => {
    setEditingCinema(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cinema: Cinema) => {
    setEditingCinema(cinema);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCinema(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCinema) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Quản lý Rạp Chiếu</h2>
          <p className="text-sm text-text-muted mt-1">Quản lý thông tin các rạp chiếu phim trong hệ thống.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-br from-brand-red to-[#B20710] text-white font-semibold px-6 py-3 rounded-lg hover:shadow-[0_0_15px_rgba(229,9,20,0.4)] transition-all duration-300 active:scale-95 flex-shrink-0"
        >
          <Plus size={18} />
          Thêm Rạp Mới
        </button>
      </div>

      {/* Search bar */}
      <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl p-4 flex flex-wrap items-center gap-4 mb-8">
        <input
          type="text"
          placeholder="Tìm theo tên rạp, thành phố, địa chỉ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full md:w-80"
        />
      </div>

      {/* Table */}
      <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#201F1F] border-b border-[#2B2B2B]/50">
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-4 whitespace-nowrap">Tên Rạp</th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-4 whitespace-nowrap">Thành Phố</th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-4 whitespace-nowrap">Địa Chỉ</th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-4 whitespace-nowrap">SĐT</th>
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
              ) : filteredCinemas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-text-muted">
                    Không tìm thấy rạp nào.
                  </td>
                </tr>
              ) : (
                filteredCinemas.map((cinema: Cinema) => (
                  <tr key={cinema._id} className="hover:bg-[#2A2A2A]/50 transition-colors group even:bg-[#242424] odd:bg-[#1F1F1F]">
                    <td className="px-6 py-4 font-medium text-white">
                      {cinema.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-text-muted">
                      {cinema.city}
                    </td>
                    <td className="px-4 py-4 text-sm text-text-muted">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-brand-red flex-shrink-0" />
                        {cinema.address}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-text-muted">
                      {cinema.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone size={14} className="text-text-muted flex-shrink-0" />
                          {cinema.phone}
                        </div>
                      ) : (
                        <span className="text-text-muted/50">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(cinema)} className="p-1.5 text-text-muted hover:text-white transition-colors rounded-md hover:bg-[#353534]" title="Edit">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => setDeleteTarget(cinema)} className="p-1.5 text-text-muted hover:text-brand-red transition-colors rounded-md hover:bg-[#353534]" title="Delete">
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
        title={editingCinema ? 'Chỉnh sửa Rạp' : 'Thêm Rạp Mới'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-text-muted mb-1 block">Tên rạp *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: CGV Vincom Đồng Khởi"
              className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-muted mb-1 block">Địa chỉ *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="VD: 72 Lê Thánh Tôn, Quận 1"
              className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-muted mb-1 block">Thành phố *</label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="VD: Hồ Chí Minh"
              className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-muted mb-1 block">Số điện thoại</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="VD: 028 1234 5678"
              className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2 w-full"
            />
          </div>

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
              {isMutating ? 'Đang xử lý...' : editingCinema ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        title="Xóa Rạp Chiếu"
        message={`Bạn có chắc chắn muốn xóa rạp "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
