import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Globe } from 'lucide-react';
import { promotionsApi } from '../../api/promotions';
import { useToastStore } from '../../stores/toastStore';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AdminEventsTab } from '../../components/admin/AdminEventsTab';

export const AdminPromotionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'coupon' | 'combo' | 'event'>('coupon');
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  // Modals state
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);

  // Coupon form state
  const [couponCode, setCouponCode] = useState('');
  const [couponName, setCouponName] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(0);
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [couponStartDate, setCouponStartDate] = useState('');
  const [couponEndDate, setCouponEndDate] = useState('');
  const [usageLimitTotal, setUsageLimitTotal] = useState<number>(0);
  const [couponStatus, setCouponStatus] = useState<'active' | 'inactive' | 'scheduled'>('active');
  const [couponIsFeatured, setCouponIsFeatured] = useState(false);
  const [couponTag, setCouponTag] = useState('');

  // Combo form state
  const [comboName, setComboName] = useState('');
  const [comboImage, setComboImage] = useState('');
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [comboPrice, setComboPrice] = useState<number>(0);
  const [comboItems, setComboItems] = useState<{ itemName: string; quantity: number }[]>([
    { itemName: '', quantity: 1 }
  ]);
  const [comboStatus, setComboStatus] = useState<'active' | 'inactive'>('active');
  const [comboIsFeatured, setComboIsFeatured] = useState(false);
  const [comboTag, setComboTag] = useState('');

  // Queries
  const { data: couponsRes, isLoading: couponsLoading } = useQuery({
    queryKey: ['adminCoupons'],
    queryFn: () => promotionsApi.getCoupons(),
  });
  const coupons = couponsRes?.data?.data || [];

  const { data: combosRes, isLoading: combosLoading } = useQuery({
    queryKey: ['adminCombos'],
    queryFn: () => promotionsApi.getCombos(),
  });
  const combos = combosRes?.data?.data || [];

  // Mutations
  const createCouponMutation = useMutation({
    mutationFn: (data: any) => promotionsApi.createCoupon(data),
    onSuccess: () => {
      addToast('Thêm Coupon thành công!', 'success');
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
      closeCouponModal();
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Lỗi khi tạo Coupon', 'error');
    }
  });

  const createComboMutation = useMutation({
    mutationFn: (data: any) => promotionsApi.createCombo(data),
    onSuccess: () => {
      addToast('Thêm Combo thành công!', 'success');
      queryClient.invalidateQueries({ queryKey: ['adminCombos'] });
      closeComboModal();
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Lỗi khi tạo Combo', 'error');
    }
  });

  // Helpers
  const closeCouponModal = () => {
    setIsCouponModalOpen(false);
    setCouponCode('');
    setCouponName('');
    setDiscountType('fixed');
    setDiscountValue(0);
    setMaxDiscountAmount(0);
    setMinOrderValue(0);
    setCouponStartDate('');
    setCouponEndDate('');
    setUsageLimitTotal(0);
    setCouponStatus('active');
    setCouponIsFeatured(false);
    setCouponTag('');
  };

  const closeComboModal = () => {
    setIsComboModalOpen(false);
    setComboName('');
    setComboImage('');
    setOriginalPrice(0);
    setComboPrice(0);
    setComboItems([{ itemName: '', quantity: 1 }]);
    setComboStatus('active');
    setComboIsFeatured(false);
    setComboTag('');
  };

  const handleAddComboItem = () => {
    setComboItems([...comboItems, { itemName: '', quantity: 1 }]);
  };

  const handleRemoveComboItem = (index: number) => {
    if (comboItems.length > 1) {
      setComboItems(comboItems.filter((_, i) => i !== index));
    }
  };

  const handleComboItemChange = (index: number, field: string, value: any) => {
    setComboItems(comboItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Quản lý Khuyến mãi</h2>
          <p className="text-sm text-text-muted mt-1">Tạo và quản lý các mã giảm giá, chương trình khuyến mãi và combo ưu đãi.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsComboModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[#2B2B2B] rounded-lg text-white hover:bg-[#1F1F1F] transition-colors text-sm font-semibold"
          >
            <Plus size={18} />
            Thêm Combo mới
          </button>
          <button 
            onClick={() => setIsCouponModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-br from-brand-red to-[#B20710] text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(229,9,20,0.4)] transition-all duration-300 active:scale-95 text-sm"
          >
            <Plus size={18} />
            Thêm Coupon mới
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#1F1F1F] rounded-xl border border-[#2B2B2B] p-4 flex flex-col lg:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex p-1 bg-[#141414] rounded-lg w-full lg:w-auto">
          <button 
            onClick={() => setActiveTab('coupon')}
            className={`flex-1 lg:flex-none px-6 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'coupon' ? 'bg-[#2B2B2B] text-white shadow-sm' : 'text-text-muted hover:text-white'}`}
          >
            Mã giảm giá (Coupon)
          </button>
          <button 
            onClick={() => setActiveTab('combo')}
            className={`flex-1 lg:flex-none px-6 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'combo' ? 'bg-[#2B2B2B] text-white shadow-sm' : 'text-text-muted hover:text-white'}`}
          >
            Combo bắp nước
          </button>
          <button 
            onClick={() => setActiveTab('event')}
            className={`flex-1 lg:flex-none px-6 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'event' ? 'bg-[#2B2B2B] text-white shadow-sm' : 'text-text-muted hover:text-white'}`}
          >
            Sự kiện (Event)
          </button>
        </div>
      </div>

      {/* Coupons Tab Content */}
      {activeTab === 'coupon' && (
        <>
          <div className="bg-[#1F1F1F] rounded-xl border border-[#2B2B2B] overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#141414] border-b border-[#2B2B2B]">
                    <th className="py-4 px-6 text-xs text-text-muted uppercase tracking-wider font-semibold">Mã / Tên</th>
                    <th className="py-4 px-6 text-xs text-text-muted uppercase tracking-wider font-semibold">Loại & Giá trị</th>
                    <th className="py-4 px-6 text-xs text-text-muted uppercase tracking-wider font-semibold">Lượt dùng</th>
                    <th className="py-4 px-6 text-xs text-text-muted uppercase tracking-wider font-semibold">Thời hạn</th>
                    <th className="py-4 px-6 text-xs text-text-muted uppercase tracking-wider font-semibold">Trang chủ</th>
                    <th className="py-4 px-6 text-xs text-text-muted uppercase tracking-wider font-semibold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B2B2B]">
                  {couponsLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red mx-auto"></div>
                      </td>
                    </tr>
                  ) : coupons.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-text-muted">
                        Chưa có mã giảm giá nào.
                      </td>
                    </tr>
                  ) : (
                    coupons.map((coupon: any) => (
                      <tr key={coupon._id} className="hover:bg-[#2A2A2A]/50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded flex items-center justify-center shrink-0 font-bold bg-[#2B2B2B] border border-[#393939] text-white">
                              {coupon.code.slice(0, 3).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-white">{coupon.code}</div>
                              <div className="text-xs text-text-muted truncate w-48">{coupon.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-sm text-white">
                            {coupon.discountType === 'percent' ? `Giảm ${coupon.discountValue}%` : `Giảm ${coupon.discountValue.toLocaleString('vi-VN')} đ`}
                          </div>
                          <div className="text-xs text-text-muted">
                            {coupon.minOrderValue > 0 ? `Đơn tối thiểu ${coupon.minOrderValue.toLocaleString('vi-VN')} đ` : 'Mọi đơn hàng'}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-white">
                            {coupon.usedCount} / {coupon.usageLimitTotal || '∞'}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-white">
                          <div>{new Date(coupon.startDate).toLocaleDateString('vi-VN')}</div>
                          <div className="text-xs text-text-muted">đến {new Date(coupon.endDate).toLocaleDateString('vi-VN')}</div>
                        </td>
                        <td className="py-4 px-6">
                          {coupon.isFeaturedOnHome ? (
                            <span title="Hiển thị trang chủ">
                              <Globe size={18} className="text-accent-teal" />
                            </span>
                          ) : (
                            <span className="text-text-muted text-xs">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            coupon.status === 'active' ? 'bg-accent-teal/15 text-accent-teal border border-accent-teal/30' :
                            coupon.status === 'scheduled' ? 'bg-[#393939] text-white border border-[#444]' :
                            'bg-brand-red/15 text-brand-red border border-brand-red/30'
                          }`}>
                            {coupon.status === 'active' ? 'Đang hoạt động' : coupon.status === 'scheduled' ? 'Đã lên lịch' : 'Đã khóa'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Combos Tab Content */}
      {activeTab === 'combo' && (
        <div className="bg-[#1F1F1F] rounded-xl border border-[#2B2B2B] overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#141414] border-b border-[#2B2B2B]">
                  <th className="py-4 px-6 text-xs text-text-muted uppercase tracking-wider font-semibold">Combo</th>
                  <th className="py-4 px-6 text-xs text-text-muted uppercase tracking-wider font-semibold">Chi tiết nước / bắp</th>
                  <th className="py-4 px-6 text-xs text-text-muted uppercase tracking-wider font-semibold">Giá bán</th>
                  <th className="py-4 px-6 text-xs text-text-muted uppercase tracking-wider font-semibold">Trang chủ</th>
                  <th className="py-4 px-6 text-xs text-text-muted uppercase tracking-wider font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B2B2B]">
                {combosLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red mx-auto"></div>
                    </td>
                  </tr>
                ) : combos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-text-muted">
                      Chưa có combo nào.
                    </td>
                  </tr>
                ) : (
                  combos.map((combo: any) => (
                    <tr key={combo._id} className="hover:bg-[#2A2A2A]/50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <img src={combo.imageUrl} alt={combo.name} className="w-16 h-16 object-contain bg-white p-1 rounded border border-[#2B2B2B]" />
                          <div>
                            <div className="font-semibold text-sm text-white uppercase">{combo.name}</div>
                            {combo.tagLabel && <span className="bg-brand-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block">{combo.tagLabel}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-text-muted">
                        <div className="space-y-0.5">
                          {combo.items.map((it: any, idx: number) => (
                            <div key={idx}>• {it.itemName} (x{it.quantity})</div>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-sm text-[#E50914]">{combo.comboPrice.toLocaleString('vi-VN')} đ</div>
                        <div className="text-xs text-text-muted line-through">{combo.originalPrice.toLocaleString('vi-VN')} đ</div>
                      </td>
                      <td className="py-4 px-6">
                        {combo.isFeaturedOnHome ? (
                          <span title="Hiển thị trang chủ">
                            <Globe size={18} className="text-accent-teal" />
                          </span>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          combo.status === 'active' ? 'bg-accent-teal/15 text-accent-teal border border-accent-teal/30' :
                          'bg-brand-red/15 text-brand-red border border-brand-red/30'
                        }`}>
                          {combo.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Events Tab Content */}
      {activeTab === 'event' && <AdminEventsTab />}

      {/* Add Coupon Modal */}
      <Modal isOpen={isCouponModalOpen} onClose={closeCouponModal} title="Thêm Coupon khuyến mãi mới" size="md">
        <form onSubmit={(e) => {
          e.preventDefault();
          createCouponMutation.mutate({
            code: couponCode,
            name: couponName,
            discountType,
            discountValue,
            maxDiscountAmount: discountType === 'percent' ? maxDiscountAmount : undefined,
            minOrderValue,
            startDate: couponStartDate,
            endDate: couponEndDate,
            usageLimitTotal: usageLimitTotal > 0 ? usageLimitTotal : undefined,
            status: couponStatus,
            isFeaturedOnHome: couponIsFeatured,
            tagLabel: couponTag
          });
        }} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Mã Coupon (Ví dụ: GIAM20K)" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} required />
            <Input label="Tên chương trình" value={couponName} onChange={(e) => setCouponName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Loại giảm giá</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2.5 w-full">
                <option value="fixed">Giảm số tiền cố định (đ)</option>
                <option value="percent">Giảm theo phần trăm (%)</option>
              </select>
            </div>
            <Input label="Giá trị giảm" type="number" min={0} value={discountValue || ''} onChange={(e) => setDiscountValue(Number(e.target.value))} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Đơn hàng tối thiểu (đ)" type="number" min={0} value={minOrderValue || ''} onChange={(e) => setMinOrderValue(Number(e.target.value))} />
            {discountType === 'percent' && (
              <Input label="Số tiền giảm tối đa (đ)" type="number" min={0} value={maxDiscountAmount || ''} onChange={(e) => setMaxDiscountAmount(Number(e.target.value))} />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Ngày bắt đầu" type="datetime-local" value={couponStartDate} onChange={(e) => setCouponStartDate(e.target.value)} required style={{ colorScheme: 'dark' }} />
            <Input label="Ngày kết thúc" type="datetime-local" value={couponEndDate} onChange={(e) => setCouponEndDate(e.target.value)} required style={{ colorScheme: 'dark' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Tổng lượt sử dụng tối đa" type="number" min={0} value={usageLimitTotal || ''} onChange={(e) => setUsageLimitTotal(Number(e.target.value))} placeholder="Bỏ trống nếu không giới hạn" />
            <Input label="Nhãn nổi bật (Ví dụ: HOT, VIP)" value={couponTag} onChange={(e) => setCouponTag(e.target.value)} />
          </div>

          <div className="flex gap-6 py-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
              <input type="checkbox" checked={couponIsFeatured} onChange={(e) => setCouponIsFeatured(e.target.checked)} className="rounded bg-[#2B2B2B] text-brand-red focus:ring-brand-red w-4 h-4" />
              Hiển thị Banner nổi bật ở trang chủ
            </label>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Trạng thái khởi tạo</label>
              <select value={couponStatus} onChange={(e) => setCouponStatus(e.target.value as any)} className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg px-4 py-1.5">
                <option value="active">Kích hoạt ngay</option>
                <option value="inactive">Khóa tạm thời</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeCouponModal} className="flex-1">Hủy</Button>
            <Button type="submit" disabled={createCouponMutation.isPending} className="flex-1">
              {createCouponMutation.isPending ? 'Đang tạo...' : 'Tạo Coupon'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Combo Modal */}
      <Modal isOpen={isComboModalOpen} onClose={closeComboModal} title="Thêm Combo bắp nước mới" size="md">
        <form onSubmit={(e) => {
          e.preventDefault();
          createComboMutation.mutate({
            name: comboName,
            imageUrl: comboImage,
            originalPrice,
            comboPrice,
            items: comboItems.filter(it => it.itemName),
            status: comboStatus,
            isFeaturedOnHome: comboIsFeatured,
            tagLabel: comboTag
          });
        }} className="flex flex-col gap-5">
          <Input label="Tên Combo (Ví dụ: Combo Solo)" value={comboName} onChange={(e) => setComboName(e.target.value)} required />
          <Input label="URL hình ảnh sản phẩm" value={comboImage} onChange={(e) => setComboImage(e.target.value)} placeholder="Nhập link ảnh bắp nước..." required />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Giá gốc của các món lẻ (đ)" type="number" min={0} value={originalPrice || ''} onChange={(e) => setOriginalPrice(Number(e.target.value))} required />
            <Input label="Giá bán ưu đãi của Combo (đ)" type="number" min={0} value={comboPrice || ''} onChange={(e) => setComboPrice(Number(e.target.value))} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Thành phần chi tiết</label>
            <div className="space-y-3">
              {comboItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input placeholder="Tên nước / bắp (Ví dụ: Bắp ngọt lớn)" value={item.itemName} onChange={(e) => handleComboItemChange(index, 'itemName', e.target.value)} required />
                  <Input type="number" min={1} className="w-24" value={item.quantity} onChange={(e) => handleComboItemChange(index, 'quantity', Number(e.target.value))} required />
                  <button type="button" onClick={() => handleRemoveComboItem(index)} disabled={comboItems.length === 1} className="p-2.5 text-text-muted hover:text-brand-red bg-[#2B2B2B] rounded-lg transition disabled:opacity-40">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={handleAddComboItem} className="w-full text-sm py-1.5">+ Thêm món</Button>
            </div>
          </div>

          <div className="flex gap-6 py-2 justify-between items-center">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
              <input type="checkbox" checked={comboIsFeatured} onChange={(e) => setComboIsFeatured(e.target.checked)} className="rounded bg-[#2B2B2B] text-brand-red focus:ring-brand-red w-4 h-4" />
              Hiển thị Banner nổi bật ở trang chủ
            </label>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Trạng thái bán</label>
              <select value={comboStatus} onChange={(e) => setComboStatus(e.target.value as any)} className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg px-4 py-1.5">
                <option value="active">Mở bán ngay</option>
                <option value="inactive">Ngừng bán</option>
              </select>
            </div>
            <Input label="Nhãn (HOT, Bestseller)" className="w-40" value={comboTag} onChange={(e) => setComboTag(e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeComboModal} className="flex-1">Hủy</Button>
            <Button type="submit" disabled={createComboMutation.isPending} className="flex-1">
              {createComboMutation.isPending ? 'Đang tạo...' : 'Tạo Combo'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
