"use client";

import { getIconComponent } from "@/lib/types";
import { calculateBudgetStatus } from "@/lib/budgetUtils";
import { AlertCircle, Pencil, Archive } from "lucide-react";
import { createElement } from "react";

interface BudgetCardProps {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetAmount: number;
  spentAmount: number;
  budgetId?: string;
  onEdit?: (budgetId: string) => void;
  onArchive?: (budgetId: string) => void;
  isArchived?: boolean;
}

export default function BudgetCard({
  categoryName,
  categoryIcon,
  categoryColor,
  budgetAmount,
  spentAmount,
  budgetId,
  onEdit,
  onArchive,
  isArchived = false,
}: BudgetCardProps) {
  const { percentage, status, color, bgColor } = calculateBudgetStatus(spentAmount, budgetAmount);

  const remaining = budgetAmount - spentAmount;

  return (
    <div className="bg-gradient-to-br from-white via-gray-50 to-indigo-50/20 dark:from-gray-800 dark:via-gray-800 dark:to-indigo-900/10 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom duration-500">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: categoryColor }}
          >
            {createElement(getIconComponent(categoryIcon), { className: "w-5 h-5 text-white" })}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{categoryName}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ₹{spentAmount.toFixed(2)} of ₹{budgetAmount.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === "exceeded" || status === "danger" ? (
            <AlertCircle className={`w-5 h-5 ${color}`} />
          ) : null}
          {!isArchived && budgetId && onEdit && onArchive && (
            <>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onEdit(budgetId);
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Edit budget"
              >
                <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onArchive(budgetId);
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Archive budget"
              >
                <Archive className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 ${bgColor} transition-all duration-500`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className={`font-semibold ${color}`}>{percentage.toFixed(1)}%</span>
          <span className="text-gray-500 dark:text-gray-400 ml-1">used</span>
        </div>
        <div className="text-right">
          <span
            className={`font-semibold ${remaining >= 0 ? "text-gray-900 dark:text-white" : color}`}
          >
            ₹{Math.abs(remaining).toFixed(2)}
          </span>
          <span className="text-gray-500 dark:text-gray-400 ml-1">
            {remaining >= 0 ? "left" : "over"}
          </span>
        </div>
      </div>

      {/* Warning Messages */}
      {status === "exceeded" && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            Budget exceeded by ₹{Math.abs(remaining).toFixed(2)}!
          </p>
        </div>
      )}
      {status === "danger" && percentage < 100 && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            {(100 - percentage).toFixed(1)}% remaining - slow down spending
          </p>
        </div>
      )}
      {status === "warning" && (
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
            Approaching limit - {(100 - percentage).toFixed(1)}% remaining
          </p>
        </div>
      )}
    </div>
  );
}
