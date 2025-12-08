/**
 * Toast Context
 * Global toast notification management with custom dark theme
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastContainer, ToastData, ToastType } from '../components/ui/Toast';

interface ToastOptions {
  duration?: number;
}

interface ToastContextValue {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((type: ToastType, message: string, options?: ToastOptions) => {
    const id = String(++toastId);
    const duration = options?.duration ?? 4000;

    setToasts((prev) => [...prev, { id, type, message, duration }]);

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback(
    (message: string, options?: ToastOptions) => addToast('success', message, options),
    [addToast]
  );

  const error = useCallback(
    (message: string, options?: ToastOptions) => addToast('error', message, options),
    [addToast]
  );

  const warning = useCallback(
    (message: string, options?: ToastOptions) => addToast('warning', message, options),
    [addToast]
  );

  const info = useCallback(
    (message: string, options?: ToastOptions) => addToast('info', message, options),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ success, error, warning, info, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Standalone toast API (compatible with sonner's API)
// This allows using toast.success(), toast.error(), etc. without the hook
let globalToastRef: ToastContextValue | null = null;

export function setGlobalToastRef(ref: ToastContextValue) {
  globalToastRef = ref;
}

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    if (globalToastRef) globalToastRef.success(message, options);
    else console.warn('Toast not initialized. Wrap your app in ToastProvider.');
  },
  error: (message: string, options?: ToastOptions) => {
    if (globalToastRef) globalToastRef.error(message, options);
    else console.warn('Toast not initialized. Wrap your app in ToastProvider.');
  },
  warning: (message: string, options?: ToastOptions) => {
    if (globalToastRef) globalToastRef.warning(message, options);
    else console.warn('Toast not initialized. Wrap your app in ToastProvider.');
  },
  info: (message: string, options?: ToastOptions) => {
    if (globalToastRef) globalToastRef.info(message, options);
    else console.warn('Toast not initialized. Wrap your app in ToastProvider.');
  },
  dismiss: (id: string) => {
    if (globalToastRef) globalToastRef.dismiss(id);
  },
  dismissAll: () => {
    if (globalToastRef) globalToastRef.dismissAll();
  },
};

export default ToastContext;


