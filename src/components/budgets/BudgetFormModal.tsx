"use client";

import { useState } from "react";
import { X, Plus, Copy } from "lucide-react";
import { getIconComponent } from "@/lib/types";
import { db, LocalCategory } from "@/lib/db";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format, subMonths } from "date-fns";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";

interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: LocalCategory[];
  currentMonth: Date;
  onBudgetAdded: () => void;
}

export default function BudgetFormModal({
  isOpen,
  onClose,
  categories,
  currentMonth,
  onBudgetAdded,
}: BudgetFormModalProps) {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const { confirm, isOpen: isConfirmOpen, options, handleConfirm, handleCancel } = useConfirm();

  const monthString = format(currentMonth, "yyyy-MM");
  const lastMonthString = format(subMonths(currentMonth, 1), "yyyy-MM");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !amount || !session?.user?.id) return;

    setLoading(true);
    try {
      const category = categories.find((c) => c.name === selectedCategory);
      if (!category) throw new Error("Category not found");

      const budgetId = `budget-${session.user.id}-${category.id || category.name}-${monthString}`;

      await db.budgets.add({
        id: budgetId,
        userId: session.user.id,
        categoryId: category.id?.toString() || category.name,
        amount: parseFloat(amount),
        month: monthString,
        synced: false,
      });

      // Add to sync queue
      await db.syncQueue.add({
        collection: "budgets",
        action: "CREATE",
        data: {
          userId: session.user.id,
          categoryId: category.id?.toString() || category.name,
          amount: parseFloat(amount),
          month: monthString,
        },
        timestamp: Date.now(),
        status: "pending",
        retryCount: 0,
      });

      toast.success(`Budget set for ${category.name}`);
      setSelectedCategory("");
      setAmount("");
      onBudgetAdded();
      onClose();
    } catch (error) {
      toast.error("Failed to create budget");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportLastMonth = async () => {
    if (!session?.user?.id) return;

    setImporting(true);
    try {
      const lastMonthBudgets = await db.budgets
        .where("userId")
        .equals(session.user.id)
        .and((budget) => budget.month === lastMonthString)
        .toArray();

      if (lastMonthBudgets.length === 0) {
        toast.error("No budgets found for last month");
        return;
      }

      const existingBudgets = await db.budgets
        .where("userId")
        .equals(session.user.id)
        .and((budget) => budget.month === monthString)
        .toArray();

      if (existingBudgets.length > 0) {
        const confirmed = await confirm({
          title: "Replace Existing Budgets",
          message: "This will replace existing budgets for this month. Continue?",
          confirmText: "Replace",
          cancelText: "Cancel",
          variant: "warning",
        });

        if (!confirmed) {
          return;
        }
        await Promise.all(
          existingBudgets.map((b) => b.id && db.budgets.delete(b.id))
        );
      }

      await Promise.all(
        lastMonthBudgets.map(async (budget) => {
          const budgetId = `budget-${session.user.id}-${budget.categoryId}-${monthString}`;
          
          const newBudget = {
            id: budgetId,
            userId: session.user.id!,
            categoryId: budget.categoryId,
            amount: budget.amount,
            month: monthString,
            synced: false,
          };

          await db.budgets.add(newBudget);

          await db.syncQueue.add({
            collection: "budgets",
            action: "CREATE",
            data: newBudget,
            timestamp: Date.now(),
            status: "pending",
            retryCount: 0,
          });
        })
      );

      toast.success(`Imported ${lastMonthBudgets.length} budgets from last month`);
      onBudgetAdded();
      onClose();
    } catch (error) {
      toast.error("Failed to import budgets");
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
      />
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-indigo-200 dark:border-indigo-800 px-5 sm:px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Set Monthly Budget
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choose a category and set your spending limit
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 overflow-y-auto scrollbar-thin flex-1">
          {/* Month Display */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
              Month
            </label>
            <div className="px-4 py-3 sm:py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl sm:rounded-2xl text-gray-900 dark:text-white font-semibold text-base sm:text-lg border-2 border-indigo-200 dark:border-indigo-800">
              {format(currentMonth, "MMMM yyyy")}
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                Category {selectedCategory && <span className="text-indigo-600 dark:text-indigo-400">• {selectedCategory}</span>}
              </label>
              {!selectedCategory && (
                <span className="text-xs text-gray-500 dark:text-gray-400">Select a category</span>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
              {categories.map((category) => {
                const Icon = getIconComponent(category.icon);
                const isSelected = selectedCategory === category.name;
                return (
                  <button
                    key={category.id || category.name}
                    type="button"
                    onClick={() => setSelectedCategory(category.name)}
                    className={`px-2 py-2.5 rounded-lg font-medium transition-all text-xs active:scale-95 flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isSelected
                          ? "rgba(255, 255, 255, 0.2)"
                          : `${category.color}20`,
                      }}
                    >
                      <Icon
                        className="w-4 h-4"
                        style={{
                          color: isSelected ? "white" : category.color,
                        }}
                      />
                    </div>
                    <span className="truncate w-full text-center">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget Amount */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                Budget Amount
              </label>
              {amount && parseFloat(amount) > 0 && (
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  ₹{parseFloat(amount).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl sm:text-2xl font-semibold text-gray-400 dark:text-gray-500">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                className="w-full pl-10 pr-4 py-3 sm:py-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:border-indigo-500 text-xl sm:text-2xl font-semibold dark:text-white transition-all"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick select:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[1000, 2000, 5000, 10000].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount.toString())}
                    className={`px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all hover:shadow-md active:scale-95 cursor-pointer border-2 ${
                      amount === quickAmount.toString()
                        ? 'border-indigo-500 dark:border-indigo-400'
                        : 'border-transparent'
                    }`}
                  >
                    ₹{quickAmount.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={handleImportLastMonth}
              disabled={importing || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl sm:rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base active:scale-95 hover:shadow-md"
            >
              <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
              {importing ? "Importing..." : "Import Last Month"}
            </button>
            <button
              type="submit"
              disabled={!selectedCategory || !amount || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl sm:rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-98"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              {loading ? "Adding..." : "Add Budget"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
