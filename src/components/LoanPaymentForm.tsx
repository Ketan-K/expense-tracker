"use client";

import { useState } from "react";
import { FileText, CreditCard } from "lucide-react";
import { format } from "date-fns";
import AmountInput from "@/components/shared/AmountInput";
import DatePicker from "@/components/shared/DatePicker";

interface LoanPaymentFormProps {
  loanId: string;
  outstandingAmount: number;
  onSubmit: (data: {
    loanId: string;
    amount: string;
    date: string;
    paymentMethod: string;
    notes: string;
  }) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  showCancel?: boolean;
}

export default function LoanPaymentForm({
  loanId,
  outstandingAmount,
  onSubmit,
  onCancel,
  submitLabel = "Add Payment",
  isSubmitting = false,
  showCancel = false,
}: LoanPaymentFormProps) {
  const [formData, setFormData] = useState({
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    paymentMethod: "cash",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(formData.amount);
    if (paymentAmount > outstandingAmount) {
      alert(`Payment amount cannot exceed outstanding amount of ₹${outstandingAmount.toLocaleString("en-IN")}`);
      return;
    }

    await onSubmit({
      loanId,
      ...formData,
    });

    setFormData({
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      paymentMethod: "cash",
      notes: "",
    });
  };

  const remainingAfterPayment = outstandingAmount - parseFloat(formData.amount || "0");

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
      {/* Outstanding Amount Display */}
      <div className="p-4 bg-gradient-to-r from-app-loans-light to-app-loans-light-end border-2 border-orange-200 dark:border-orange-800 rounded-xl">
        <div className="text-sm text-gray-600 dark:text-gray-400">Outstanding Amount</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          ₹{outstandingAmount.toLocaleString("en-IN")}
        </div>
      </div>

      {/* Payment Date */}
      <DatePicker
        value={formData.date}
        onChange={(date) => setFormData({ ...formData, date })}
        label="Payment Date"
      />

      {/* Payment Amount */}
      <AmountInput
        value={formData.amount}
        onChange={(amount) => setFormData({ ...formData, amount })}
        label="Payment Amount (₹)"
        quickAmounts={[500, 1000, 5000, 10000]}
      />

      {/* Remaining Amount Preview */}
      {formData.amount && parseFloat(formData.amount) > 0 && (
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Remaining after this payment
          </div>
          <div className={`text-xl font-semibold ${
            remainingAfterPayment === 0
              ? "text-green-600 dark:text-green-400"
              : "text-gray-900 dark:text-white"
          }`}>
            ₹{remainingAfterPayment.toLocaleString("en-IN")}
            {remainingAfterPayment === 0 && (
              <span className="text-sm ml-2">✓ Fully Paid</span>
            )}
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <CreditCard className="w-4 h-4 inline mr-2 text-indigo-600" />
          Payment Method
        </label>
        <div className="grid grid-cols-4 gap-2">
          {["cash", "card", "upi", "bank_transfer"].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setFormData({ ...formData, paymentMethod: method })}
              className={`px-3 py-3 rounded-xl font-medium capitalize transition-all text-xs active:scale-95 ${
                formData.paymentMethod === method
                  ? "bg-gradient-to-r from-app-gradient-from to-app-gradient-to text-white shadow-lg shadow-indigo-500/50"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md"
              }`}
            >
              {method === "bank_transfer" ? "Bank" : method}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <FileText className="w-4 h-4 inline mr-2 text-indigo-600" />
          Notes (Optional)
        </label>
        <textarea
          placeholder="Add notes about this payment..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
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
          disabled={isSubmitting || !formData.amount || parseFloat(formData.amount) <= 0}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-app-gradient-from to-app-gradient-to text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/60 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
