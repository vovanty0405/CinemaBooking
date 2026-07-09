import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/users';
import { Search, ShieldCheck, ShieldOff, Lock, Unlock, Mail } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Pagination } from '../../components/ui/Pagination';
import type { User } from '../../types';

export const AdminAccountsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [roleTarget, setRoleTarget] = useState<{ user: User; newRole: string } | null>(null);
  const [statusTarget, setStatusTarget] = useState<User | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users
  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', page, limit, debouncedSearch, filterRole, filterStatus],
    queryFn: () => usersApi.getAll({
      page,
      limit,
      search: debouncedSearch || undefined,
      role: filterRole || undefined,
      isActive: filterStatus === '' ? undefined : filterStatus === 'active',
    }),
  });

  const users: User[] = data?.data?.data?.users || [];
  const pagination = data?.data?.data?.pagination;

  // Mutations
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => usersApi.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      addToast('Đã cập nhật vai trò thành công', 'success');
      setRoleTarget(null);
    },
    onError: () => addToast('Lỗi khi cập nhật vai trò', 'error'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => usersApi.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      addToast('Đã cập nhật trạng thái tài khoản', 'success');
      setStatusTarget(null);
    },
    onError: () => addToast('Lỗi khi cập nhật trạng thái', 'error'),
  });

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Quản lý Tài khoản</h2>
          <p className="text-sm text-text-muted mt-1">Quản lý người dùng, phân quyền và theo dõi hoạt động.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl p-4 flex flex-wrap items-center gap-4 mb-8">
        <div className="relative flex-1 md:max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none pl-10 pr-4 py-2"
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
          className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2"
        >
          <option value="">Tất cả Vai trò</option>
          <option value="user">Khách hàng</option>
          <option value="admin">Quản trị viên</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2"
        >
          <option value="">Tất cả Trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="locked">Bị khóa</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#201F1F] border-b border-[#2B2B2B]/50">
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-4 whitespace-nowrap">Người dùng</th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-4 whitespace-nowrap">Email</th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-4 whitespace-nowrap">Vai trò</th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-4 whitespace-nowrap">Trạng thái</th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-4 whitespace-nowrap">Ngày tạo</th>
                <th className="text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2B2B]/30">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red mx-auto"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-muted">
                    Không tìm thấy tài khoản nào.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-[#2A2A2A]/50 transition-colors group even:bg-[#242424] odd:bg-[#1F1F1F]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#2B2B2B] flex items-center justify-center text-white font-bold text-lg border border-[#353534]">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{user.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-text-muted">
                      <span className="flex items-center gap-2">
                        <Mail size={14} className="text-brand-red/80 shrink-0" />
                        {user.email}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        user.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-[#353534] text-text-muted border border-[#2B2B2B]'
                      }`}>
                        {user.role === 'admin' ? <ShieldCheck size={12} /> : null}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${
                        user.isActive ? 'text-accent-teal' : 'text-brand-red'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-accent-teal' : 'bg-brand-red'}`}></div>
                        {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-text-muted">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Toggle Role */}
                        <button
                          onClick={() => setRoleTarget({
                            user,
                            newRole: user.role === 'admin' ? 'user' : 'admin'
                          })}
                          className="p-1.5 text-text-muted hover:text-purple-400 transition-colors rounded-md hover:bg-[#353534]"
                          title={user.role === 'admin' ? 'Hạ xuống User' : 'Nâng lên Admin'}
                        >
                          {user.role === 'admin' ? <ShieldOff size={18} /> : <ShieldCheck size={18} />}
                        </button>
                        {/* Toggle Status */}
                        <button
                          onClick={() => setStatusTarget(user)}
                          className={`p-1.5 transition-colors rounded-md hover:bg-[#353534] ${
                            user.isActive ? 'text-text-muted hover:text-brand-red' : 'text-text-muted hover:text-accent-teal'
                          }`}
                          title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {user.isActive ? <Lock size={18} /> : <Unlock size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* Role Change Confirm */}
      <ConfirmDialog
        isOpen={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        onConfirm={() => {
          if (roleTarget) {
            updateRoleMutation.mutate({ id: roleTarget.user._id, role: roleTarget.newRole });
          }
        }}
        title="Thay đổi vai trò"
        message={roleTarget
          ? `Bạn có chắc muốn ${roleTarget.newRole === 'admin' ? 'nâng' : 'hạ'} quyền của "${roleTarget.user.name}" thành ${roleTarget.newRole === 'admin' ? 'Quản trị viên' : 'Khách hàng'}?`
          : ''
        }
        confirmText="Xác nhận"
        variant="warning"
        isLoading={updateRoleMutation.isPending}
      />

      {/* Status Toggle Confirm */}
      <ConfirmDialog
        isOpen={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={() => {
          if (statusTarget) {
            toggleStatusMutation.mutate(statusTarget._id);
          }
        }}
        title={statusTarget?.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
        message={statusTarget
          ? statusTarget.isActive
            ? `Bạn có chắc muốn khóa tài khoản "${statusTarget.name}"? Người dùng sẽ không thể đăng nhập.`
            : `Bạn có chắc muốn mở khóa tài khoản "${statusTarget.name}"?`
          : ''
        }
        confirmText={statusTarget?.isActive ? 'Khóa' : 'Mở khóa'}
        variant={statusTarget?.isActive ? 'danger' : 'warning'}
        isLoading={toggleStatusMutation.isPending}
      />
    </div>
  );
};
