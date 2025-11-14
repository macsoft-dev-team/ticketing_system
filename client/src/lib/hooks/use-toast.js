import { useContext, useCallback } from 'react';
import { ToastContext } from '../../components/ui/toast';

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const toast = useCallback(
    ({ title, description, variant }) => {
      context.addToast({ title, description, variant });
    },
    [context]
  );

  return { toast };
}
   