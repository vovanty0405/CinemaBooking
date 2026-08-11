import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { User, Key } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/auth';
import { Modal } from '../../components/ui/Modal';
import { useToastStore } from '../../stores/toastStore';

export const AdminProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  // Mật khẩu State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');

  // Mutations cho Đổi mật khẩu
  const requestOtpMutation = useMutation({
    mutationFn: () => authApi.requestChangePasswordOtp({ oldPassword }),
    onSuccess: () => {
      addToast('Mã OTP đã được gửi đến email của bạn', 'success');
      setShowOtpModal(true);
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu', 'error');
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: () => authApi.changePassword({ otp, newPassword }),
    onSuccess: () => {
      addToast('Cập nhật mật khẩu thành công!', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
      setShowOtpModal(false);
      setActiveTab('info');
    },
    onError: (err: any) => addToast(err.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu!', 'error')
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; phone?: string }) => authApi.updateProfile(data),
    onSuccess: (res) => {
      const updatedData = res.data.data;
      updateUser({ ...user!, name: updatedData.name, phone: updatedData.phone });
      addToast('Cập nhật thông tin thành công!', 'success');
    },
    onError: () => addToast('Có lỗi xảy ra khi cập nhật thông tin!', 'error')
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      addToast('Vui lòng nhập mật khẩu cũ!', 'warning');
      return;
    }
    if (!newPassword || newPassword !== confirmPassword) {
      addToast('Mật khẩu mới không khớp hoặc bị trống!', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Mật khẩu mới phải dài hơn 6 ký tự!', 'warning');
      return;
    }
    requestOtpMutation.mutate();
  };

  const handleConfirmOtp = () => {
    if (!otp || otp.length !== 6) {
      addToast('Vui lòng nhập đúng 6 số OTP', 'warning');
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
    <div className="space-y-6 max-w-5xl">
      <h2 className="text-2xl font-bold text-white mb-6">Trang cá nhân</h2>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4">
          <div className="bg-dark-surface border border-dark-input rounded-xl p-4 sticky top-24 shadow-lg">
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full border-2 border-dark-input flex items-center justify-center bg-dark-bg overflow-hidden shadow-inner mb-4">
                <span className="text-brand-red font-bold text-3xl">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <h3 className="text-white font-bold text-lg text-center">{user?.name}</h3>
              <p className="text-text-muted text-sm">{user?.email}</p>
            </div>
            
            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('info')}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-sm font-medium w-full ${activeTab === 'info' ? 'bg-brand-red text-white shadow-md' : 'text-text-muted hover:bg-dark-surface hover:text-white'}`}
              >
                <User size={18} /> Thông tin cá nhân
              </button>
              <button 
                onClick={() => setActiveTab('password')}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-sm font-medium w-full ${activeTab === 'password' ? 'bg-brand-red text-white shadow-md' : 'text-text-muted hover:bg-dark-surface hover:text-white'}`}
              >
                <Key size={18} /> Đổi mật khẩu
              </button>
            </div>
          </div>
        </div>
        
        <div className="md:w-3/4">
          {activeTab === 'info' && (
            <div className="bg-dark-surface border border-dark-input rounded-xl p-6 md:p-8 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-6">Thông tin cá nhân</h3>
              <form className="space-y-4 max-w-md" onSubmit={handleUpdateProfile}>
                <Input 
                  label="Họ và Tên" 
                  value={profileName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileName(e.target.value)}
                  required
                />
                <Input 
                  label="Email" 
                  value={user?.email} 
                  disabled 
                  readOnly 
                  className="opacity-60"
                />
                <Input 
                  label="Số điện thoại" 
                  value={profilePhone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfilePhone(e.target.value)}
                  placeholder="Nhập số điện thoại của bạn"
                />
                <Button 
                  className="mt-4 w-full" 
                  loading={updateProfileMutation.isPending}
                  disabled={updateProfileMutation.isPending}
                >
                  Cập nhật thông tin
                </Button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="bg-dark-surface border border-dark-input rounded-xl p-6 md:p-8 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-6">Đổi mật khẩu</h3>
              <form className="space-y-4 max-w-md" onSubmit={handleChangePassword}>
                <Input 
                  type="password" 
                  label="Mật khẩu cũ" 
                  value={oldPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOldPassword(e.target.value)}
                  required
                />
                <Input 
                  type="password" 
                  label="Mật khẩu mới" 
                  value={newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                  required
                />
                <Input 
                  type="password" 
                  label="Xác nhận mật khẩu mới" 
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button 
                  className="mt-4 w-full" 
                  loading={requestOtpMutation.isPending}
                  disabled={requestOtpMutation.isPending}
                >
                  Đổi mật khẩu
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* OTP Verification Modal */}
      <Modal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        title="Xác thực thay đổi mật khẩu"
        size="sm"
      >
        <div className="mt-4 space-y-4">
          <p className="text-sm text-text-muted">Mã OTP gồm 6 chữ số đã được gửi đến email của bạn. Vui lòng kiểm tra và nhập vào bên dưới để xác nhận.</p>
          <Input 
            type="text" 
            placeholder="Nhập mã OTP (6 số)" 
            value={otp}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
            maxLength={6}
          />
          <div className="flex gap-3 justify-end mt-6">
            <Button variant="ghost" onClick={() => setShowOtpModal(false)}>Hủy</Button>
            <Button onClick={handleConfirmOtp} loading={changePasswordMutation.isPending} disabled={changePasswordMutation.isPending}>Xác nhận OTP</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
