import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, Ticket, Key, CheckCircle, XCircle, QrCode, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation } from '@tanstack/react-query';
import { bookingsApi } from '../api/bookings';
import { authApi } from '../api/auth';
import { paymentsApi } from '../api/payments';
import { Modal } from '../components/ui/Modal';
import { ETicket } from '../components/features/ETicket';
import { useToastStore } from '../stores/toastStore';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'password'>('info');
  
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');

  React.useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
    }
  }, [user]);
  
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Mật khẩu State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Queries
  const { data: historyRes, isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingsApi.getMyBookings(),
    enabled: activeTab === 'history'
  });
  
  const history = Array.isArray(historyRes?.data?.data) 
    ? historyRes?.data?.data 
    : (historyRes?.data?.data?.bookings || historyRes?.data?.data?.items || []);

  // Mutations cho Đổi mật khẩu
  const changePasswordMutation = useMutation({
    mutationFn: () => authApi.changePassword({ newPassword }),
    onSuccess: () => {
      addToast('Cập nhật mật khẩu thành công!', 'success');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('info');
    },
    onError: () => addToast('Có lỗi xảy ra khi đổi mật khẩu!', 'error')
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; phone?: string }) => authApi.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data.data);
      addToast('Cập nhật thông tin thành công!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin!', 'error');
    }
  });

  const paymentMutation = useMutation({
    mutationFn: (bookingId: string) => paymentsApi.createVNPay(bookingId),
    onSuccess: (res) => {
      const paymentUrl = res.data?.data?.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        addToast('Không lấy được URL thanh toán VNPay', 'error');
      }
    },
    onError: () => addToast('Có lỗi xảy ra khi tạo link thanh toán VNPay', 'error'),
  });

  const handleContinuePayment = (bookingId: string) => {
    paymentMutation.mutate(bookingId);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      addToast('Mật khẩu không khớp hoặc bị trống!', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Mật khẩu phải dài hơn 6 ký tự!', 'warning');
      return;
    }
    changePasswordMutation.mutate();
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      addToast('Tên không được để trống!', 'warning');
      return;
    }
    updateProfileMutation.mutate({ name: profileName, phone: profilePhone });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-white mb-8">Tài khoản của tôi</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-dark-surface border border-dark-input rounded-xl p-6 mb-4 flex flex-col items-center shadow-lg">
            <div className="w-20 h-20 bg-accent-teal/20 text-accent-teal rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-inner">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-bold text-white text-center">{user?.name}</h2>
            <p className="text-sm text-text-secondary text-center">{user?.email}</p>
          </div>
          
          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-sm font-medium ${activeTab === 'info' ? 'bg-brand-red text-white shadow-md' : 'text-text-muted hover:bg-dark-surface hover:text-white'}`}
            >
              <User size={18} /> Thông tin cá nhân
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-sm font-medium ${activeTab === 'history' ? 'bg-brand-red text-white shadow-md' : 'text-text-muted hover:bg-dark-surface hover:text-white'}`}
            >
              <Ticket size={18} /> Lịch sử đặt vé
            </button>
            <button 
              onClick={() => setActiveTab('password')}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-sm font-medium ${activeTab === 'password' ? 'bg-brand-red text-white shadow-md' : 'text-text-muted hover:bg-dark-surface hover:text-white'}`}
            >
              <Key size={18} /> Đổi mật khẩu
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'info' && (
            <div className="bg-dark-surface border border-dark-input rounded-xl p-6 md:p-8 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-6">Thông tin cá nhân</h3>
              <form className="space-y-4 max-w-md" onSubmit={handleUpdateProfile}>
                <Input 
                  label="Họ và tên" 
                  value={profileName} 
                  onChange={(e) => setProfileName(e.target.value)} 
                  required 
                />
                <Input 
                  label="Email" 
                  defaultValue={user?.email} 
                  disabled 
                  className="opacity-70 cursor-not-allowed" 
                />
                <Input 
                  label="Số điện thoại" 
                  value={profilePhone} 
                  onChange={(e) => setProfilePhone(e.target.value)} 
                />
                <Button 
                  type="submit" 
                  className="mt-4"
                  loading={updateProfileMutation.isPending}
                  disabled={updateProfileMutation.isPending}
                >
                  Lưu thay đổi
                </Button>
              </form>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-dark-surface border border-dark-input rounded-xl p-6 md:p-8 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-6">Lịch sử đặt vé</h3>
              {isLoading ? (
                <div className="text-center py-8 text-text-muted">Đang tải lịch sử...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-text-muted border border-dashed border-dark-input rounded-lg">Bạn chưa có lịch sử đặt vé nào.</div>
              ) : (
                <div className="space-y-4">
                  {history.map((item: any) => (
                    <div key={item._id || item.id} className="flex flex-col sm:flex-row gap-4 p-4 border border-dark-input rounded-lg bg-dark-bg transition-colors hover:border-brand-red/30">
                      {item.showtime?.movie?.posterUrl && (
                        <img src={item.showtime.movie.posterUrl} alt="Poster" className="w-16 h-24 object-cover rounded shadow-md" />
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-white text-lg">{item.showtime?.movie?.title || 'Phim không xác định'}</h4>
                          <p className="text-sm text-text-secondary">{item.showtime?.startTime ? format(new Date(item.showtime.startTime), 'HH:mm - dd/MM/yyyy') : 'N/A'}</p>
                          <p className="text-sm text-text-secondary mt-1">Ghế: <span className="text-white font-medium">{item.seats?.map((s: any) => `${s.row}${s.number}`).join(', ')}</span></p>
                        </div>
                      </div>
                      <div className="flex flex-col justify-between items-start sm:items-end mt-2 sm:mt-0">
                        {item.status === 'confirmed' && <span className="flex items-center gap-1 text-xs font-bold bg-accent-teal/10 text-accent-teal px-2 py-1 rounded"><CheckCircle size={14}/> Thành công</span>}
                        {item.status === 'pending' && <span className="flex items-center gap-1 text-xs font-bold bg-accent-orange/10 text-accent-orange px-2 py-1 rounded">Chờ thanh toán</span>}
                        {item.status === 'cancelled' && <span className="flex items-center gap-1 text-xs font-bold bg-brand-red/10 text-brand-red px-2 py-1 rounded"><XCircle size={14}/> Đã hủy</span>}
                        
                        <div className="flex flex-col items-end gap-2 mt-2">
                          <p className="font-bold text-brand-red">{item.totalAmount?.toLocaleString('vi-VN')} đ</p>
                          {item.status === 'confirmed' && (
                            <Button size="sm" variant="secondary" className="text-xs flex items-center gap-1" onClick={() => setSelectedBooking(item)}>
                              <QrCode size={14} /> Xem vé
                            </Button>
                          )}
                          {item.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="primary" 
                              className="text-xs flex items-center gap-1" 
                              onClick={() => handleContinuePayment(item._id)}
                              loading={paymentMutation.isPending}
                            >
                              <CreditCard size={14} /> Tiếp tục thanh toán
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'password' && (
            <div className="bg-dark-surface border border-dark-input rounded-xl p-6 md:p-8 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-6">Đổi mật khẩu</h3>
              
              <form className="space-y-4 max-w-md" onSubmit={handleChangePassword}>
                <Input 
                  type="password" 
                  label="Mật khẩu mới" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Input 
                  type="password" 
                  label="Xác nhận mật khẩu mới" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button 
                  className="mt-4 w-full" 
                  loading={changePasswordMutation.isPending}
                  disabled={changePasswordMutation.isPending}
                >
                  Cập nhật mật khẩu
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
      
      {/* Ticket Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Vé của bạn"
        size="sm"
      >
        {selectedBooking && (
          <div className="mt-4">
            {/* ETicket component expects a specific booking structure */}
            <ETicket booking={{
              _id: selectedBooking._id,
              user: selectedBooking.user,
              showtime: {
                _id: selectedBooking.showtime._id,
                movie: {
                  ...selectedBooking.showtime.movie,
                  duration: selectedBooking.showtime.movie.duration || 120,
                  genre: selectedBooking.showtime.movie.genre || ['N/A']
                } as any,
                cinema: (selectedBooking.showtime as any).cinema || { _id: '1', name: 'CineBooking', location: 'Cinema' },
                room: selectedBooking.showtime.room,
                startTime: selectedBooking.showtime.startTime,
                endTime: selectedBooking.showtime.endTime || selectedBooking.showtime.startTime,
                basePrice: 100000,
                status: 'scheduled'
              } as any,
              seats: selectedBooking.seats.map((s: any) => ({
                seat: s._id,
                row: s.row,
                number: s.number,
                type: s.type,
                price: s.price
              })),
              totalAmount: selectedBooking.totalAmount || 0,
              status: selectedBooking.status,
              createdAt: selectedBooking.createdAt
            } as any} />
          </div>
        )}
      </Modal>
    </div>
  );
};
