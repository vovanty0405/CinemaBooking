import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { X } from 'lucide-react';

export const BookingFailedPage: React.FC = () => {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShowContent(true);
    }, 100);
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[70vh]">
      <div className={`transition-all duration-700 transform ${showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'} flex flex-col items-center text-center max-w-md`}>
        <div className="w-24 h-24 bg-brand-red/10 rounded-full flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-brand-red rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(229,9,20,0.4)]">
            <X size={32} strokeWidth={3} className="text-white animate-pulse" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Thanh toán thất bại</h1>
        <p className="text-text-secondary mb-8 text-lg">
          Rất tiếc, giao dịch của bạn không thành công do lỗi từ cổng thanh toán hoặc thẻ bị từ chối. Vui lòng thử lại.
        </p>
        
        <div className="bg-dark-surface border border-dark-input p-4 rounded-md w-full mb-8 text-left text-sm">
          <p className="text-text-muted mb-1">Mã lỗi: <span className="text-white font-mono">ERR_VNPAY_04</span></p>
          <p className="text-text-muted">Lý do: <span className="text-white">Khách hàng hủy giao dịch</span></p>
        </div>

        <div className="flex flex-col w-full gap-3">
          <Button variant="primary" size="lg" onClick={() => navigate(-1)} className="w-full">
            Thử lại thanh toán
          </Button>
          <Button variant="ghost" size="lg" onClick={() => navigate('/')} className="w-full">
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
};
