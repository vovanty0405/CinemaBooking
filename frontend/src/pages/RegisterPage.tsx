import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, Lock, Eye, EyeOff, Film, User, Phone } from 'lucide-react';

import { authApi } from '../api/auth';
import { useToastStore } from '../stores/toastStore';

export const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      addToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.register({ name, email, password, phone });
      addToast('Tạo tài khoản thành công! Vui lòng đăng nhập.', 'success');
      navigate('/login');
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Lỗi đăng ký tài khoản', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center relative overflow-hidden px-4 py-12">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1920)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-dark-bg/30" />
      
      <div className="w-full max-w-md relative z-10 bg-dark-surface p-8 rounded-xl shadow-2xl border border-dark-input animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 text-brand-red mb-2">
            <Film size={32} />
            <span className="text-2xl font-bold tracking-tight text-white">CineBook</span>
          </Link>
          <h2 className="text-xl text-text-secondary">Tạo tài khoản mới</h2>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input 
            name="name"
            type="text"
            placeholder="Họ và tên"
            leftIcon={<User size={18} />}
            required
          />
          <Input 
            name="email"
            type="email"
            placeholder="Email"
            leftIcon={<Mail size={18} />}
            required
          />
          <Input 
            name="phone"
            type="tel"
            placeholder="Số điện thoại"
            leftIcon={<Phone size={18} />}
            required
          />
          <Input 
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mật khẩu"
            leftIcon={<Lock size={18} />}
            rightIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-white focus:outline-none">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            required
          />
          <Input 
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Xác nhận mật khẩu"
            leftIcon={<Lock size={18} />}
            required
          />

          <div className="flex items-start gap-2 text-sm text-text-muted mt-2">
            <input type="checkbox" id="terms" className="mt-1 accent-brand-red cursor-pointer" required />
            <label htmlFor="terms" className="cursor-pointer">
              Tôi đồng ý với các <a href="#" className="text-white hover:text-brand-red transition-colors">Điều khoản dịch vụ</a> và <a href="#" className="text-white hover:text-brand-red transition-colors">Chính sách bảo mật</a>.
            </label>
          </div>

          <Button type="submit" className="w-full py-3 mt-4" loading={isLoading}>
            Tạo tài khoản
          </Button>

          <p className="text-center text-sm text-text-secondary mt-6 pt-4 border-t border-dark-input">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-white hover:text-brand-red font-medium transition-colors">
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
