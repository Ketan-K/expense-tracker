"use client";

import { DollarSign } from "lucide-react";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  quickAmounts?: number[];
  required?: boolean;
  showQuickButtons?: boolean;
}

export default function AmountInput({
  value,
  onChange,
  label = "Amount (₹)",
  placeholder = "0.00 or 100+50",
  quickAmounts = [100, 200, 500, 1000],
  required = true,
  showQuickButtons = true,
}: AmountInputProps) {
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue.includes("+")) {
      try {
        const numbers = inputValue
          .split("+")
          .map(n => parseFloat(n.trim()))
          .filter(n => !isNaN(n));
        if (numbers.length > 0) {
          const sum = numbers.reduce((acc, curr) => acc + curr, 0);
          onChange(sum.toString());
        }
      } catch (_error) {
        // Keep original value
      }
    }
  };

  const handleQuickAmount = (amount: number) => {
    const currentAmount = value.trim();
    if (currentAmount === "" || currentAmount === "0") {
      onChange(amount.toString());
    } else {
      const current = parseFloat(currentAmount);
      if (!isNaN(current)) {
        onChange((current + amount).toString());
      } else {
        onChange(currentAmount + "+" + amount);
      }
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        <DollarSign className="w-4 h-4 inline mr-2 text-[var(--color-app-gradient-from)]" />
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => {
          const inputValue = e.target.value;
          if (inputValue === "" || /^[\d+.]+$/.test(inputValue)) {
            onChange(inputValue);
          }
        }}
        onBlur={handleBlur}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xl font-semibold dark:text-white transition-all"
        required={required}
      />

      {showQuickButtons && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {quickAmounts.map(amount => (
            <button
              key={amount}
              type="button"
              onClick={() => handleQuickAmount(amount)}
              className="px-4 py-2 bg-gradient-to-r from-app-budgets-light to-app-budgets-light-end hover:brightness-95 dark:hover:brightness-110 text-[var(--color-app-budgets)] dark:text-pink-300 rounded-lg text-sm font-medium transition-all hover:shadow-md active:scale-95 whitespace-nowrap flex-shrink-0"
            >
              +₹{amount}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
