/**
 * Toast Initializer Component
 * This component initializes the global toast reference for standalone usage
 */

import { useEffect } from 'react';
import { useToast, setGlobalToastRef } from '../contexts/ToastContext';

export function ToastInitializer() {
  const toastContext = useToast();

  useEffect(() => {
    setGlobalToastRef(toastContext);
  }, [toastContext]);

  return null;
}

export default ToastInitializer;





