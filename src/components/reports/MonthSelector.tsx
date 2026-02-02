"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

export default function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const handlePreviousMonth = () => {
    onMonthChange(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(selectedMonth, 1));
  };

  const handleToday = () => {
    onMonthChange(new Date());
  };

  const isCurrentMonth = () => {
    const today = new Date();
    return (
      selectedMonth.getMonth() === today.getMonth() &&
      selectedMonth.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
      <button
        onClick={handlePreviousMonth}
        className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
        aria-label="Previous month"
      >
        <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>

      <div className="flex items-center justify-center gap-2 flex-1">
        <div className="text-center">
          <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {format(selectedMonth, "MMMM yyyy")}
          </p>
        </div>
        {!isCurrentMonth() && (
          <button
            onClick={handleToday}
            className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
          >
            Today
          </button>
        )}
      </div>

      <button
        onClick={handleNextMonth}
        className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
        aria-label="Next month"
      >
        <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>
    </div>
  );
}
