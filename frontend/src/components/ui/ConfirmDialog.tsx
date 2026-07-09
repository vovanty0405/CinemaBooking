import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, onClose, onConfirm, title, message,
  confirmText = 'Xác nhận', variant = 'danger', isLoading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`p-3 rounded-full ${variant === 'danger' ? 'bg-brand-red/15' : 'bg-[#F5A623]/15'}`}>
          <AlertTriangle size={32} className={variant === 'danger' ? 'text-brand-red' : 'text-[#F5A623]'} />
        </div>
        <p className="text-text-muted text-sm">{message}</p>
        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-[#2B2B2B] rounded-lg text-white hover:bg-[#2B2B2B] transition-colors font-medium"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-brand-red text-white hover:bg-brand-red-dark'
                : 'bg-[#F5A623] text-black hover:bg-[#E09600]'
            }`}
          >
            {isLoading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
