"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  headerActions?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  gradientFrom?: string;
  gradientTo?: string;
  gradientDark?: string;
  maxHeight?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  headerActions,
  maxWidth = "md",
  gradientFrom = "from-gray-50",
  gradientTo = "to-gray-100",
  gradientDark = "dark:to-gray-700",
  maxHeight = "85vh",
}: ModalProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pt-4 pb-24 sm:pb-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} dark:from-gray-800 dark:via-gray-800 ${gradientDark} rounded-2xl ${maxWidthClasses[maxWidth]} w-full my-auto shadow-2xl flex flex-col`}
            style={{ maxHeight }}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.3, type: "spring", damping: 25 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {headerActions}
                <motion.button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </motion.button>
              </div>
            </div>

            <div
              className="overflow-y-auto flex-1"
              style={{
                maxHeight: footer ? `calc(${maxHeight} - 10rem)` : `calc(${maxHeight} - 5rem)`,
              }}
            >
              {children}
            </div>

            {footer && (
              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-2xl z-10">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
