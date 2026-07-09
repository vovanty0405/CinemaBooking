import React from 'react';
import { Film } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-black border-t border-dark-input py-12 mt-auto">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2 text-brand-red">
            <Film size={28} />
            <span className="text-xl font-bold tracking-tight text-white">CineBook</span>
          </Link>
          <p className="text-sm text-text-secondary leading-relaxed">
            Hệ thống đặt vé xem phim trực tuyến hàng đầu, mang lại trải nghiệm tiện lợi và nhanh chóng nhất.
          </p>
          <div className="flex items-center gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-dark-input flex items-center justify-center text-text-muted hover:text-white hover:bg-brand-red transition-all">FB</a>
              <a href="#" className="w-10 h-10 rounded-full bg-dark-input flex items-center justify-center text-text-muted hover:text-white hover:bg-brand-red transition-all">TW</a>
              <a href="#" className="w-10 h-10 rounded-full bg-dark-input flex items-center justify-center text-text-muted hover:text-white hover:bg-brand-red transition-all">IG</a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Phim</h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li><Link to="/movies" className="hover:text-brand-red transition-colors">Phim đang chiếu</Link></li>
            <li><Link to="/movies" className="hover:text-brand-red transition-colors">Phim sắp chiếu</Link></li>
            <li><Link to="/movies" className="hover:text-brand-red transition-colors">IMAX / 4DX</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li><a href="#" className="hover:text-brand-red transition-colors">Câu hỏi thường gặp</a></li>
            <li><a href="#" className="hover:text-brand-red transition-colors">Liên hệ</a></li>
            <li><a href="#" className="hover:text-brand-red transition-colors">Chính sách bảo mật</a></li>
            <li><a href="#" className="hover:text-brand-red transition-colors">Điều khoản dịch vụ</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Đăng ký nhận tin</h4>
          <p className="text-sm text-text-secondary mb-4">
            Nhận thông tin về các bộ phim mới và ưu đãi đặc biệt.
          </p>
          <div className="flex flex-col space-y-2">
            <input 
              type="email" 
              placeholder="Email của bạn" 
              className="w-full rounded-sm bg-dark-input border border-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            />
            <button className="w-full bg-brand-red hover:bg-brand-red-dark text-white font-medium py-2 rounded-sm transition-colors text-sm">
              Đăng ký
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-dark-input text-center text-sm text-text-muted">
        <p>&copy; {new Date().getFullYear()} CineBook. All rights reserved.</p>
      </div>
    </footer>
  );
};
