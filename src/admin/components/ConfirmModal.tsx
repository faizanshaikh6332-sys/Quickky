import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';

// Supports both old props (isOpen/confirmText/type) and new props (open/confirmLabel/danger)
export interface ConfirmModalProps {
  // New API
  open?: boolean;
  confirmLabel?: string;
  danger?: boolean;
  // Old API aliases (admin pages use these)
  isOpen?: boolean;
  confirmText?: string;
  type?: string;
  // Common
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  cancelText?: string;
  isDanger?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

export function ConfirmModal({
  open,
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  confirmText,
  danger,
  isDanger,
  type,
  cancelText,
  loading = false,
  children,
}: ConfirmModalProps) {
  const isVisible   = open ?? isOpen ?? false;
  const label       = confirmLabel ?? confirmText ?? 'Confirm';
  const isDangerMode = danger ?? isDanger ?? type === 'danger';

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={loading ? undefined : onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md p-6 mx-4 bg-white dark:bg-gray-900 rounded-3xl shadow-xl z-10 border border-gray-100 dark:border-gray-800"
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 flex items-center justify-center rounded-full mb-4 ${isDangerMode ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                {isDangerMode ? <AlertTriangle className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-500">{message}</p>
            </div>

            {children && <div className="mt-4">{children}</div>}

            <div className="mt-6 flex gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
              >
                {cancelText ?? 'Cancel'}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center ${
                  isDangerMode
                    ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                }`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : label}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ConfirmModal;
