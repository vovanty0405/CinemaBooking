import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-accent-purple mb-4" style={{ fontSize: '120px' }}>
        404
      </h1>
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Trang không tìm thấy</h2>
      <p className="text-text-secondary mb-10 max-w-md">
        Có vẻ như trang bạn đang tìm kiếm không tồn tại hoặc đã bị di dời.
      </p>
      
      <Link to="/">
        <Button size="lg" className="flex items-center gap-2">
          <Home size={20} /> Về trang chủ
        </Button>
      </Link>
    </div>
  );
};
