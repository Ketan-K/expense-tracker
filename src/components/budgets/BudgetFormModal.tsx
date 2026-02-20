"use client";

import { useState } from "react";
import { X, Plus, Copy } from "lucide-react";
import { getIconComponent } from "@/lib/types";
import { db, LocalCategory } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { format, subMonths } from "date-fns";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";
import { generateObjectId } from "@/lib/idGenerator";
import { processSyncQueue } from "@/lib/syncUtils";
import Modal from "@/components/shared/Modal";

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
  const { user, isLoading, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const { confirm, isOpen: isConfirmOpen, options, handleConfirm, handleCancel } = useConfirm();

  const monthString = format(currentMonth, "yyyy-MM");
  const lastMonthString = format(subMonths(currentMonth, 1), "yyyy-MM");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !amount || !user?.id) return;

    setLoading(true);
    try {
      const category = categories.find(c => c.name === selectedCategory);
      if (!category) throw new Error("Category not found");

      const budgetId = generateObjectId();
      const now = new Date();

      await db.budgets.add({
        _id: budgetId,
        userId: user.id,
        categoryId: category._id || category.name,
        amount: parseFloat(amount),
        month: monthString,
        synced: false,
        createdAt: now,
        updatedAt: now,
      });

      // Add to sync queue
      await db.syncQueue.add({
        collection: "budgets",
        action: "CREATE",
        data: {
          categoryId: category._id || category.name,
          amount: parseFloat(amount),
          month: monthString,
        },
        timestamp: Date.now(),
        status: "pending",
        retryCount: 0,
        localId: budgetId,
      });

      toast.success(`Budget set for ${category.name}`);
      setSelectedCategory("");
      setAmount("");
      onBudgetAdded();
      onClose();

      // Trigger sync if online
      if (navigator.onLine) {
        processSyncQueue(user.id);
      }
    } catch (error) {
      toast.error("Failed to create budget");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportLastMonth = async () => {
    if (!user?.id) return;

    setImporting(true);
    try {
      const lastMonthBudgets = await db.budgets
        .where("userId")
        .equals(user.id)
        .and(budget => budget.month === lastMonthString)
        .toArray();

      if (lastMonthBudgets.length === 0) {
        toast.error("No budgets found for last month");
        return;
      }

      const existingBudgets = await db.budgets
        .where("userId")
        .equals(user.id)
        .and(budget => budget.month === monthString)
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
        await Promise.all(existingBudgets.map(b => b._id && db.budgets.delete(b._id)));
      }

      const now = new Date();
      await Promise.all(
        lastMonthBudgets.map(async budget => {
          const budgetId = generateObjectId();

          const newBudget = {
            _id: budgetId,
            userId: user.id,
            categoryId: budget.categoryId,
            amount: budget.amount,
            month: monthString,
            synced: false,
            createdAt: now,
            updatedAt: now,
          };

          await db.budgets.add(newBudget);

          await db.syncQueue.add({
            collection: "budgets",
            action: "CREATE",
            data: {
              categoryId: budget.categoryId,
              amount: budget.amount,
              month: monthString,
            },
            timestamp: Date.now(),
            status: "pending",
            retryCount: 0,
            localId: budgetId,
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
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Set Monthly Budget"
        subtitle="Choose a category and set your spending limit"
        footer={
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleImportLastMonth}
              disabled={importing || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl sm:rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base active:scale-95 hover:shadow-md"
            >
              <Copy className="w-5 h-5" />
              {importing ? "Importing..." : "Import Last Month"}
            </button>
            <button
              type="submit"
              form="budget-form"
              disabled={!selectedCategory || !amount || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl sm:rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 active:scale-98"
            >
              <Plus className="w-5 h-5" />
              {loading ? "Adding..." : "Add Budget"}
            </button>
          </div>
        }
        gradientFrom="from-purple-50"
        gradientTo="to-purple-100"
        gradientDark="dark:to-purple-900/30"
        maxWidth="2xl"
        maxHeight="80vh"
      >
        <form
          id="budget-form"
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6"
        >
          {/* Month Display */}
          <div>
            <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
              Month
            </label>
            <div className="px-4 py-4 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl text-purple-600 dark:text-purple-400 font-bold text-lg sm:text-xl border-2 border-purple-200 dark:border-purple-800">
              {format(currentMonth, "MMMM yyyy")}
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                Category{" "}
                {selectedCategory && (
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">
                    • {selectedCategory}
                  </span>
                )}
              </label>
              {!selectedCategory && (
                <span className="text-xs text-gray-500 dark:text-gray-400">Select a category</span>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
              {categories.map(category => {
                const Icon = getIconComponent(category.icon);
                const isSelected = selectedCategory === category.name;
                return (
                  <button
                    key={category._id || category.name}
                    type="button"
                    onClick={() => setSelectedCategory(category.name)}
                    className={`px-2 py-2.5 rounded-lg font-medium transition-all text-xs active:scale-95 flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50"
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
              <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                Budget Amount
              </label>
              {amount && parseFloat(amount) > 0 && (
                <span className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
                  ₹{parseFloat(amount).toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl sm:text-2xl font-semibold text-gray-400 dark:text-gray-500">
                ₹
              </span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                className="w-full pl-10 pr-4 py-3 sm:py-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:border-indigo-500 text-xl sm:text-2xl font-semibold dark:text-white transition-all"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Quick select:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[1000, 2000, 5000, 10000].map(quickAmount => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount.toString())}
                    className={`px-4 py-3 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all hover:shadow-md active:scale-95 cursor-pointer border-2 ${
                      amount === quickAmount.toString()
                        ? "border-purple-500 dark:border-purple-400"
                        : "border-transparent"
                    }`}
                  >
                    ₹{quickAmount.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
