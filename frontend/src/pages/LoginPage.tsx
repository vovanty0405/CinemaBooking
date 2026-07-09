import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, Lock, Eye, EyeOff, Film } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToastStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setIsLoading(true);
    try {
      await useAuthStore.getState().login({ email, password });
      addToast('Đăng nhập thành công', 'success');
      const from = location.state?.from?.pathname || location.state?.from || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center relative overflow-hidden px-4">
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
          <h2 className="text-xl text-text-secondary">Đăng nhập vào tài khoản</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input 
            type="email"
            placeholder="Email của bạn"
            leftIcon={<Mail size={18} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input 
            type={showPassword ? 'text' : 'password'}
            placeholder="Mật khẩu"
            leftIcon={<Lock size={18} />}
            rightIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-white focus:outline-none">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-sm text-accent-orange text-center">{error}</p>}

          <div className="flex justify-end">
            <Link to="#" className="text-sm text-text-muted hover:text-white transition-colors">Quên mật khẩu?</Link>
          </div>

          <Button type="submit" className="w-full py-3" loading={isLoading}>
            Đăng nhập
          </Button>

          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-dark-input flex-1" />
            <span className="text-sm text-text-muted">hoặc</span>
            <div className="h-px bg-dark-input flex-1" />
          </div>

          <p className="text-center text-sm text-text-secondary">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-white hover:text-brand-red font-medium transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
