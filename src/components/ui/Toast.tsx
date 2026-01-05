/**
 * Custom Toast Component
 * Dark themed, clean, modern toast notification system
 */

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const iconMap = {
  success: { Icon: CheckCircle, color: 'text-green-500' },
  error: { Icon: XCircle, color: 'text-red-500' },
  warning: { Icon: AlertTriangle, color: 'text-amber-500' },
  info: { Icon: Info, color: 'text-blue-500' },
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const { Icon, color } = iconMap[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex items-center w-full max-w-sm p-4 text-gray-200 bg-gray-800 rounded-lg shadow-lg"
      role="alert"
    >
      {/* Icon */}
      <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 bg-gray-700 rounded-lg">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>

      {/* Message */}
      <div className="ms-3 text-sm font-medium text-gray-200 flex-1">
        {toast.message}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="ml-4 shrink-0 bg-gray-700 text-gray-400 hover:text-white rounded-lg focus:ring-2 focus:ring-gray-500 p-1.5 hover:bg-gray-600 inline-flex items-center justify-center h-8 w-8 transition-colors"
        aria-label="Close"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

import { createPortal } from 'react-dom';

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[100000] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

export default Toast;

