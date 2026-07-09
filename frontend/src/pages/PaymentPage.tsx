import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { StepProgress } from '../components/features/StepProgress';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useBookingStore } from '../stores/bookingStore';
import { BookingTimer } from '../components/features/BookingTimer';
import { CreditCard, Wallet, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { showtimesApi } from '../api/showtimes';
import { bookingsApi } from '../api/bookings';
import { paymentsApi } from '../api/payments';
import { promotionsApi } from '../api/promotions';
import { useToastStore } from '../stores/toastStore';
import { useAuthStore } from '../stores/authStore';

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const { selectedSeats, selectedCombos } = useBookingStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; couponId: string } | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSeats.length === 0) {
      addToast('Chưa có ghế nào được chọn!', 'warning');
      navigate(-1);
    }
    // 10 phút để thanh toán
    setExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
  }, [selectedSeats, navigate, addToast]);

  // Queries
  const { data: showtimeRes } = useQuery({
    queryKey: ['showtime', showtimeId],
    queryFn: () => showtimesApi.getById(showtimeId!),
    enabled: !!showtimeId,
  });

  const showtime = showtimeRes?.data?.data as any;
  const movie = showtime?.movie;

  const ticketAmount = selectedSeats.reduce((sum, seat) => {
    const basePrice = showtime?.basePrice || 100000;
    if (seat.type === 'vip') return sum + basePrice * 1.3;
    if (seat.type === 'couple') return sum + basePrice * 2.2;
    return sum + basePrice;
  }, 0);

  const comboAmount = selectedCombos.reduce((sum, combo) => sum + combo.price * combo.quantity, 0);
  const cartTotal = ticketAmount + comboAmount;

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const totalAmount = cartTotal - discountAmount;

  // Mutations
  const createPaymentMutation = useMutation({
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

  const createBookingMutation = useMutation({
    mutationFn: () => bookingsApi.create({
      showtimeId: showtimeId,
      seatIds: selectedSeats.map((s: any) => s._id),
      concessions: selectedCombos.map((c: any) => ({
        comboId: c.comboId.startsWith('default') ? undefined : c.comboId, // handle placeholder/mock id safely
        quantity: c.quantity,
        price: c.price
      })).filter(c => c.comboId !== undefined),
      couponCode: appliedCoupon?.code,
    }),
    onSuccess: (res) => {
      const data = res.data?.data as any;
      const bookingId = data?._id || data?.id;
      if (bookingId) {
        setCreatedBookingId(bookingId);
        createPaymentMutation.mutate(bookingId);
      } else {
        addToast('Không tạo được Booking ID', 'error');
      }
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng', 'error');
    }
  });

  const validateCouponMutation = useMutation({
    mutationFn: (code: string) => promotionsApi.validateCoupon({
      code,
      cartTotal: cartTotal,
      movieId: movie?._id,
      cinemaId: showtime?.room?.cinema?._id
    }),
    onSuccess: (res) => {
      setAppliedCoupon({
        code: couponCode,
        discountAmount: res.data.data.discountAmount,
        couponId: res.data.data.couponId
      });
      addToast('Áp dụng mã giảm giá thành công!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Mã giảm giá không hợp lệ', 'error');
      setAppliedCoupon(null);
    }
  });

  const handlePayment = () => {
    if (createdBookingId) {
      createPaymentMutation.mutate(createdBookingId);
    } else {
      createBookingMutation.mutate();
    }
  };

  const isProcessing = createBookingMutation.isPending || createPaymentMutation.isPending;

  if (!showtime || !movie) {
    return <div className="min-h-screen flex items-center justify-center text-text-muted">Đang tải...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-12 max-w-2xl mx-auto">
        <StepProgress steps={['Chọn ghế', 'Chọn bắp nước', 'Thanh toán', 'Xác nhận']} currentStep={2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Booking Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-dark-surface p-6 rounded-xl border border-dark-input shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 pb-4 border-b border-dark-input flex items-center justify-between">
              Tóm tắt đơn hàng
              {expiresAt && <BookingTimer expiresAt={expiresAt} onExpired={() => navigate(-1)} />}
            </h2>
            
            <div className="flex gap-4 mb-6">
              <img src={movie.posterUrl || 'https://via.placeholder.com/300x450'} alt={movie.title} className="w-24 h-36 object-cover rounded shadow-md aspect-[2/3]" />
              <div>
                <h3 className="text-lg font-bold text-white mb-2">{movie.title}</h3>
                <p className="text-sm text-text-secondary mb-1">{showtime.cinema?.name || 'CineBook'}</p>
                <p className="text-sm text-text-secondary mb-1">Phòng chiếu 1</p>
                <p className="text-sm font-medium text-white">{format(new Date(showtime.startTime), 'HH:mm - dd/MM/yyyy')}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Chi tiết ghế</h4>
              <div className="flex flex-col gap-2">
                {selectedSeats.map((seat: any) => {
                  const basePrice = showtime?.basePrice || 100000;
                  const price = seat.type === 'vip' ? basePrice * 1.3 : (seat.type === 'couple' ? basePrice * 2.2 : basePrice);
                  return (
                    <div key={seat._id} className="flex justify-between items-center text-sm">
                      <span className="text-white">Ghế {seat.row}{seat.number} ({seat.type === 'vip' ? 'VIP' : (seat.type === 'couple' ? 'Đôi' : 'Thường')})</span>
                      <span className="font-medium">{price.toLocaleString('vi-VN')}đ</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedCombos.length > 0 && (
              <div className="space-y-4 mb-6 border-t border-dark-input pt-4">
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Bắp nước</h4>
                <div className="flex flex-col gap-2">
                  {selectedCombos.map((combo: any) => (
                    <div key={combo.comboId} className="flex justify-between items-center text-sm">
                      <span className="text-white">{combo.name} x{combo.quantity}</span>
                      <span className="font-medium">{(combo.price * combo.quantity).toLocaleString('vi-VN')}đ</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-dark-input pt-4 mb-6">
              <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Mã giảm giá</h4>
              <div className="flex gap-2">
                <Input 
                  placeholder="Nhập mã (VD: GIAM10K)" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value)} 
                  className="flex-1 uppercase"
                />
                <Button 
                  onClick={() => validateCouponMutation.mutate(couponCode)} 
                  disabled={!couponCode || validateCouponMutation.isPending}
                >
                  Áp dụng
                </Button>
              </div>
            </div>

            <div className="border-t border-dark-input pt-4 space-y-3">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Tạm tính (vé)</span>
                <span>{ticketAmount.toLocaleString('vi-VN')} đ</span>
              </div>
              {comboAmount > 0 && (
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>Tạm tính (bắp nước)</span>
                  <span>{comboAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-brand-red">
                  <span>Giảm giá ({appliedCoupon.code})</span>
                  <span>- {discountAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Phí tiện ích (VNPay)</span>
                <span>0 đ</span>
              </div>
              <div className="flex justify-between items-end pt-2">
                <span className="font-semibold text-white">Tổng cộng</span>
                <span className="text-2xl font-bold text-brand-red">{Math.max(0, totalAmount).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Payment Form */}
        <div className="lg:col-span-7">
          <div className="bg-dark-surface p-6 rounded-xl border border-dark-input shadow-lg h-full">
            <h2 className="text-xl font-bold text-white mb-6 pb-4 border-b border-dark-input">
              Thông tin người đặt
            </h2>

            <div className="space-y-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Họ tên" defaultValue={user?.name || ''} disabled />
                <Input label="Số điện thoại" defaultValue="0901234567" />
                <Input label="Email" defaultValue={user?.email || ''} className="md:col-span-2" disabled />
              </div>
            </div>

            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Phương thức thanh toán</h3>
            <div className="space-y-4 mb-8">
              <label className="flex items-center justify-between p-4 rounded-lg border-2 border-brand-red bg-dark-input cursor-pointer transition-colors relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-red/5 pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-8 bg-white rounded flex items-center justify-center p-1">
                    <span className="text-[#005BAA] font-bold text-xs italic tracking-tighter leading-none">VN<span className="text-[#ED1C24]">PAY</span></span>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">Thanh toán qua VNPay</p>
                    <p className="text-xs text-text-secondary">ATM / Internet Banking / Visa / Master</p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-brand-red flex items-center justify-center relative z-10">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-red" />
                </div>
              </label>

              <label className="flex items-center justify-between p-4 rounded-lg border-2 border-dark-input bg-dark-bg cursor-not-allowed opacity-60">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-dark-surface rounded flex items-center justify-center border border-dark-input text-text-muted">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">Ví Momo (Bảo trì)</p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-dark-input" />
              </label>
            </div>

            <div className="flex items-start gap-3 mb-8 bg-dark-bg p-4 rounded-lg text-sm text-text-secondary">
              <ShieldCheck className="text-accent-teal shrink-0" size={20} />
              <p>
                Giao dịch của bạn được mã hóa và bảo mật. Bằng việc bấm thanh toán, bạn đồng ý với <a href="#" className="text-brand-red hover:underline">Điều khoản sử dụng</a> và <a href="#" className="text-brand-red hover:underline">Chính sách bảo mật</a> của CineBook.
              </p>
            </div>

            <Button 
              className="w-full py-4 text-lg flex items-center justify-center gap-2 relative overflow-hidden" 
              onClick={handlePayment}
              disabled={isProcessing}
            >
              <div className="absolute inset-0" style={{ background: 'var(--gradient-cta)' }} />
              <span className="relative z-10 flex items-center gap-2">
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tạo đơn hàng...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} /> Thanh toán qua VNPay
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
