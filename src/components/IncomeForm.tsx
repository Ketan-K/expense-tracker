"use client";

import { useState, useEffect } from "react";
import { FileText, TrendingUp, Check } from "lucide-react";
import { format } from "date-fns";
import { DEFAULT_INCOME_SOURCES } from "@/lib/types";
import AmountInput from "@/components/shared/AmountInput";
import DatePicker from "@/components/shared/DatePicker";

interface IncomeFormProps {
  initialData?: {
    date?: string;
    amount?: string;
    source?: string;
    category?: string;
    description?: string;
    taxable?: boolean;
    recurring?: boolean;
  };
  onSubmit: (data: {
    date: string;
    amount: string;
    source: string;
    category?: string;
    description: string;
    taxable: boolean;
    recurring: boolean;
  }) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  showCancel?: boolean;
}

export default function IncomeForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Add Income",
  isSubmitting = false,
  showCancel = false,
}: IncomeFormProps) {
  const [formData, setFormData] = useState({
    date: initialData?.date || format(new Date(), "yyyy-MM-dd"),
    amount: initialData?.amount || "",
    source: initialData?.source || "",
    category: initialData?.category || "",
    description: initialData?.description || "",
    taxable: initialData?.taxable ?? true,
    recurring: initialData?.recurring ?? false,
  });

  const [customSource, setCustomSource] = useState("");
  const [showCustomSource, setShowCustomSource] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date || format(new Date(), "yyyy-MM-dd"),
        amount: initialData.amount || "",
        source: initialData.source || "",
        category: initialData.category || "",
        description: initialData.description || "",
        taxable: initialData.taxable ?? true,
        recurring: initialData.recurring ?? false,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);

    if (!initialData) {
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        amount: "",
        source: "",
        category: "",
        description: "",
        taxable: true,
        recurring: false,
      });
    }
  };

  const handleSelectSource = (source: string) => {
    if (source === "custom") {
      setShowCustomSource(true);
    } else {
      setFormData({ ...formData, source });
      setShowCustomSource(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
      {/* Date */}
      <DatePicker
        value={formData.date}
        onChange={(date) => setFormData({ ...formData, date })}
      />

      {/* Amount */}
      <AmountInput
        value={formData.amount}
        onChange={(amount) => setFormData({ ...formData, amount })}
        quickAmounts={[1000, 5000, 10000, 50000]}
      />

      {/* Source */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <TrendingUp className="w-4 h-4 inline mr-2 text-green-600" />
          Income Source
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DEFAULT_INCOME_SOURCES.map((source) => {
            const isSelected = formData.source === source;
            return (
              <button
                key={source}
                type="button"
                onClick={() => handleSelectSource(source)}
                className={`px-4 py-3 rounded-xl font-medium transition-all text-sm active:scale-95 ${
                  isSelected
                    ? "bg-gradient-to-r from-app-income to-app-income-end text-white shadow-lg shadow-green-500/50"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md"
                }`}
              >
                {source}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => handleSelectSource("custom")}
            className={`px-4 py-3 rounded-xl font-medium transition-all text-sm active:scale-95 ${
              showCustomSource
                ? "bg-gradient-to-r from-app-income to-app-income-end text-white shadow-lg shadow-green-500/50"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md"
            }`}
          >
            Other
          </button>
        </div>

        {showCustomSource && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="Enter custom income source..."
              value={customSource}
              onChange={(e) => {
                setCustomSource(e.target.value);
                setFormData({ ...formData, source: e.target.value });
              }}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:text-white transition-all"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Category (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g., Bonus, Commission, Dividend"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:text-white transition-all"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <FileText className="w-4 h-4 inline mr-2 text-green-600" />
          Description (Optional)
        </label>
        <textarea
          placeholder="Add notes about this income..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none dark:text-white transition-all"
        />
      </div>

      {/* Taxable & Recurring Checkboxes */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.taxable}
            onChange={(e) => setFormData({ ...formData, taxable: e.target.checked })}
            className="sr-only"
          />
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              formData.taxable
                ? "bg-green-600 border-green-600"
                : "border-gray-300 dark:border-gray-600"
            }`}
          >
            {formData.taxable && <Check className="w-4 h-4 text-white" />}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Taxable Income
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.recurring}
            onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
            className="sr-only"
          />
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              formData.recurring
                ? "bg-green-600 border-green-600"
                : "border-gray-300 dark:border-gray-600"
            }`}
          >
            {formData.recurring && <Check className="w-4 h-4 text-white" />}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Recurring (Monthly)
          </span>
        </label>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-2">
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !formData.source || !formData.amount}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-app-income to-app-income-end text-white rounded-xl font-semibold shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-500/60 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
              Processing...
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
