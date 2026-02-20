"use client";

interface ModalActionsProps {
  formId: string;
  onCancel: () => void;
  isSubmitting: boolean;
  isDisabled?: boolean;
  submitLabel: string;
  cancelLabel?: string;
  submitClassName?: string;
  loadingText?: string;
}

export default function ModalActions({
  formId,
  onCancel,
  isSubmitting,
  isDisabled = false,
  submitLabel,
  cancelLabel = "Cancel",
  submitClassName = "bg-gradient-to-r from-app-gradient-from to-app-gradient-to hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/30 hover:shadow-indigo-500/40",
  loadingText = "Processing...",
}: ModalActionsProps) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
        disabled={isSubmitting}
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        form={formId}
        disabled={isSubmitting || isDisabled}
        className={`flex-1 px-6 py-3 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${submitClassName}`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText}
          </span>
        ) : (
          submitLabel
        )}
      </button>
    </div>
  );
}
