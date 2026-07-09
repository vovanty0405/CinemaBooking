
import { useToastStore, type Toast as ToastType } from '../../stores/toastStore';
import { cn } from '../../utils/tailwind';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastIcon = ({ type }: { type: ToastType['type'] }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="text-accent-teal" size={20} />;
    case 'error':
      return <AlertCircle className="text-brand-red" size={20} />;
    case 'warning':
      return <AlertTriangle className="text-accent-orange" size={20} />;
    case 'info':
    default:
      return <Info className="text-accent-blue" size={20} />;
  }
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-3 min-w-[300px] p-4 rounded-md shadow-lg border border-dark-input bg-dark-surface text-text-primary animate-in slide-in-from-right-full slide-out-to-right-full fade-in fade-out relative overflow-hidden'
          )}
        >
          <ToastIcon type={toast.type} />
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-text-muted hover:text-text-primary"
          >
            <X size={16} />
          </button>
          {/* Progress bar */}
          <div 
            className="absolute bottom-0 left-0 h-1 bg-dark-input w-full"
          >
            <div 
              className="h-full bg-current opacity-30 animate-[shrink_3s_linear_forwards]"
            />
          </div>
        </div>
      ))}
    </div>
  );
};
