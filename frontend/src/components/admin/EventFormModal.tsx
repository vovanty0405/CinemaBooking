import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../../api/events';
import type { Event } from '../../api/events';
import { useToastStore } from '../../stores/toastStore';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { RichTextEditor } from '../ui/RichTextEditor';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: Event | null;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({ isOpen, onClose, eventToEdit }) => {
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [category, setCategory] = useState<'promotion' | 'membership' | 'news' | 'seasonal'>('promotion');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [content, setContent] = useState('');

  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setShortDescription(eventToEdit.shortDescription || '');
      setCategory(eventToEdit.category);
      setStartDate(new Date(eventToEdit.startDate).toISOString().slice(0, 16));
      setEndDate(eventToEdit.endDate ? new Date(eventToEdit.endDate).toISOString().slice(0, 16) : '');
      setIsFeatured(eventToEdit.isFeatured);
      setStatus(eventToEdit.status);
      setThumbnailUrl(eventToEdit.thumbnailUrl);
      setBannerUrl(eventToEdit.bannerUrl || '');
      setContent(eventToEdit.content);
    } else {
      setTitle('');
      setShortDescription('');
      setCategory('promotion');
      setStartDate('');
      setEndDate('');
      setIsFeatured(false);
      setStatus('draft');
      setThumbnailUrl('');
      setBannerUrl('');
      setContent('');
    }
  }, [eventToEdit, isOpen]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Event>) => 
      eventToEdit 
        ? eventsApi.updateEvent(eventToEdit._id, data) 
        : eventsApi.createEvent(data),
    onSuccess: () => {
      addToast(eventToEdit ? 'Cập nhật thành công' : 'Thêm mới thành công', 'success');
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      onClose();
    },
    onError: (err: any) => addToast(err.response?.data?.message || 'Đã có lỗi xảy ra', 'error')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content === '<p></p>') {
      addToast('Vui lòng nhập nội dung bài viết', 'error');
      return;
    }
    saveMutation.mutate({
      title,
      shortDescription,
      category,
      startDate,
      endDate: endDate || null,
      isFeatured,
      status,
      thumbnailUrl,
      bannerUrl: bannerUrl || undefined,
      content
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={eventToEdit ? 'Chỉnh sửa Sự kiện' : 'Thêm Sự kiện mới'} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cột trái: Thông tin cơ bản */}
          <div className="space-y-4 flex flex-col">
            <Input 
              label="Tiêu đề bài viết *" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Mô tả ngắn ({shortDescription.length}/200)</label>
              <textarea 
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                maxLength={200}
                className="w-full bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none p-3 h-24 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Danh mục</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value as any)} 
                  className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg w-full px-3 py-2.5 focus:ring-2 focus:ring-brand-red focus:outline-none"
                >
                  <option value="promotion">Khuyến mãi</option>
                  <option value="news">Tin tức</option>
                  <option value="membership">Thành viên</option>
                  <option value="seasonal">Sự kiện mùa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Trạng thái</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value as any)} 
                  className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg w-full px-3 py-2.5 focus:ring-2 focus:ring-brand-red focus:outline-none"
                >
                  <option value="draft">Bản nháp</option>
                  <option value="published">Đăng ngay</option>
                  <option value="archived">Lưu trữ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Bắt đầu *" 
                type="datetime-local" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                required 
                style={{ colorScheme: 'dark' }}
              />
              <Input 
                label="Kết thúc (tùy chọn)" 
                type="datetime-local" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                style={{ colorScheme: 'dark' }}
              />
            </div>

            <label className="flex items-center gap-2 mt-2 cursor-pointer text-sm text-text-secondary">
              <input 
                type="checkbox" 
                checked={isFeatured} 
                onChange={(e) => setIsFeatured(e.target.checked)} 
                className="rounded bg-[#2B2B2B] text-brand-red focus:ring-brand-red w-4 h-4" 
              />
              Sự kiện Nổi bật (Ghim lên trang chủ)
            </label>
          </div>

          {/* Cột phải: Hình ảnh */}
          <div className="space-y-4">
            <Input 
              label="URL Ảnh Thumbnail (vuông/4:3) *" 
              value={thumbnailUrl} 
              onChange={(e) => setThumbnailUrl(e.target.value)} 
              placeholder="https://..."
              required 
            />
            {thumbnailUrl && (
              <div className="mt-2 bg-[#1A1A1A] border border-[#2B2B2B] p-2 rounded flex justify-center">
                <img src={thumbnailUrl} alt="Thumbnail preview" className="h-32 w-auto object-cover rounded" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300?text=Error')} />
              </div>
            )}

            <Input 
              label="URL Ảnh Banner (ngang 21:9 - tùy chọn)" 
              value={bannerUrl} 
              onChange={(e) => setBannerUrl(e.target.value)} 
              placeholder="https://..."
            />
            {bannerUrl && (
              <div className="mt-2 bg-[#1A1A1A] border border-[#2B2B2B] p-2 rounded flex justify-center">
                <img src={bannerUrl} alt="Banner preview" className="h-24 w-full object-cover rounded" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/600x200?text=Error')} />
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex flex-col flex-1">
          <label className="block text-sm font-medium text-text-secondary mb-2">Nội dung chi tiết *</label>
          <RichTextEditor value={content} onChange={setContent} />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#2B2B2B] mt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Đang lưu...' : 'Lưu Sự kiện'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
