"use client";

import { useState, useEffect } from "react";
import { FileText, ArrowUpRight, ArrowDownRight, Percent } from "lucide-react";
import { format } from "date-fns";
import AmountInput from "@/components/shared/AmountInput";
import DatePicker from "@/components/shared/DatePicker";
import ContactSelector from "@/components/shared/ContactSelector";

interface LoanFormProps {
  initialData?: {
    contactId?: string;
    contactName?: string;
    direction?: "given" | "taken";
    principalAmount?: string;
    interestRate?: string;
    startDate?: string;
    dueDate?: string;
    description?: string;
  };
  onSubmit: (data: {
    contactId?: string;
    contactName: string;
    direction: "given" | "taken";
    principalAmount: string;
    interestRate?: string;
    startDate: string;
    dueDate?: string;
    description: string;
  }) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  showCancel?: boolean;
  userId: string;
}

export default function LoanForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Create Loan",
  isSubmitting = false,
  showCancel = false,
  userId,
}: LoanFormProps) {
  const [formData, setFormData] = useState({
    contactId: initialData?.contactId || undefined,
    contactName: initialData?.contactName || "",
    direction: (initialData?.direction || "given") as "given" | "taken",
    principalAmount: initialData?.principalAmount || "",
    interestRate: initialData?.interestRate || "",
    startDate: initialData?.startDate || format(new Date(), "yyyy-MM-dd"),
    dueDate: initialData?.dueDate || "",
    description: initialData?.description || "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        contactId: initialData.contactId || undefined,
        contactName: initialData.contactName || "",
        direction: (initialData.direction || "given") as "given" | "taken",
        principalAmount: initialData.principalAmount || "",
        interestRate: initialData.interestRate || "",
        startDate: initialData.startDate || format(new Date(), "yyyy-MM-dd"),
        dueDate: initialData.dueDate || "",
        description: initialData.description || "",
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);

    if (!initialData) {
      setFormData({
        contactId: undefined,
        contactName: "",
        direction: "given",
        principalAmount: "",
        interestRate: "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        dueDate: "",
        description: "",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
      {/* Direction */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Loan Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, direction: "given" })}
            className={`px-4 py-4 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2 ${
              formData.direction === "given"
                ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/50"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <ArrowUpRight className="w-5 h-5" />
            <div className="text-left">
              <div className="text-sm">I Gave</div>
              <div className="text-xs opacity-75">Money lent to someone</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, direction: "taken" })}
            className={`px-4 py-4 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2 ${
              formData.direction === "taken"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <ArrowDownRight className="w-5 h-5" />
            <div className="text-left">
              <div className="text-sm">I Took</div>
              <div className="text-xs opacity-75">Money borrowed from someone</div>
            </div>
          </button>
        </div>
      </div>

      {/* Contact */}
      <ContactSelector
        value={formData.contactId}
        contactName={formData.contactName}
        onChange={(contactId, contactName) =>
          setFormData({ ...formData, contactId, contactName })
        }
        userId={userId}
        label={formData.direction === "given" ? "Lent To" : "Borrowed From"}
      />

      {/* Principal Amount */}
      <AmountInput
        value={formData.principalAmount}
        onChange={(amount) => setFormData({ ...formData, principalAmount: amount })}
        label="Principal Amount (₹)"
        quickAmounts={[1000, 5000, 10000, 50000]}
      />

      {/* Interest Rate (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Percent className="w-4 h-4 inline mr-2 text-indigo-600" />
          Interest Rate (Optional)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="100"
          placeholder="e.g., 5.5"
          value={formData.interestRate}
          onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          For reference only. Interest is not automatically calculated.
        </p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DatePicker
          value={formData.startDate}
          onChange={(date) => setFormData({ ...formData, startDate: date })}
          label="Start Date"
        />
        <DatePicker
          value={formData.dueDate}
          onChange={(date) => setFormData({ ...formData, dueDate: date })}
          label="Due Date (Optional)"
          required={false}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <FileText className="w-4 h-4 inline mr-2 text-indigo-600" />
          Description (Optional)
        </label>
        <textarea
          placeholder="Add notes about this loan..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none dark:text-white transition-all"
        />
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
          disabled={isSubmitting || !formData.contactName || !formData.principalAmount}
          className={`flex-1 px-6 py-3 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
            formData.direction === "given"
              ? "bg-gradient-to-r from-orange-600 to-red-600 shadow-orange-500/50 hover:shadow-orange-500/60"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/50 hover:shadow-blue-500/60"
          }`}
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
